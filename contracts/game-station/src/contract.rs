//! Linera Game Station - Contract Implementation
//! 
//! This module implements the metered contract logic for the Game Station.
//! All operations that modify state are handled here.

#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{
    base::WithContractAbi,
    Contract, ContractRuntime,
};
use game_station::{GameType, Message, Operation};
use state::GameStationState;

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

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = GameStationState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        GameStationContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // Initialize the game station with default state
        log::info!("Linera Game Station initialized!");
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        let owner = self.runtime
            .authenticated_signer()
            .map(|s| format!("{:?}", s))
            .unwrap_or_else(|| "anonymous".to_string());
        
        match operation {
            Operation::SubmitSnakeScore { score } => {
                log::info!("Player {} submitting Snake score: {}", owner, score);
                
                // Ensure user profile exists
                self.state.get_or_create_user(&owner).await;
                
                // Update score and leaderboard
                let is_new_high = self.state.update_snake_score(&owner, score).await;
                
                if is_new_high {
                    log::info!("New high score for player {}!", owner);
                }
            }
            
            Operation::SubmitTicTacToeResult { won, opponent } => {
                log::info!("Player {} submitting TicTacToe result: won={}", owner, won);
                
                // Ensure user profile exists
                self.state.get_or_create_user(&owner).await;
                
                // Update stats
                self.state.update_tictactoe_result(&owner, won).await;
                
                // If there's an opponent, update their stats too
                if let Some(opp) = opponent {
                    self.state.get_or_create_user(&opp).await;
                    self.state.update_tictactoe_result(&opp, !won).await;
                }
            }
            
            Operation::UpdateProfile { username, avatar_id } => {
                log::info!("Player {} updating profile: {}", owner, username);
                
                let mut profile = self.state.get_or_create_user(&owner).await;
                profile.username = username;
                profile.avatar_id = avatar_id;
                let _ = self.state.users.insert(&owner, profile);
            }
            
            Operation::CreateRoom { game_type, max_players, entry_fee } => {
                log::info!("Player {} creating {:?} room", owner, game_type);
                
                let room_id = format!("{:?}-{}", game_type, self.runtime.system_time().micros());
                let room = state::GameRoom {
                    room_id: room_id.clone(),
                    game_type,
                    creator: owner.clone(),
                    players: vec![owner],
                    max_players,
                    entry_fee,
                    status: game_station::RoomStatus::Waiting,
                    game_state: None,
                    created_at: self.runtime.system_time().micros() as u64,
                };
                
                let _ = self.state.rooms.insert(&room_id, room);
            }
            
            Operation::JoinRoom { room_id } => {
                log::info!("Player {} joining room {}", owner, room_id);
                
                if let Some(mut room) = self.state.rooms.get(&room_id).await.ok().flatten() {
                    if room.players.len() < room.max_players as usize {
                        room.players.push(owner.clone());
                        
                        // Start game if room is full
                        if room.players.len() == room.max_players as usize {
                            room.status = game_station::RoomStatus::InProgress;
                        }
                        
                        let _ = self.state.rooms.insert(&room_id, room);
                    }
                }
            }
            
            Operation::SubmitMove { room_id, move_data } => {
                log::info!("Player {} submitting move in room {}", owner, room_id);
                // Move handling would be implemented based on game type
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::PlayerJoined { room_id, player } => {
                log::info!("Player {} joined room {}", player, room_id);
            }
            Message::GameMove { room_id, player, move_data: _ } => {
                log::info!("Player {} made move in room {}", player, room_id);
            }
            Message::GameEnded { room_id, winner, scores: _ } => {
                log::info!("Game {} ended. Winner: {:?}", room_id, winner);
            }
            Message::LeaderboardUpdate { game_type, entry } => {
                log::info!("Leaderboard update for {:?}: {}", game_type, entry.player_name);
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
