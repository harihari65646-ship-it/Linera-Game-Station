//! Linera Game Station - ABI Definitions
//! 
//! This module defines the Application Binary Interface (ABI) for the
//! Linera Game Station smart contract. It includes all types for operations,
//! messages, and queries.

use linera_sdk::base::{AccountOwner, Amount, Timestamp};
use serde::{Deserialize, Serialize};
use async_graphql::{InputObject, SimpleObject};

/// The ABI for the Game Station application
linera_sdk::graphql_service_interface!(GameStationAbi, GameStationState);

/// Types of games supported by the Game Station
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "graphql", derive(async_graphql::Enum))]
pub enum GameType {
    Snake,
    TicTacToe,
    SnakeLadders,
    Uno,
}

/// Direction for Snake game
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

/// Position on the game board
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, SimpleObject)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

/// Snake game state
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct SnakeGameState {
    pub snake: Vec<Position>,
    pub food: Position,
    pub direction: Direction,
    pub score: u32,
    pub is_alive: bool,
    pub speed: u32,
}

impl Default for SnakeGameState {
    fn default() -> Self {
        Self {
            snake: vec![Position { x: 10, y: 10 }],
            food: Position { x: 15, y: 15 },
            direction: Direction::Right,
            score: 0,
            is_alive: true,
            speed: 1,
        }
    }
}

/// Tic-Tac-Toe player mark
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum PlayerMark {
    X,
    O,
}

/// Tic-Tac-Toe game state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicTacToeState {
    pub board: [[Option<PlayerMark>; 3]; 3],
    pub current_turn: PlayerMark,
    pub winner: Option<PlayerMark>,
    pub player_x: Option<AccountOwner>,
    pub player_o: Option<AccountOwner>,
    pub move_count: u8,
}

impl Default for TicTacToeState {
    fn default() -> Self {
        Self {
            board: [[None; 3]; 3],
            current_turn: PlayerMark::X,
            winner: None,
            player_x: None,
            player_o: None,
            move_count: 0,
        }
    }
}

/// Combined game state enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameState {
    Snake(SnakeGameState),
    TicTacToe(TicTacToeState),
}

/// Status of a game room
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum RoomStatus {
    Waiting,
    InProgress,
    Finished,
}

/// A leaderboard entry
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct LeaderboardEntry {
    pub player_name: String,
    pub player_address: String,
    pub score: u64,
    pub games_played: u32,
    pub win_rate: u32,
    pub timestamp: u64,
}

/// User profile stored on-chain
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct UserProfile {
    pub username: String,
    pub avatar_id: u8,
    pub level: u32,
    pub xp: u64,
    pub snake_high_score: u32,
    pub snake_games: u32,
    pub tictactoe_wins: u32,
    pub tictactoe_losses: u32,
    pub total_tokens_won: u64,
}

impl Default for UserProfile {
    fn default() -> Self {
        Self {
            username: String::new(),
            avatar_id: 0,
            level: 1,
            xp: 0,
            snake_high_score: 0,
            snake_games: 0,
            tictactoe_wins: 0,
            tictactoe_losses: 0,
            total_tokens_won: 0,
        }
    }
}

/// Operations that can be performed on the Game Station
#[derive(Debug, Serialize, Deserialize)]
pub enum Operation {
    /// Submit a Snake game score
    SubmitSnakeScore { score: u32 },
    
    /// Submit Tic-Tac-Toe game result
    SubmitTicTacToeResult { 
        won: bool,
        opponent: Option<String>,
    },
    
    /// Update user profile
    UpdateProfile {
        username: String,
        avatar_id: u8,
    },
    
    /// Create a new game room
    CreateRoom {
        game_type: GameType,
        max_players: u8,
        entry_fee: u64,
    },
    
    /// Join an existing room
    JoinRoom {
        room_id: String,
    },
    
    /// Submit a move in a multiplayer game
    SubmitMove {
        room_id: String,
        move_data: Vec<u8>,
    },
}

/// Messages for cross-chain communication
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Notify that a player joined a room
    PlayerJoined {
        room_id: String,
        player: String,
    },
    
    /// Broadcast a game move
    GameMove {
        room_id: String,
        player: String,
        move_data: Vec<u8>,
    },
    
    /// Game ended notification
    GameEnded {
        room_id: String,
        winner: Option<String>,
        scores: Vec<(String, u64)>,
    },
    
    /// Leaderboard update
    LeaderboardUpdate {
        game_type: GameType,
        entry: LeaderboardEntry,
    },
}

/// Query input for leaderboard
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct LeaderboardQuery {
    pub game_type: Option<GameType>,
    pub limit: Option<u32>,
    pub time_filter: Option<String>,
}
