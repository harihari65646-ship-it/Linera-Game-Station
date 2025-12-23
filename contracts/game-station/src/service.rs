//! Linera Game Station - Service Implementation

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use std::sync::Arc;

use async_graphql::{EmptySubscription, Object, Schema};
use linera_sdk::{linera_base_types::WithServiceAbi, views::View, Service, ServiceRuntime};
use game_station::{
    UserProfile, GlobalStats, GameRoom, Tournament, FriendEntry,
    FriendRequest, Challenge, GameType, GameMode, LeaderboardEntry, RoomStatus,
    CreateRoomResponse, MutationResponse, MakeMoveResponse,
    CreateTournamentResponse, CreateChallengeResponse, AcceptChallengeResponse,
};
use state::GameStationState;

pub struct GameStationService {
    state: GameStationState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(GameStationService);

impl WithServiceAbi for GameStationService {
    type Abi = game_station::GameStationAbi;
}

impl Service for GameStationService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = GameStationState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        GameStationService {
            state,
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        // Load all state data for queries
        let total_games = *self.state.total_games.get();
        let total_players = *self.state.total_players.get();
        let active_room_ids = self.state.active_room_ids.get().clone();
        let active_tournament_ids = self.state.active_tournament_ids.get().clone();

        // Load rooms
        let mut rooms = Vec::new();
        for room_id in &active_room_ids {
            if let Ok(Some(room)) = self.state.rooms.get(room_id).await {
                rooms.push(room);
            }
        }

        // Load tournaments
        let mut tournaments = Vec::new();
        for tournament_id in &active_tournament_ids {
            if let Ok(Some(tournament)) = self.state.tournaments.get(tournament_id).await {
                tournaments.push(tournament);
            }
        }

        // Create state cache for QueryRoot
        let state_cache = StateCache {
            total_games,
            total_players,
            rooms,
            tournaments,
        };

        let schema = Schema::build(
            QueryRoot {
                state_cache,
                runtime: self.runtime.clone(),
            },
            MutationRoot {
                runtime: self.runtime.clone(),
            },
            EmptySubscription,
        )
        .finish();

        schema.execute(query).await
    }
}

/// Cached state data for GraphQL queries
#[derive(Clone)]
struct StateCache {
    total_games: u64,
    total_players: u64,
    rooms: Vec<GameRoom>,
    tournaments: Vec<Tournament>,
}

/// GraphQL Query Root
struct QueryRoot {
    state_cache: StateCache,
    runtime: Arc<ServiceRuntime<GameStationService>>,
}

#[Object]
impl QueryRoot {
    /// Get total games played across all players
    async fn total_games(&self) -> u64 {
        self.state_cache.total_games
    }

    /// Get total registered players
    async fn total_players(&self) -> u64 {
        self.state_cache.total_players
    }

    /// Get global stats
    async fn global_stats(&self) -> GlobalStats {
        GlobalStats {
            total_games: self.state_cache.total_games,
            total_players: self.state_cache.total_players,
            active_rooms: self.state_cache.rooms.len() as u32,
            active_tournaments: self.state_cache.tournaments.len() as u32,
        }
    }

    /// Get user profile by address
    async fn user_profile(&self, address: String) -> Option<UserProfile> {
        // Load state fresh for this query
        let state = GameStationState::load(self.runtime.root_view_storage_context())
            .await
            .ok()?;
        state.users.get(&address).await.ok().flatten()
    }

    /// Get snake high score for a user
    async fn snake_high_score(&self, address: String) -> Option<u32> {
        let state = GameStationState::load(self.runtime.root_view_storage_context())
            .await
            .ok()?;
        state.snake_high_scores.get(&address).await.ok().flatten()
    }

    /// Get all active game rooms
    async fn active_rooms(&self) -> Vec<GameRoom> {
        self.state_cache.rooms.iter()
            .filter(|r| r.status == RoomStatus::Waiting || r.status == RoomStatus::InProgress)
            .cloned()
            .collect()
    }

    /// Get a specific game room by ID
    async fn room(&self, room_id: String) -> Option<GameRoom> {
        self.state_cache.rooms.iter()
            .find(|r| r.id == room_id)
            .cloned()
    }

    /// Get all active tournaments
    async fn active_tournaments(&self) -> Vec<Tournament> {
        self.state_cache.tournaments.clone()
    }

    /// Get a specific tournament by ID
    async fn tournament(&self, tournament_id: String) -> Option<Tournament> {
        self.state_cache.tournaments.iter()
            .find(|t| t.id == tournament_id)
            .cloned()
    }

