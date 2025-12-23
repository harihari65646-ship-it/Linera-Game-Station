//! Linera Game Station - Production Contract Implementation
#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::{Amount, ApplicationPermissions, ChainId, ChainOwnership, TimeoutConfig},
    Contract,
    ContractRuntime,
    views::{View, RootView}
};
use game_station::{GameType, GameMode, Message, Operation, RoomStatus, TournamentStatus, ChallengeStatus};
use state::GameStationState;
use std::collections::{HashMap, BTreeMap};
use std::iter;

pub struct GameStationContract {
    state: GameStationState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(GameStationContract);

impl WithContractAbi for GameStationContract {
    type Abi = game_station::GameStationAbi;
}

impl Contract for GameStationContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = game_station::GameEvent;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = GameStationState::load(runtime.root_view_storage_context()).await.expect("Failed to load state");
        GameStationContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        self.state.total_games.set(0);
        self.state.total_players.set(0);
        self.state.room_counter.set(0);
        self.state.tournament_counter.set(0);
        self.state.challenge_counter.set(0);
        self.state.active_room_ids.set(vec![]);
        self.state.active_tournament_ids.set(vec![]);

        // Store main chain ID for microchain architecture
        let main_chain_id = self.runtime.chain_id();
        self.state.main_chain_id.set(Some(main_chain_id));

        eprintln!("Linera Game Station initialized on chain {:?}", main_chain_id);
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        let owner = self.runtime.authenticated_signer().map(|s| format!("{:?}", s)).unwrap_or_else(|| "anonymous".to_string());
        let op_id = self.generate_operation_id(&operation, &owner);
        if self.is_operation_processed(&op_id).await { return; }

        let timestamp = self.runtime.system_time().micros() as u64;

