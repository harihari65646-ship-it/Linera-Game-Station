//! Linera Game Station - Production Contract Implementation
#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use linera_sdk::{base::WithContractAbi, Contract, ContractRuntime};
use game_station::{GameType, GameMode, Message, Operation, RoomStatus, TournamentStatus, ChallengeStatus, GameEvent};
use state::GameStationState;
use std::collections::HashMap;

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
        let state = GameStationState::load(runtime.root_view_storage_context()).await.expect("Failed to load state");
        GameStationContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        log::info!("Linera Game Station initialized!");
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        let owner = self.runtime.authenticated_signer().map(|s| format!("{:?}", s)).unwrap_or_else(|| "anonymous".to_string());
        let op_id = self.generate_operation_id(&operation, &owner);
        if self.is_operation_processed(&op_id).await { return; }

        match operation {
            Operation::CreateTournament { name, game_type, max_players } => {
                let tournament_counter = self.state.tournament_counter.get();
                let tournament_id = format!("tournament-{}", tournament_counter);
                let tournament = state::Tournament {
                    id: tournament_id.clone(), name, game_type, creator: owner, participants: vec![],
                    max_players, status: TournamentStatus::Registration, current_round: 0, brackets: vec![],
                    created_at: self.runtime.system_time().micros() as u64,
                };
                self.state.tournaments.insert(&tournament_id, tournament).expect("Failed");
                self.state.tournament_counter.set(*tournament_counter + 1);
                let mut active_tournaments = self.state.active_tournament_ids.get().clone();
                active_tournaments.push(tournament_id);
                self.state.active_tournament_ids.set(active_tournaments);
            }
            Operation::SendFriendRequest { to_address } => {
                let mut requests = self.state.friend_requests.get(&to_address).await.ok().flatten().unwrap_or_default();
                let request = state::FriendRequest { from_address: owner, timestamp: self.runtime.system_time().micros() as u64 };
                if !requests.iter().any(|r| r.from_address == request.from_address) {
                    requests.push(request);
                    self.state.friend_requests.insert(&to_address, requests).expect("Failed");
                }
            }
            _ => {}
        }
        self.mark_operation_processed(&op_id).await;
    }

    async fn execute_message(&mut self, _message: Message) {}
    async fn store(mut self) { self.state.save().await.expect("Failed to save state"); }
}

impl GameStationContract {
    async fn get_or_create_profile(&mut self, address: &str) -> state::UserProfile {
        if let Ok(Some(profile)) = self.state.users.get(address).await { profile }
        else {
            let profile = state::UserProfile {
                address: address.to_string(), username: format!("Player{}", &address[..8]), avatar_id: 0,
                level: 1, xp: 0, snake_stats: Default::default(), tictactoe_stats: Default::default(),
                snakeladders_stats: Default::default(), uno_stats: Default::default(),
                joined_at: self.runtime.system_time().micros() as u64,
            };
            self.state.users.insert(address, profile.clone()).expect("Failed");
            let total_players = self.state.total_players.get();
            self.state.total_players.set(*total_players + 1);
            profile
        }
    }

    async fn update_leaderboard(&mut self, game_key: &str, player_id: &str, player_name: &str, score: u32) {
        let mut leaderboard = self.state.leaderboards.get(&game_key.to_string()).await.ok().flatten().unwrap_or_default();
        let entry = game_station::LeaderboardEntry { player_id: player_id.to_string(), player_name: player_name.to_string(), score, rank: 0 };
        if let Some(existing) = leaderboard.iter_mut().find(|e| e.player_id == player_id) {
            if score > existing.score { *existing = entry; }
        } else { leaderboard.push(entry); }
        leaderboard.sort_by(|a, b| b.score.cmp(&a.score));
        for (i, entry) in leaderboard.iter_mut().enumerate() { entry.rank = (i + 1) as u32; }
        leaderboard.truncate(100);
        self.state.leaderboards.insert(&game_key.to_string(), leaderboard).expect("Failed");
    }

    async fn remove_from_active_rooms(&mut self, room_id: &str) {
        let mut active_rooms = self.state.active_room_ids.get().clone();
        active_rooms.retain(|r| r != room_id);
        self.state.active_room_ids.set(active_rooms);
    }

