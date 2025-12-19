//! Linera Game Station - State Definitions
//! 
//! This module defines the persistent state for the Game Station contract.

use linera_sdk::views::{MapView, RegisterView, RootView, ViewStorageContext};
use crate::{GameType, LeaderboardEntry, UserProfile, GameState, RoomStatus};

/// The main application state stored on-chain
#[derive(RootView)]
#[view(context = "ViewStorageContext")]
pub struct GameStationState {
    /// User profiles indexed by wallet address
    pub users: MapView<String, UserProfile>,
    
    /// Leaderboards indexed by game type
    pub leaderboards: MapView<String, Vec<LeaderboardEntry>>,
    
    /// Active game rooms indexed by room ID
    pub rooms: MapView<String, GameRoom>,
    
    /// High scores for Snake game indexed by player address
    pub snake_high_scores: MapView<String, u32>,
    
    /// Total games played counter
    pub total_games_played: RegisterView<u64>,
    
    /// Total players registered
    pub total_players: RegisterView<u64>,
}

/// A game room for multiplayer games
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GameRoom {
    pub room_id: String,
    pub game_type: GameType,
    pub creator: String,
    pub players: Vec<String>,
    pub max_players: u8,
    pub entry_fee: u64,
    pub status: RoomStatus,
    pub game_state: Option<GameState>,
    pub created_at: u64,
}

impl GameStationState {
    /// Get or create a user profile
    pub async fn get_or_create_user(&mut self, address: &str) -> UserProfile {
        if let Some(profile) = self.users.get(address).await.ok().flatten() {
            profile
        } else {
            let new_profile = UserProfile::default();
            let _ = self.users.insert(address, new_profile.clone());
            
            // Increment total players
            let current = self.total_players.get().unwrap_or(&0);
            let _ = self.total_players.set(*current + 1);
            
            new_profile
        }
    }
    
    /// Update a user's Snake high score
    pub async fn update_snake_score(&mut self, address: &str, score: u32) -> bool {
        let current_high = self.snake_high_scores.get(address).await.ok().flatten().unwrap_or(0);
        
        if score > current_high {
            let _ = self.snake_high_scores.insert(address, score);
            
            // Update user profile
            if let Some(mut profile) = self.users.get(address).await.ok().flatten() {
                profile.snake_high_score = score;
                profile.snake_games += 1;
                profile.xp += score as u64;
                profile.level = Self::calculate_level(profile.xp);
                let _ = self.users.insert(address, profile);
            }
            
            // Update leaderboard
            self.update_leaderboard("snake", address, score as u64).await;
            
            true
        } else {
            // Still update games played
            if let Some(mut profile) = self.users.get(address).await.ok().flatten() {
                profile.snake_games += 1;
                profile.xp += (score / 10) as u64;
                profile.level = Self::calculate_level(profile.xp);
                let _ = self.users.insert(address, profile);
            }
            false
        }
    }
    
    /// Update Tic-Tac-Toe stats
    pub async fn update_tictactoe_result(&mut self, address: &str, won: bool) {
        if let Some(mut profile) = self.users.get(address).await.ok().flatten() {
            if won {
                profile.tictactoe_wins += 1;
                profile.xp += 50;
            } else {
                profile.tictactoe_losses += 1;
                profile.xp += 10;
            }
            profile.level = Self::calculate_level(profile.xp);
            let _ = self.users.insert(address, profile);
        }
        
        // Increment total games
        let current = self.total_games_played.get().unwrap_or(&0);
        let _ = self.total_games_played.set(*current + 1);
    }
    
    /// Update the leaderboard for a game type
    async fn update_leaderboard(&mut self, game_type: &str, address: &str, score: u64) {
        let mut entries = self.leaderboards.get(game_type).await.ok().flatten().unwrap_or_default();
        
        // Check if player already exists
        let existing_idx = entries.iter().position(|e| e.player_address == address);
        
        if let Some(idx) = existing_idx {
            if entries[idx].score < score {
                entries[idx].score = score;
                entries[idx].games_played += 1;
                entries[idx].timestamp = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
            }
        } else {
            let profile = self.users.get(address).await.ok().flatten();
            entries.push(LeaderboardEntry {
                player_name: profile.map(|p| p.username).unwrap_or_else(|| address[..8].to_string()),
                player_address: address.to_string(),
                score,
                games_played: 1,
                win_rate: 100,
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            });
        }
        
        // Sort by score descending and keep top 100
        entries.sort_by(|a, b| b.score.cmp(&a.score));
        entries.truncate(100);
        
        let _ = self.leaderboards.insert(game_type, entries);
    }
    
    /// Calculate level from XP
    fn calculate_level(xp: u64) -> u32 {
        // Level formula: level = sqrt(xp / 100) + 1
        ((xp as f64 / 100.0).sqrt() as u32) + 1
    }
    
    /// Get leaderboard entries
    pub async fn get_leaderboard(&self, game_type: &str, limit: u32) -> Vec<LeaderboardEntry> {
        let entries = self.leaderboards.get(game_type).await.ok().flatten().unwrap_or_default();
        entries.into_iter().take(limit as usize).collect()
    }
}
