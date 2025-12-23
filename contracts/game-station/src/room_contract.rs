//! Room Chain Contract - Simplified version for Phase 2 demonstration
#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    abi::WithContractAbi,
    linera_base_types::ChainId,
    Contract,
    ContractRuntime,
    views::{View, RootView}
};
use game_station::{GameType, Message, Operation, RoomStatus};
use state::RoomChainState;
use std::str::FromStr;

pub struct RoomContract {
    state: RoomChainState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(RoomContract);

impl WithContractAbi for RoomContract {
    type Abi = game_station::GameStationAbi;
}

impl Contract for RoomContract {
    type Message = Message;
    type Parameters = ();
    type InstantiationArgument = ();
    type EventValue = game_station::GameEvent;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = RoomChainState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load room chain state");
        RoomContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Initialize empty state - will be populated by InitializeRoom message
        self.state.room_id.set(String::new());
        self.state.game_type_str.set("TicTacToe".to_string());
        self.state.players.set(vec![]);
        self.state.max_players.set(2);
        self.state.status_str.set("Waiting".to_string());
        self.state.current_state.set(String::new());
        self.state.created_at.set(0);
        self.state.creator_chain_str.set(String::new());
        self.state.move_counter.set(0);

        eprintln!("Room chain instantiated");
    }