    /// Get user's friend list
    async fn friends(&self, address: String) -> Vec<FriendEntry> {
        let state = match GameStationState::load(self.runtime.root_view_storage_context()).await {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        state.friends.get(&address).await.ok().flatten().unwrap_or_default()
    }

    /// Get user's pending friend requests
    async fn friend_requests(&self, address: String) -> Vec<FriendRequest> {
        let state = match GameStationState::load(self.runtime.root_view_storage_context()).await {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        state.friend_requests.get(&address).await.ok().flatten().unwrap_or_default()
    }

    /// Get user's challenges (both sent and received)
    async fn challenges(&self, address: String) -> Vec<Challenge> {
        let state = match GameStationState::load(self.runtime.root_view_storage_context()).await {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let challenge_ids = state.user_challenges.get(&address).await.ok().flatten().unwrap_or_default();
        let mut challenges = Vec::new();
        for id in challenge_ids {
            if let Ok(Some(challenge)) = state.challenges.get(&id).await {
                challenges.push(challenge);
            }
        }
        challenges
    }

    /// Get a specific challenge by ID
    async fn challenge(&self, challenge_id: String) -> Option<Challenge> {
        let state = GameStationState::load(self.runtime.root_view_storage_context())
            .await
            .ok()?;
        state.challenges.get(&challenge_id).await.ok().flatten()
    }

    /// Get leaderboard for a specific game type
    async fn leaderboard(&self, game_type: GameType, limit: Option<i32>) -> Vec<LeaderboardEntry> {
        let state = match GameStationState::load(self.runtime.root_view_storage_context()).await {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let key = match game_type {
            GameType::Snake => "snake",
            GameType::TicTacToe => "tictactoe",
            GameType::SnakeLadders => "snakeladders",
            GameType::Uno => "uno",
        };

        let entries = state.leaderboards.get(&key.to_string()).await.ok().flatten().unwrap_or_default();
        let limit = limit.unwrap_or(10) as usize;
        entries.into_iter().take(limit).collect()
    }

    /// Get the chain ID for a room (Phase 2: Microchains)
    async fn room_chain_id(&self, room_id: String) -> Option<String> {
        let state = GameStationState::load(self.runtime.root_view_storage_context())
            .await
            .ok()?;

        let chain_id = state.room_chains.get(&room_id).await.ok().flatten()?;
        Some(format!("{}", chain_id))
    }

    /// Get room details from its microchain (Phase 2: Microchains)
    async fn room_details(&self, room_id: String) -> Option<RoomDetails> {
        let state = GameStationState::load(self.runtime.root_view_storage_context())
            .await
            .ok()?;

        let chain_id = state.room_chains.get(&room_id).await.ok().flatten()?;

        Some(RoomDetails {
            room_id,
            chain_id: format!("{}", chain_id),
            status: "Active".to_string(),
        })
    }
}

/// Room details with microchain information
#[derive(async_graphql::SimpleObject)]
struct RoomDetails {
    room_id: String,
    chain_id: String,
    status: String,
}

/// Mutation root with runtime for scheduling operations
struct MutationRoot {
    runtime: Arc<ServiceRuntime<GameStationService>>,
}

#[Object]
impl MutationRoot {
    /// Submit Snake game score
    async fn submit_snake_score(&self, score: i32, game_mode: GameMode) -> MutationResponse {
        let op = game_station::Operation::SubmitSnakeScore {
            score: score as u32,
            game_mode,
        };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Score submitted successfully".to_string(),
        }
    }

    /// Submit Tic-Tac-Toe result
    async fn submit_tictactoe_result(&self, won: bool, game_mode: GameMode) -> MutationResponse {
        let op = game_station::Operation::SubmitTicTacToeResult { won, game_mode };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Result submitted successfully".to_string(),
        }
    }

    /// Submit Snake & Ladders result
    async fn submit_snakeladders_result(&self, won: bool, game_mode: GameMode) -> MutationResponse {
        let op = game_station::Operation::SubmitSnakeLaddersResult { won, game_mode };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Result submitted successfully".to_string(),
        }
    }

    /// Submit UNO result
    async fn submit_uno_result(&self, won: bool, game_mode: GameMode) -> MutationResponse {
        let op = game_station::Operation::SubmitUnoResult { won, game_mode };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Result submitted successfully".to_string(),
        }
    }