        match operation {
            Operation::SubmitSnakeScore { score, game_mode } => {
                self.handle_submit_snake_score(owner, score, game_mode, timestamp).await;
            }
            Operation::SubmitTicTacToeResult { won, game_mode } => {
                self.handle_submit_tictactoe_result(owner, won, game_mode, timestamp).await;
            }
            Operation::SubmitSnakeLaddersResult { won, game_mode } => {
                self.handle_submit_snakeladders_result(owner, won, game_mode, timestamp).await;
            }
            Operation::SubmitUnoResult { won, game_mode } => {
                self.handle_submit_uno_result(owner, won, game_mode, timestamp).await;
            }
            Operation::UpdateProfile { username, avatar_id } => {
                self.handle_update_profile(owner, username, avatar_id).await;
            }
            Operation::CreateRoom { game_type, max_players, entry_fee, game_mode } => {
                self.handle_create_room(owner, game_type, max_players, entry_fee, game_mode, timestamp).await;
            }
            Operation::JoinRoom { room_id } => {
                self.handle_join_room(owner, room_id, timestamp).await;
            }
            Operation::LeaveRoom { room_id } => {
                self.handle_leave_room(owner, room_id).await;
            }
            Operation::MakeMove { room_id, move_data } => {
                self.handle_make_move(owner, room_id, move_data, timestamp).await;
            }
            Operation::CloseRoom { room_id } => {
                self.handle_close_room(room_id).await;
            }
            Operation::CreateTournament { name, game_type, max_players } => {
                self.handle_create_tournament(owner, name, game_type, max_players, timestamp).await;
            }
            Operation::JoinTournament { tournament_id } => {
                self.handle_join_tournament(owner, tournament_id).await;
            }
            Operation::StartTournament { tournament_id } => {
                self.handle_start_tournament(tournament_id).await;
            }
            Operation::AdvanceTournament { tournament_id, match_id, winner } => {
                self.handle_advance_tournament(tournament_id, match_id, winner).await;
            }
            Operation::SendFriendRequest { to_address } => {
                self.handle_send_friend_request(owner, to_address, timestamp).await;
            }
            Operation::AcceptFriendRequest { from_address } => {
                self.handle_accept_friend_request(owner, from_address, timestamp).await;
            }
            Operation::RejectFriendRequest { from_address } => {
                self.handle_reject_friend_request(owner, from_address).await;
            }
            Operation::RemoveFriend { friend_address } => {
                self.handle_remove_friend(owner, friend_address).await;
            }
            Operation::CreateChallenge { opponent, game_type, wager } => {
                self.handle_create_challenge(owner, opponent, game_type, wager, timestamp).await;
            }
            Operation::AcceptChallenge { challenge_id } => {
                self.handle_accept_challenge(owner, challenge_id, timestamp).await;
            }
            Operation::DeclineChallenge { challenge_id } => {
                self.handle_decline_challenge(challenge_id).await;
            }
        }
        self.mark_operation_processed(&op_id).await;
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::RoomCreated { room_id, creator, game_type } => {
                eprintln!("Room {} created by {} for {:?}", room_id, creator, game_type);
            }
            Message::PlayerJoinedRoom { room_id, player } => {
                if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
                    if !room.players.contains(&player) {
                        room.players.push(player.clone());
                        if room.players.len() as u8 >= room.max_players {
                            room.status = RoomStatus::InProgress;
                        }
                        let _ = self.state.rooms.insert(&room_id, room);
                    }
                }
            }
            Message::GameMove { room_id, player, move_data } => {
                if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
                    room.last_move_time = self.runtime.system_time().micros() as u64;
                    room.current_state = match room.game_type {
                        GameType::TicTacToe => self.process_tictactoe_move(&room.current_state, &move_data, &player, &room.players),
                        GameType::SnakeLadders => self.process_snakeladders_move(&room.current_state, &move_data, &player),
                        _ => room.current_state,
                    };
                    let _ = self.state.rooms.insert(&room_id, room);
                }
            }
            Message::GameEnded { room_id, winner } => {
                if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
                    room.status = RoomStatus::Finished;
                    room.winner = winner.clone();
                    let _ = self.state.rooms.insert(&room_id, room);
                    self.remove_from_active_rooms(&room_id).await;
                }
            }
            Message::TournamentStarted { tournament_id } => {
                eprintln!("Tournament {} started", tournament_id);
            }
            Message::MatchCompleted { tournament_id, match_id, winner } => {
                eprintln!("Match {} in tournament {} completed. Winner: {}", match_id, tournament_id, winner);
            }

            // Phase 2: Microchain message handlers
            Message::RoomChainReady { room_id, creator: _, game_type: _, room_chain_id } => {
                eprintln!("Room {} ready on chain {:?}", room_id, room_chain_id);

                // Confirm room is registered
                let stored_chain = self.state.room_chains.get(&room_id).await
                    .expect("Failed to get room chain");

                if stored_chain.is_none() {
                    eprintln!("Room chain not found in registry for room {}", room_id);
                }
            }

            Message::GameEndedWithStats { room_id, winner, player_stats, game_type, duration_seconds: _ } => {
                eprintln!("Game ended on room {}: winner = {:?}", room_id, winner);

                // Update all player profiles with stats from room chain
                for (player_id, score) in player_stats {
                    let mut profile = self.get_or_create_profile(&player_id).await;

                    // Update game-specific stats based on game type
                    match game_type {
                        GameType::TicTacToe => {
                            profile.tictactoe_stats.games_played += 1;
                            if Some(&player_id) == winner.as_ref() {
                                profile.tictactoe_stats.wins += 1;
                                profile.xp += 50;
                            } else {
                                profile.tictactoe_stats.losses += 1;
                                profile.xp += 10;
                            }
                        }
                        GameType::Snake => {
                            profile.snake_stats.games_played += 1;
                            profile.snake_stats.total_score += score as u64;
                            if score > profile.snake_stats.high_score {
                                profile.snake_stats.high_score = score;
                            }
                            profile.xp += (score / 10) as u64;
                        }
                        GameType::SnakeLadders => {
                            profile.snakeladders_stats.games_played += 1;
                            if Some(&player_id) == winner.as_ref() {
                                profile.snakeladders_stats.wins += 1;
                                profile.xp += 40;
                            } else {
                                profile.snakeladders_stats.losses += 1;
                                profile.xp += 10;
                            }
                        }
                        GameType::Uno => {
                            profile.uno_stats.games_played += 1;
                            if Some(&player_id) == winner.as_ref() {
                                profile.uno_stats.wins += 1;
                                profile.xp += 60;
                            } else {
                                profile.uno_stats.losses += 1;
                                profile.xp += 15;
                            }
                        }
                    }

                    // Level up logic
                    while profile.xp >= (profile.level as u64 * 1000) {
                        profile.xp -= profile.level as u64 * 1000;
                        profile.level += 1;
                    }

                    self.state.users
                        .insert(&player_id, profile.clone())
                        .expect("Failed to update user profile");

                    // Update leaderboard
                    let game_key = format!("{:?}", game_type).to_lowercase();
                    self.update_leaderboard(&game_key, &player_id, &profile.username, score).await;
                }

                // Clean up room chain reference
                self.state.room_chains
                    .remove(&room_id)
                    .expect("Failed to remove room chain");

                // Remove from active rooms
                self.remove_from_active_rooms(&room_id).await;

                // Update total games counter
                let total = self.state.total_games.get();
                self.state.total_games.set(*total + 1);

                // Emit event
                // TODO: Update emit API to match Linera SDK 0.15.8
                // self.runtime.emit(game_station::GameEvent::GameEnded {
                //     room_id,
                //     winner,
                //     duration_seconds,
                // });

                eprintln!("Game stats processed and player profiles updated");
            }

            // Placeholder handlers for room chain messages
            Message::InitializeRoom { .. } => {
                eprintln!("InitializeRoom message received on main chain (should only be on room chain)");
            }
            Message::PlayerJoiningRoom { .. } => {
                eprintln!("PlayerJoiningRoom message received on main chain (should only be on room chain)");
            }
            Message::ProcessMove { .. } => {
                eprintln!("ProcessMove message received on main chain (should only be on room chain)");
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl GameStationContract {
    async fn handle_submit_snake_score(&mut self, owner: String, score: u32, game_mode: GameMode, _timestamp: u64) {
        let mut profile = self.get_or_create_profile(&owner).await;

        if matches!(game_mode, GameMode::Solo | GameMode::Multiplayer) {
            if score > profile.snake_stats.high_score {
                profile.snake_stats.high_score = score;
            }
            profile.snake_stats.games_played += 1;
            profile.snake_stats.total_score += score as u64;

            let xp_gain = (score / 10) as u64;
            profile.xp += xp_gain;
            while profile.xp >= (profile.level as u64 * 1000) {
                profile.xp -= profile.level as u64 * 1000;
                profile.level += 1;
            }

            let _ = self.state.users.insert(&owner, profile.clone());

            self.update_leaderboard("snake_global", &owner, &profile.username, score).await;

            let total_games = self.state.total_games.get();
            self.state.total_games.set(*total_games + 1);
        }
    }

    async fn handle_submit_tictactoe_result(&mut self, owner: String, won: bool, game_mode: GameMode, _timestamp: u64) {
        let mut profile = self.get_or_create_profile(&owner).await;

        if matches!(game_mode, GameMode::Solo | GameMode::Multiplayer) {
            profile.tictactoe_stats.games_played += 1;
            if won {
                profile.tictactoe_stats.wins += 1;
                let xp_gain = 50;
                profile.xp += xp_gain;
            } else {
                profile.tictactoe_stats.losses += 1;
                let xp_gain = 10;
                profile.xp += xp_gain;
            }

            while profile.xp >= (profile.level as u64 * 1000) {
                profile.xp -= profile.level as u64 * 1000;
                profile.level += 1;
            }

            let _ = self.state.users.insert(&owner, profile.clone());

            let score = profile.tictactoe_stats.wins;
            self.update_leaderboard("tictactoe_global", &owner, &profile.username, score).await;

            let total_games = self.state.total_games.get();
            self.state.total_games.set(*total_games + 1);
        }
    }

    async fn handle_submit_snakeladders_result(&mut self, owner: String, won: bool, game_mode: GameMode, _timestamp: u64) {
        let mut profile = self.get_or_create_profile(&owner).await;

        if matches!(game_mode, GameMode::Solo | GameMode::Multiplayer) {
            profile.snakeladders_stats.games_played += 1;
            if won {
                profile.snakeladders_stats.wins += 1;
                let xp_gain = 100;
                profile.xp += xp_gain;
            } else {
                profile.snakeladders_stats.losses += 1;
                let xp_gain = 20;
                profile.xp += xp_gain;
            }

            while profile.xp >= (profile.level as u64 * 1000) {
                profile.xp -= profile.level as u64 * 1000;
                profile.level += 1;
            }

            let _ = self.state.users.insert(&owner, profile.clone());

            let score = profile.snakeladders_stats.wins;
            self.update_leaderboard("snakeladders_global", &owner, &profile.username, score).await;

            let total_games = self.state.total_games.get();
            self.state.total_games.set(*total_games + 1);
        }
    }

    async fn handle_submit_uno_result(&mut self, owner: String, won: bool, game_mode: GameMode, _timestamp: u64) {
        let mut profile = self.get_or_create_profile(&owner).await;

        if matches!(game_mode, GameMode::Solo | GameMode::Multiplayer) {
            profile.uno_stats.games_played += 1;
            if won {
                profile.uno_stats.wins += 1;
                let xp_gain = 80;
                profile.xp += xp_gain;
            } else {
                profile.uno_stats.losses += 1;
                let xp_gain = 15;
                profile.xp += xp_gain;
            }

            while profile.xp >= (profile.level as u64 * 1000) {
                profile.xp -= profile.level as u64 * 1000;
                profile.level += 1;
            }

            let _ = self.state.users.insert(&owner, profile.clone());

            let score = profile.uno_stats.wins;
            self.update_leaderboard("uno_global", &owner, &profile.username, score).await;

            let total_games = self.state.total_games.get();
            self.state.total_games.set(*total_games + 1);
        }
    }

    async fn handle_update_profile(&mut self, owner: String, username: String, avatar_id: u8) {
        let mut profile = self.get_or_create_profile(&owner).await;
        profile.username = username;
        profile.avatar_id = avatar_id;
        let _ = self.state.users.insert(&owner, profile);
    }

    async fn handle_create_room(&mut self, owner: String, game_type: GameType, max_players: u8, entry_fee: u64, game_mode: GameMode, timestamp: u64) {
        let room_counter = self.state.room_counter.get();
        let game_type_str = format!("{:?}", game_type).to_lowercase();
        let room_id = format!("room-{}-{}", game_type_str, room_counter);

        eprintln!("Creating microchain for room {}", room_id);

        // MICROCHAIN CREATION - ENABLED (based on microcard winning submission pattern)
        let current_owner = self.runtime
            .authenticated_signer()
            .expect("Failed to get authenticated signer");

        let app_id = self.runtime.application_id();
        let permissions = ApplicationPermissions::new_single(app_id.forget_abi());

        let ownership = ChainOwnership {
            super_owners: iter::once(current_owner).collect(),
            owners: BTreeMap::new(),
            multi_leader_rounds: 100,
            open_multi_leader_rounds: true,
            timeout_config: TimeoutConfig::default(),
        };

        let room_chain_id = self.runtime
            .open_chain(ownership, permissions, Amount::ZERO);

        eprintln!("✅ Room chain created: {:?}", room_chain_id);

        // Store room → chain mapping
        self.state.room_chains
            .insert(&room_id, room_chain_id)
            .expect("Failed to insert room chain mapping");

        self.state.chain_to_room
            .insert(&room_chain_id, room_id.clone())
            .expect("Failed to insert chain to room mapping");

        // IMPORTANT: Also store room on main chain for query access
        // The microchain handles gameplay, but main chain tracks room listing
        let creator_str = format!("{:?}", current_owner);
        let room = game_station::GameRoom {
            id: room_id.clone(),
            game_type,
            creator: creator_str.clone(),
            players: vec![creator_str.clone()],
            max_players,
            entry_fee,
            status: RoomStatus::Waiting,
            current_state: String::new(),
            winner: None,
            created_at: timestamp,
            last_move_time: timestamp,
            game_mode,
        };

        self.state.rooms
            .insert(&room_id, room)
            .expect("Failed to insert room");

        // Add to active rooms list
        let mut active_rooms = self.state.active_room_ids.get().clone();
        active_rooms.push(room_id.clone());
        self.state.active_room_ids.set(active_rooms);

        // Send initialization message to new room chain
        let main_chain_id = self.runtime.chain_id();
        let init_msg = Message::InitializeRoom {
            room_id: room_id.clone(),
            game_type,
            creator: creator_str,
            max_players,
            creator_chain: main_chain_id,
        };

        self.runtime
            .prepare_message(init_msg)
            .send_to(room_chain_id);

        eprintln!("✅ Initialization message sent to room chain {:?}", room_chain_id);

        // Update counter
        self.state.room_counter.set(*room_counter + 1);

        eprintln!("✅ Room {} created on microchain {} and registered on main chain", room_id, room_chain_id);
    }

    async fn handle_join_room(&mut self, owner: String, room_id: String, _timestamp: u64) {
        // Always update the main chain's room record for query visibility
        if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
            if room.status == RoomStatus::Waiting && !room.players.contains(&owner) && (room.players.len() as u8) < room.max_players {
                room.players.push(owner.clone());
                eprintln!("Player {} joined room {} on main chain ({}/{})",
                    owner, room_id, room.players.len(), room.max_players);

                if room.players.len() as u8 >= room.max_players {
                    room.status = RoomStatus::InProgress;
                    eprintln!("Room {} is now IN_PROGRESS", room_id);
                }
                let _ = self.state.rooms.insert(&room_id, room);
            }
        }

        // Also send message to room microchain for game state
        if let Ok(Some(room_chain_id)) = self.state.room_chains.get(&room_id).await {
            eprintln!("Sending join message to room chain {:?} for room {}", room_chain_id, room_id);

            let msg = Message::PlayerJoiningRoom {
                room_id: room_id.clone(),
                player: owner.clone(),
            };

            self.runtime
                .prepare_message(msg)
                .send_to(room_chain_id);
        }
    }

    async fn handle_leave_room(&mut self, owner: String, room_id: String) {
        if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
            if room.status == RoomStatus::Waiting {
                room.players.retain(|p| p != &owner);
                if room.players.is_empty() {
                    let _ = self.state.rooms.remove(&room_id);
                    self.remove_from_active_rooms(&room_id).await;
                } else {
                    let _ = self.state.rooms.insert(&room_id, room);
                }
            }
        }
    }

    async fn handle_make_move(&mut self, owner: String, room_id: String, move_data: String, timestamp: u64) {
        // Route move to room chain if exists (Phase 2)
        if let Ok(Some(room_chain_id)) = self.state.room_chains.get(&room_id).await {
            eprintln!("Routing move to room chain {:?} for room {}", room_chain_id, room_id);

            let msg = Message::ProcessMove {
                room_id: room_id.clone(),
                player: owner,
                move_data,
            };

            self.runtime
                .prepare_message(msg)
                .send_to(room_chain_id);
        } else {
            // Fallback: Process on main chain (existing behavior)
            if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
                if room.status == RoomStatus::InProgress && room.players.contains(&owner) {
                    room.last_move_time = timestamp;

                    let new_state = match room.game_type {
                        GameType::TicTacToe => self.process_tictactoe_move(&room.current_state, &move_data, &owner, &room.players),
                        GameType::SnakeLadders => self.process_snakeladders_move(&room.current_state, &move_data, &owner),
                        _ => room.current_state.clone(),
                    };

                    room.current_state = new_state;

                    let game_won = match room.game_type {
                        GameType::TicTacToe => self.check_tictactoe_win(&room.current_state),
                        GameType::SnakeLadders => self.check_snakeladders_win(&room.current_state, &owner),
                        _ => false,
                    };

                    if game_won {
                        room.status = RoomStatus::Finished;
                        room.winner = Some(owner);
                        self.remove_from_active_rooms(&room_id).await;
                    }

                    let _ = self.state.rooms.insert(&room_id, room);
                }
            }
        }
    }

    async fn handle_close_room(&mut self, room_id: String) {
        if let Ok(Some(mut room)) = self.state.rooms.get(&room_id).await {
            room.status = RoomStatus::Finished;
            let _ = self.state.rooms.insert(&room_id, room);
            self.remove_from_active_rooms(&room_id).await;
        }
    }

    async fn handle_create_tournament(&mut self, owner: String, name: String, game_type: GameType, max_players: u8, timestamp: u64) {
        let tournament_counter = self.state.tournament_counter.get();
        let tournament_id = format!("tournament-{}", tournament_counter);

        let tournament = game_station::Tournament {
            id: tournament_id.clone(),
            name,
            game_type,
            creator: owner,
            participants: vec![],
            max_players,
            status: TournamentStatus::Registration,
            current_round: 0,
            brackets: vec![],
            created_at: timestamp,
        };

        let _ = self.state.tournaments.insert(&tournament_id, tournament);
        self.state.tournament_counter.set(*tournament_counter + 1);

        let mut active_tournaments = self.state.active_tournament_ids.get().clone();
        active_tournaments.push(tournament_id);
        self.state.active_tournament_ids.set(active_tournaments);
    }

    async fn handle_join_tournament(&mut self, owner: String, tournament_id: String) {
        if let Ok(Some(mut tournament)) = self.state.tournaments.get(&tournament_id).await {
            if tournament.status == TournamentStatus::Registration &&
               !tournament.participants.contains(&owner) &&
               (tournament.participants.len() as u8) < tournament.max_players {
                tournament.participants.push(owner);
                let _ = self.state.tournaments.insert(&tournament_id, tournament);
            }
        }
    }

    async fn handle_start_tournament(&mut self, tournament_id: String) {
        if let Ok(Some(mut tournament)) = self.state.tournaments.get(&tournament_id).await {
            if tournament.status == TournamentStatus::Registration && tournament.participants.len() >= 2 {
                tournament.status = TournamentStatus::InProgress;
                tournament.current_round = 1;
                tournament.brackets = self.generate_tournament_brackets(&tournament.participants);
                let _ = self.state.tournaments.insert(&tournament_id, tournament);
            }
        }
    }

    async fn handle_advance_tournament(&mut self, tournament_id: String, match_id: String, winner: String) {
        if let Ok(Some(mut tournament)) = self.state.tournaments.get(&tournament_id).await {
            if tournament.status == TournamentStatus::InProgress {
                let mut winners = vec![winner];

                tournament.brackets.retain(|bracket| {
                    let match_key = format!("{}-{}", bracket.player1, bracket.player2);
                    if match_key == match_id {
                        false
                    } else {
                        winners.push(bracket.player1.clone());
                        true
                    }
                });

                if tournament.brackets.is_empty() {
                    if winners.len() == 1 {
                        tournament.status = TournamentStatus::Completed;
                    } else {
                        tournament.current_round += 1;
                        tournament.brackets = self.generate_tournament_brackets(&winners);
                    }
                }

                let _ = self.state.tournaments.insert(&tournament_id, tournament);
            }
        }
    }

    async fn handle_send_friend_request(&mut self, owner: String, to_address: String, timestamp: u64) {
        let mut requests = self.state.friend_requests.get(&to_address).await.ok().flatten().unwrap_or_default();
        let request = game_station::FriendRequest {
            from_address: owner,
            timestamp,
        };

        if !requests.iter().any(|r| r.from_address == request.from_address) {
            requests.push(request);
            let _ = self.state.friend_requests.insert(&to_address, requests);
        }
    }

    async fn handle_accept_friend_request(&mut self, owner: String, from_address: String, timestamp: u64) {
        let mut requests = self.state.friend_requests.get(&owner).await.ok().flatten().unwrap_or_default();
        requests.retain(|r| r.from_address != from_address);
        let _ = self.state.friend_requests.insert(&owner, requests);

        let mut owner_friends = self.state.friends.get(&owner).await.ok().flatten().unwrap_or_default();
        if !owner_friends.iter().any(|f| f.address == from_address) {
            owner_friends.push(game_station::FriendEntry {
                address: from_address.clone(),
                added_at: timestamp,
            });
            let _ = self.state.friends.insert(&owner, owner_friends);
        }

        let mut from_friends = self.state.friends.get(&from_address).await.ok().flatten().unwrap_or_default();
        if !from_friends.iter().any(|f| f.address == owner) {
            from_friends.push(game_station::FriendEntry {
                address: owner,
                added_at: timestamp,
            });
            let _ = self.state.friends.insert(&from_address, from_friends);
        }
    }

    async fn handle_reject_friend_request(&mut self, owner: String, from_address: String) {
        let mut requests = self.state.friend_requests.get(&owner).await.ok().flatten().unwrap_or_default();
        requests.retain(|r| r.from_address != from_address);
        let _ = self.state.friend_requests.insert(&owner, requests);
    }

    async fn handle_remove_friend(&mut self, owner: String, friend_address: String) {
        let mut owner_friends = self.state.friends.get(&owner).await.ok().flatten().unwrap_or_default();
        owner_friends.retain(|f| f.address != friend_address);
        let _ = self.state.friends.insert(&owner, owner_friends);

        let mut friend_friends = self.state.friends.get(&friend_address).await.ok().flatten().unwrap_or_default();
        friend_friends.retain(|f| f.address != owner);
        let _ = self.state.friends.insert(&friend_address, friend_friends);
    }

    async fn handle_create_challenge(&mut self, owner: String, opponent: String, game_type: GameType, wager: u64, timestamp: u64) {
        let challenge_counter = self.state.challenge_counter.get();
        let challenge_id = format!("challenge-{}", challenge_counter);

        let challenge = game_station::Challenge {
            id: challenge_id.clone(),
            challenger: owner,
            opponent,
            game_type,
            wager,
            status: ChallengeStatus::Pending,
            created_at: timestamp,
            expires_at: timestamp + (24 * 60 * 60 * 1_000_000),
        };

        let _ = self.state.challenges.insert(&challenge_id, challenge);
        self.state.challenge_counter.set(*challenge_counter + 1);
    }

    async fn handle_accept_challenge(&mut self, owner: String, challenge_id: String, timestamp: u64) {
        if let Ok(Some(mut challenge)) = self.state.challenges.get(&challenge_id).await {
            if challenge.opponent == owner && challenge.status == ChallengeStatus::Pending && timestamp < challenge.expires_at {
                challenge.status = ChallengeStatus::Accepted;
                let _ = self.state.challenges.insert(&challenge_id, challenge);
            }
        }
    }

    async fn handle_decline_challenge(&mut self, challenge_id: String) {
        if let Ok(Some(mut challenge)) = self.state.challenges.get(&challenge_id).await {
            if challenge.status == ChallengeStatus::Pending {
                challenge.status = ChallengeStatus::Declined;
                let _ = self.state.challenges.insert(&challenge_id, challenge);
            }
        }
    }

    async fn get_or_create_profile(&mut self, address: &str) -> game_station::UserProfile {
        if let Ok(Some(profile)) = self.state.users.get(address).await {
            profile
        } else {
            let profile = game_station::UserProfile {
                address: address.to_string(),
                username: format!("Player{}", &address[..8]),
                avatar_id: 0,
                level: 1,
                xp: 0,
                snake_stats: Default::default(),
                tictactoe_stats: Default::default(),
                snakeladders_stats: Default::default(),
                uno_stats: Default::default(),
                joined_at: self.runtime.system_time().micros() as u64,
            };
            let _ = self.state.users.insert(address, profile.clone());
            let total_players = self.state.total_players.get();
            self.state.total_players.set(*total_players + 1);
            profile
        }
    }

    async fn update_leaderboard(&mut self, game_key: &str, player_id: &str, player_name: &str, score: u32) {
        let mut leaderboard = self.state.leaderboards.get(&game_key.to_string()).await.ok().flatten().unwrap_or_default();

        let entry = game_station::LeaderboardEntry {
            player_id: player_id.to_string(),
            player_name: player_name.to_string(),
            score,
            rank: 0,
        };

        if let Some(existing) = leaderboard.iter_mut().find(|e| e.player_id == player_id) {
            if score > existing.score {
                *existing = entry;
            }
        } else {
            leaderboard.push(entry);
        }

        leaderboard.sort_by(|a, b| b.score.cmp(&a.score));

        for (i, entry) in leaderboard.iter_mut().enumerate() {
            entry.rank = (i + 1) as u32;
        }

        leaderboard.truncate(100);

        let _ = self.state.leaderboards.insert(&game_key.to_string(), leaderboard);
    }

    async fn remove_from_active_rooms(&mut self, room_id: &str) {
        let mut active_rooms = self.state.active_room_ids.get().clone();
        active_rooms.retain(|r| r != room_id);
        self.state.active_room_ids.set(active_rooms);
    }

    fn process_tictactoe_move(&self, current_state: &str, move_data: &str, player: &str, players: &[String]) -> String {
        let parts: Vec<&str> = move_data.split(',').collect();
        if parts.len() != 2 {
            return current_state.to_string();
        }

        let x: usize = parts[0].parse().unwrap_or(0);
        let y: usize = parts[1].parse().unwrap_or(0);

        if x >= 3 || y >= 3 {
            return current_state.to_string();
        }

        let mut board = if current_state.is_empty() {
            vec![vec!['-'; 3]; 3]
        } else {
            current_state.lines().map(|line| line.chars().collect()).collect()
        };

        let symbol = if player == &players[0] { 'X' } else { 'O' };

        if board[y][x] == '-' {
            board[y][x] = symbol;
        }

        board.iter().map(|row| row.iter().collect::<String>()).collect::<Vec<_>>().join("\n")
    }

    fn check_tictactoe_win(&self, state: &str) -> bool {
        if state.is_empty() {
            return false;
        }

        let board: Vec<Vec<char>> = state.lines().map(|line| line.chars().collect()).collect();
        if board.len() != 3 {
            return false;
        }

        for row in &board {
            if row[0] != '-' && row[0] == row[1] && row[1] == row[2] {
                return true;
            }
        }

        for x in 0..3 {
            if board[0][x] != '-' && board[0][x] == board[1][x] && board[1][x] == board[2][x] {
                return true;
            }
        }

        (board[0][0] != '-' && board[0][0] == board[1][1] && board[1][1] == board[2][2]) ||
        (board[0][2] != '-' && board[0][2] == board[1][1] && board[1][1] == board[2][0])
    }

    fn process_snakeladders_move(&self, current_state: &str, move_data: &str, player: &str) -> String {
        let mut positions: HashMap<String, u32> = HashMap::new();

        if !current_state.is_empty() {
            for entry in current_state.split(',') {
                let parts: Vec<&str> = entry.split(':').collect();
                if parts.len() == 2 {
                    if let Ok(pos) = parts[1].parse::<u32>() {
                        positions.insert(parts[0].to_string(), pos);
                    }
                }
            }
        }

        let dice: u32 = move_data.parse().unwrap_or(0);
        if dice < 1 || dice > 6 {
            return current_state.to_string();
        }

        let current_pos = *positions.get(player).unwrap_or(&0);
        let mut new_pos = current_pos + dice;

        new_pos = match new_pos {
            16 => 6, 47 => 26, 49 => 11, 56 => 53, 62 => 19, 64 => 60, 87 => 24, 93 => 73, 95 => 75, 98 => 78,
            1 => 38, 4 => 14, 9 => 31, 21 => 42, 28 => 84, 36 => 44, 51 => 67, 71 => 91, 80 => 100,
            _ => new_pos,
        };

        if new_pos > 100 {
            new_pos = current_pos;
        }

        positions.insert(player.to_string(), new_pos);
        positions.iter().map(|(p, pos)| format!("{}:{}", p, pos)).collect::<Vec<_>>().join(",")
    }

    fn check_snakeladders_win(&self, state: &str, player: &str) -> bool {
        for entry in state.split(',') {
            let parts: Vec<&str> = entry.split(':').collect();
            if parts.len() == 2 && parts[0] == player {
                if let Ok(pos) = parts[1].parse::<u32>() {
                    return pos >= 100;
                }
            }
        }
        false
    }

    fn generate_tournament_brackets(&self, participants: &[String]) -> Vec<game_station::TournamentBracket> {
        let mut brackets = Vec::new();
        for i in (0..participants.len()).step_by(2) {
            if i + 1 < participants.len() {
                brackets.push(game_station::TournamentBracket {
                    player1: participants[i].clone(),
                    player2: participants[i + 1].clone(),
                });
            }
        }
        brackets
    }

    fn generate_operation_id(&self, operation: &Operation, owner: &str) -> String {
        use std::time::{SystemTime, UNIX_EPOCH};
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_micros();
        format!("{:?}-{}-{}", operation, owner, now)
    }

    async fn is_operation_processed(&self, op_id: &str) -> bool {
        self.state.processed_operations.get(op_id).await.ok().flatten().unwrap_or(false)
    }

    async fn mark_operation_processed(&mut self, op_id: &str) {
        let _ = self.state.processed_operations.insert(op_id, true);
    }
}