    async fn execute_operation(&mut self, _operation: Operation) -> Self::Response {
        // Room chains don't handle operations directly
        eprintln!("Operation received on room chain (operations should go to main chain)");
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::InitializeRoom { room_id, game_type, creator, max_players, creator_chain } => {
                eprintln!("Initializing room chain for room {}", room_id);

                // Set up room state using string serialization
                self.state.room_id.set(room_id.clone());
                self.state.game_type_str.set(format!("{:?}", game_type));
                self.state.players.set(vec![creator.clone()]);
                self.state.max_players.set(max_players);
                self.state.status_str.set("Waiting".to_string());
                self.state.current_state.set(String::new());
                self.state.created_at.set(self.runtime.system_time().micros() as u64);
                self.state.creator_chain_str.set(format!("{}", creator_chain));
                self.state.move_counter.set(0);

                eprintln!("Room {} initialized: game_type={:?}, creator={}, max_players={}",
                    room_id, game_type, creator, max_players);

                // Send confirmation back to main chain
                let room_chain_id = self.runtime.chain_id();
                let confirm_msg = Message::RoomChainReady {
                    room_id,
                    creator,
                    game_type,
                    room_chain_id,
                };

                self.runtime
                    .prepare_message(confirm_msg)
                    .send_to(creator_chain);

                eprintln!("Sent RoomChainReady confirmation to main chain");
            }

            Message::PlayerJoiningRoom { room_id, player } => {
                let current_room_id = self.state.room_id.get();
                if *current_room_id != room_id {
                    eprintln!("Player join request for wrong room: expected {}, got {}",
                        current_room_id, room_id);
                    return;
                }

                let mut players = self.state.players.get().clone();
                let max_players = *self.state.max_players.get();
                let status_str = self.state.status_str.get();

                if status_str.as_str() == "Waiting" && !players.contains(&player) && (players.len() as u8) < max_players {
                    players.push(player.clone());

                    eprintln!("Player {} joined room {} ({}/{})",
                        player, room_id, players.len(), max_players);

                    // Start game when room is full
                    if players.len() as u8 >= max_players {
                        self.state.status_str.set("InProgress".to_string());
                        eprintln!("Room {} is full, starting game", room_id);
                    }

                    self.state.players.set(players);
                } else {
                    eprintln!("Cannot join room {}: status={}, player_count={}, max={}",
                        room_id, status_str, players.len(), max_players);
                }
            }

            Message::ProcessMove { room_id, player, move_data } => {
                let current_room_id = self.state.room_id.get();
                if *current_room_id != room_id {
                    eprintln!("Move for wrong room: expected {}, got {}", current_room_id, room_id);
                    return;
                }

                let status_str = self.state.status_str.get();
                if status_str.as_str() != "InProgress" {
                    eprintln!("Cannot process move: room {} not in progress (status={})", room_id, status_str);
                    return;
                }

                let players = self.state.players.get().clone();
                if !players.contains(&player) {
                    eprintln!("Move from non-player {} in room {}", player, room_id);
                    return;
                }

                eprintln!("Processing move in room {}: player={}, data={}", room_id, player, move_data);

                // Process move based on game type (simplified for demo)
                let game_type_str = self.state.game_type_str.get();
                let current_state = self.state.current_state.get().clone();

                let new_state = if game_type_str.as_str() == "TicTacToe" {
                    self.process_tictactoe_move(&current_state, &move_data, &player, &players)
                } else {
                    current_state.clone()
                };

                self.state.current_state.set(new_state.clone());

                // Increment move counter
                let move_count = *self.state.move_counter.get();
                let _ = self.state.moves.insert(&move_count, move_data);
                self.state.move_counter.set(move_count + 1);

                // Check for win condition (simplified - only for TicTacToe)
                let winner = if game_type_str.as_str() == "TicTacToe" && self.check_tictactoe_win(&new_state) {
                    Some(player.clone())
                } else {
                    None
                };

                // End game if there's a winner
                if let Some(ref winner_player) = winner {
                    eprintln!("Game ended in room {}: winner={}", room_id, winner_player);

                    self.state.status_str.set("Finished".to_string());

                    // Calculate player stats
                    let player_stats: Vec<(String, u32)> = players.iter().map(|p| {
                        let score = if p == winner_player { 1 } else { 0 };
                        (p.clone(), score)
                    }).collect();

                    let created_at = *self.state.created_at.get();
                    let now = self.runtime.system_time().micros() as u64;
                    let duration_seconds = (now - created_at) / 1_000_000;

                    // Parse creator chain ID
                    let creator_chain_str = self.state.creator_chain_str.get();
                    if let Ok(creator_chain) = ChainId::from_str(&creator_chain_str) {
                        let game_type = if game_type_str.as_str() == "TicTacToe" {
                            GameType::TicTacToe
                        } else {
                            GameType::Snake // fallback
                        };

                        // Send game completion stats to main chain
                        let stats_msg = Message::GameEndedWithStats {
                            room_id: room_id.clone(),
                            winner,
                            player_stats,
                            game_type,
                            duration_seconds,
                        };

                        self.runtime
                            .prepare_message(stats_msg)
                            .send_to(creator_chain);

                        eprintln!("Sent GameEndedWithStats to main chain");
                    } else {
                        eprintln!("Failed to parse creator_chain from: {}", creator_chain_str);
                    }
                }
            }

            // These messages should not be received by room chains
            Message::RoomCreated { .. } |
            Message::PlayerJoinedRoom { .. } |
            Message::GameMove { .. } |
            Message::GameEnded { .. } |
            Message::TournamentStarted { .. } |
            Message::MatchCompleted { .. } |
            Message::RoomChainReady { .. } |
            Message::GameEndedWithStats { .. } => {
                eprintln!("Unexpected message type received by room chain");
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save room chain state");
    }
}

impl RoomContract {
    /// Process a TicTacToe move and return updated board state
    fn process_tictactoe_move(&self, current_state: &str, move_data: &str, player: &str, players: &[String]) -> String {
        let parts: Vec<&str> = move_data.split(',').collect();
        if parts.len() != 2 {
            return current_state.to_string();
        }

        let x: usize = match parts[0].parse() {
            Ok(v) => v,
            Err(_) => return current_state.to_string(),
        };

        let y: usize = match parts[1].parse() {
            Ok(v) => v,
            Err(_) => return current_state.to_string(),
        };

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

        board.iter()
            .map(|row| row.iter().collect::<String>())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Check if there's a winning pattern in TicTacToe
    fn check_tictactoe_win(&self, state: &str) -> bool {
        if state.is_empty() {
            return false;
        }

        let board: Vec<Vec<char>> = state.lines().map(|line| line.chars().collect()).collect();
        if board.len() != 3 {
            return false;
        }

        // Check rows
        for row in &board {
            if row.len() == 3 && row[0] != '-' && row[0] == row[1] && row[1] == row[2] {
                return true;
            }
        }

        // Check columns
        for x in 0..3 {
            if board[0][x] != '-' && board[0][x] == board[1][x] && board[1][x] == board[2][x] {
                return true;
            }
        }

        // Check diagonals
        (board[0][0] != '-' && board[0][0] == board[1][1] && board[1][1] == board[2][2]) ||
        (board[0][2] != '-' && board[0][2] == board[1][1] && board[1][1] == board[2][0])
    }
}