    /// Update user profile
    async fn update_profile(&self, username: String, avatar_id: i32) -> MutationResponse {
        let op = game_station::Operation::UpdateProfile {
            username,
            avatar_id: avatar_id as u8
        };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Profile updated successfully".to_string(),
        }
    }

    /// Create a new multiplayer game room
    async fn create_room(&self, game_type: GameType, max_players: i32, entry_fee: i32, game_mode: GameMode) -> CreateRoomResponse {
        let op = game_station::Operation::CreateRoom {
            game_type,
            max_players: max_players as u8,
            entry_fee: entry_fee as u64,
            game_mode,
        };
        self.runtime.schedule_operation(&op);
        CreateRoomResponse {
            room_id: "pending".to_string(),
            success: true,
        }
    }

    /// Join an existing game room
    async fn join_room(&self, room_id: String) -> MutationResponse {
        let op = game_station::Operation::JoinRoom { room_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Joined room successfully".to_string(),
        }
    }

    /// Leave a game room
    async fn leave_room(&self, room_id: String) -> MutationResponse {
        let op = game_station::Operation::LeaveRoom { room_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Left room successfully".to_string(),
        }
    }

    /// Make a move in a game room
    async fn make_move(&self, room_id: String, move_data: String) -> MakeMoveResponse {
        let op = game_station::Operation::MakeMove { room_id, move_data };
        self.runtime.schedule_operation(&op);
        MakeMoveResponse {
            success: true,
            game_over: false,
            winner: None,
        }
    }

    /// Close a game room
    async fn close_room(&self, room_id: String) -> MutationResponse {
        let op = game_station::Operation::CloseRoom { room_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Room closed successfully".to_string(),
        }
    }

    /// Create a tournament
    async fn create_tournament(&self, name: String, game_type: GameType, max_players: i32) -> CreateTournamentResponse {
        let op = game_station::Operation::CreateTournament {
            name,
            game_type,
            max_players: max_players as u8,
        };
        self.runtime.schedule_operation(&op);
        CreateTournamentResponse {
            tournament_id: "pending".to_string(),
            success: true,
        }
    }

    /// Join a tournament
    async fn join_tournament(&self, tournament_id: String) -> MutationResponse {
        let op = game_station::Operation::JoinTournament { tournament_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Joined tournament successfully".to_string(),
        }
    }

    /// Start a tournament
    async fn start_tournament(&self, tournament_id: String) -> MutationResponse {
        let op = game_station::Operation::StartTournament { tournament_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Tournament started successfully".to_string(),
        }
    }

    /// Advance tournament to next round
    async fn advance_tournament(&self, tournament_id: String, match_id: String, winner: String) -> MutationResponse {
        let op = game_station::Operation::AdvanceTournament {
            tournament_id,
            match_id,
            winner,
        };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Tournament advanced successfully".to_string(),
        }
    }

    /// Send a friend request
    async fn send_friend_request(&self, to_address: String) -> MutationResponse {
        let op = game_station::Operation::SendFriendRequest { to_address };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Friend request sent successfully".to_string(),
        }
    }

    /// Accept a friend request
    async fn accept_friend_request(&self, from_address: String) -> MutationResponse {
        let op = game_station::Operation::AcceptFriendRequest { from_address };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Friend request accepted successfully".to_string(),
        }
    }

    /// Reject a friend request
    async fn reject_friend_request(&self, from_address: String) -> MutationResponse {
        let op = game_station::Operation::RejectFriendRequest { from_address };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Friend request rejected successfully".to_string(),
        }
    }

    /// Remove a friend
    async fn remove_friend(&self, address: String) -> MutationResponse {
        let op = game_station::Operation::RemoveFriend { friend_address: address };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Friend removed successfully".to_string(),
        }
    }

    /// Create a challenge
    async fn create_challenge(&self, opponent: String, game_type: GameType, wager: i32) -> CreateChallengeResponse {
        let op = game_station::Operation::CreateChallenge {
            opponent,
            game_type,
            wager: wager as u64,
        };
        self.runtime.schedule_operation(&op);
        CreateChallengeResponse {
            challenge_id: "pending".to_string(),
            success: true,
        }
    }

    /// Accept a challenge
    async fn accept_challenge(&self, challenge_id: String) -> AcceptChallengeResponse {
        let op = game_station::Operation::AcceptChallenge { challenge_id };
        self.runtime.schedule_operation(&op);
        AcceptChallengeResponse {
            room_id: Some("pending".to_string()),
            success: true,
        }
    }

    /// Decline a challenge
    async fn decline_challenge(&self, challenge_id: String) -> MutationResponse {
        let op = game_station::Operation::DeclineChallenge { challenge_id };
        self.runtime.schedule_operation(&op);
        MutationResponse {
            success: true,
            message: "Challenge declined successfully".to_string(),
        }
    }
}