    fn process_tictactoe_move(&self, current_state: &str, move_data: &str, player: &str, players: &[String]) -> String {
        let parts: Vec<&str> = move_data.split(',').collect();
        if parts.len() != 2 { return current_state.to_string(); }
        let x: usize = parts[0].parse().unwrap_or(0);
        let y: usize = parts[1].parse().unwrap_or(0);
        if x >= 3 || y >= 3 { return current_state.to_string(); }
        let mut board = if current_state.is_empty() { vec![vec!['-'; 3]; 3] }
        else { current_state.lines().map(|line| line.chars().collect()).collect() };
        let symbol = if player == &players[0] { 'X' } else { 'O' };
        if board[y][x] == '-' { board[y][x] = symbol; }
        board.iter().map(|row| row.iter().collect::<String>()).collect::<Vec<_>>().join("\n")
    }

    fn check_tictactoe_win(&self, state: &str) -> bool {
        if state.is_empty() { return false; }
        let board: Vec<Vec<char>> = state.lines().map(|line| line.chars().collect()).collect();
        if board.len() != 3 { return false; }
        for row in &board { if row[0] != '-' && row[0] == row[1] && row[1] == row[2] { return true; } }
        for x in 0..3 { if board[0][x] != '-' && board[0][x] == board[1][x] && board[1][x] == board[2][x] { return true; } }
        (board[0][0] != '-' && board[0][0] == board[1][1] && board[1][1] == board[2][2]) ||
        (board[0][2] != '-' && board[0][2] == board[1][1] && board[1][1] == board[2][0])
    }

    fn process_snakeladders_move(&self, current_state: &str, move_data: &str, player: &str) -> String {
        let mut positions: HashMap<String, u32> = HashMap::new();
        if !current_state.is_empty() {
            for entry in current_state.split(',') {
                let parts: Vec<&str> = entry.split(':').collect();
                if parts.len() == 2 {
                    if let Ok(pos) = parts[1].parse::<u32>() { positions.insert(parts[0].to_string(), pos); }
                }
            }
        }
        let dice: u32 = move_data.parse().unwrap_or(0);
        if dice < 1 || dice > 6 { return current_state.to_string(); }
        let current_pos = *positions.get(player).unwrap_or(&0);
        let mut new_pos = current_pos + dice;
        new_pos = match new_pos {
            16 => 6, 47 => 26, 49 => 11, 56 => 53, 62 => 19, 64 => 60, 87 => 24, 93 => 73, 95 => 75, 98 => 78,
            1 => 38, 4 => 14, 9 => 31, 21 => 42, 28 => 84, 36 => 44, 51 => 67, 71 => 91, 80 => 100, _ => new_pos,
        };
        if new_pos > 100 { new_pos = current_pos; }
        positions.insert(player.to_string(), new_pos);
        positions.iter().map(|(p, pos)| format!("{}:{}", p, pos)).collect::<Vec<_>>().join(",")
    }

    fn check_snakeladders_win(&self, state: &str, player: &str) -> bool {
        for entry in state.split(',') {
            let parts: Vec<&str> = entry.split(':').collect();
            if parts.len() == 2 && parts[0] == player {
                if let Ok(pos) = parts[1].parse::<u32>() { return pos >= 100; }
            }
        }
        false
    }

    fn generate_tournament_brackets(&self, participants: &[String]) -> Vec<(String, String)> {
        let mut brackets = Vec::new();
        for i in (0..participants.len()).step_by(2) {
            if i + 1 < participants.len() {
                brackets.push((participants[i].clone(), participants[i + 1].clone()));
            }
        }
        brackets
    }

    fn generate_operation_id(&self, operation: &Operation, owner: &str) -> String {
        format!("{:?}-{}-{}", operation, owner, self.runtime.system_time().micros())
    }

    async fn is_operation_processed(&self, op_id: &str) -> bool {
        self.state.processed_operations.get(op_id).await.ok().flatten().unwrap_or(false)
    }

    async fn mark_operation_processed(&mut self, op_id: &str) {
        let _ = self.state.processed_operations.insert(op_id, true);
    }
}
