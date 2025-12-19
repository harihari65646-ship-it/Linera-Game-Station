//! Linera Game Station - Service Implementation
//! 
//! This module implements the unmetered GraphQL service for querying game state.
//! All read-only queries are handled here.

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Schema, SimpleObject};
use linera_sdk::{base::WithServiceAbi, Service, ServiceRuntime};
use game_station::{GameType, LeaderboardEntry, UserProfile};
use state::GameStationState;

pub struct GameStationService {
    state: GameStationState,
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
        GameStationService { state }
    }

    async fn handle_query(&self, query: Self::Query) -> Self::QueryResponse {
        Schema::build(QueryRoot { state: &self.state }, MutationRoot, EmptySubscription)
            .finish()
            .execute(query)
            .await
    }
}

/// GraphQL Query Root
struct QueryRoot<'a> {
    state: &'a GameStationState,
}

#[Object]
impl<'a> QueryRoot<'a> {
    /// Get a user's profile by wallet address
    async fn user_profile(&self, address: String) -> Option<UserProfile> {
        self.state.users.get(&address).await.ok().flatten()
    }
    
    /// Get the leaderboard for a specific game type
    async fn leaderboard(
        &self, 
        game_type: String, 
        limit: Option<u32>
    ) -> Vec<LeaderboardEntry> {
        let limit = limit.unwrap_or(10);
        self.state.get_leaderboard(&game_type, limit).await
    }
    
    /// Get a player's Snake high score
    async fn snake_high_score(&self, address: String) -> u32 {
        self.state.snake_high_scores.get(&address).await.ok().flatten().unwrap_or(0)
    }
    
    /// Get total games played across all players
    async fn total_games(&self) -> u64 {
        *self.state.total_games_played.get().unwrap_or(&0)
    }
    
    /// Get total registered players
    async fn total_players(&self) -> u64 {
        *self.state.total_players.get().unwrap_or(&0)
    }
    
    /// Get active game rooms
    async fn active_rooms(&self, game_type: Option<String>) -> Vec<RoomInfo> {
        // In a full implementation, this would iterate over rooms
        // For now, return empty as rooms are handled differently
        Vec::new()
    }
    
    /// Get room details by ID
    async fn room(&self, room_id: String) -> Option<RoomInfo> {
        if let Some(room) = self.state.rooms.get(&room_id).await.ok().flatten() {
            Some(RoomInfo {
                room_id: room.room_id,
                game_type: format!("{:?}", room.game_type),
                player_count: room.players.len() as u32,
                max_players: room.max_players as u32,
                status: format!("{:?}", room.status),
            })
        } else {
            None
        }
    }
    
    /// Get global stats
    async fn global_stats(&self) -> GlobalStats {
        GlobalStats {
            total_games: *self.state.total_games_played.get().unwrap_or(&0),
            total_players: *self.state.total_players.get().unwrap_or(&0),
            games_available: 4, // Snake, TicTacToe, SnakeLadders, Uno
        }
    }
}

/// Room information for GraphQL
#[derive(SimpleObject)]
struct RoomInfo {
    room_id: String,
    game_type: String,
    player_count: u32,
    max_players: u32,
    status: String,
}

/// Global stats for the game station
#[derive(SimpleObject)]
struct GlobalStats {
    total_games: u64,
    total_players: u64,
    games_available: u32,
}

/// Empty mutation root (mutations go through operations)
struct MutationRoot;

#[Object]
impl MutationRoot {
    /// Placeholder mutation - actual mutations use Operations
    async fn ping(&self) -> bool {
        true
    }
}
