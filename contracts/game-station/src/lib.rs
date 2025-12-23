//! Linera Game Station - Complete ABI Definitions

use serde::{Deserialize, Serialize};
use async_graphql::{Request, Response, SimpleObject, InputObject};
use linera_sdk::linera_base_types::ChainId;

/// The ABI for the Game Station application
pub struct GameStationAbi;

impl linera_sdk::abi::ContractAbi for GameStationAbi {
    type Operation = Operation;
    type Response = ();
}

impl linera_sdk::abi::ServiceAbi for GameStationAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Types of games supported
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, async_graphql::Enum)]
pub enum GameType {
    Snake,
    TicTacToe,
    SnakeLadders,
    Uno,
}

/// Game mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum GameMode {
    Solo,
    Practice,
    Multiplayer,
}

/// Room status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum RoomStatus {
    Waiting,
    InProgress,
    Finished,
}

/// Tournament status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum TournamentStatus {
    Registration,
    InProgress,
    Completed,
}

/// Challenge status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, async_graphql::Enum)]
pub enum ChallengeStatus {
    Pending,
    Accepted,
    Declined,
    Completed,
}

/// Game events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameEvent {
    ScoreSubmitted { player: String, game_type: GameType, score: u32 },
    RoomCreated { room_id: String, game_type: GameType, creator: String, max_players: u8, room_chain_id: String },
    PlayerJoinedRoom { room_id: String, player: String },
    GameEnded { room_id: String, winner: Option<String>, duration_seconds: u64 },
}

/// Leaderboard entry
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct LeaderboardEntry {
    pub player_id: String,
    pub player_name: String,
    pub score: u32,
    pub rank: u32,
}

/// Game room
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct GameRoom {
    pub id: String,
    pub game_type: GameType,
    pub creator: String,
    pub players: Vec<String>,
    pub max_players: u8,
    pub entry_fee: u64,
    pub status: RoomStatus,
    pub current_state: String,
    pub winner: Option<String>,
    pub created_at: u64,
    pub last_move_time: u64,
    pub game_mode: GameMode,
}

/// Tournament bracket
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct TournamentBracket {
    pub player1: String,
    pub player2: String,
}

/// Tournament
#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct Tournament {
    pub id: String,
    pub name: String,
    pub game_type: GameType,
    pub creator: String,
    pub participants: Vec<String>,
    pub max_players: u8,
    pub status: TournamentStatus,
    pub current_round: u32,
    pub brackets: Vec<TournamentBracket>,
    pub created_at: u64,
}

/// Friend entry
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct FriendEntry {
    pub address: String,
    pub added_at: u64,
}

/// Friend request
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct FriendRequest {
    pub from_address: String,
    pub timestamp: u64,
}

/// Challenge
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct Challenge {
    pub id: String,
    pub challenger: String,
    pub opponent: String,
    pub game_type: GameType,
    pub wager: u64,
    pub status: ChallengeStatus,
    pub created_at: u64,
    pub expires_at: u64,
}

/// User profile
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct UserProfile {
    pub address: String,
    pub username: String,
    pub avatar_id: u8,
    pub level: u32,
    pub xp: u64,
    pub snake_stats: GameStats,
    pub tictactoe_stats: GameStats,
    pub snakeladders_stats: GameStats,
    pub uno_stats: GameStats,
    pub joined_at: u64,
}

/// Game statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct GameStats {
    pub games_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub high_score: u32,
    pub total_score: u64,
}

/// Operations
#[derive(Debug, Serialize, Deserialize)]
pub enum Operation {
    SubmitSnakeScore { score: u32, game_mode: GameMode },
    SubmitTicTacToeResult { won: bool, game_mode: GameMode },
    SubmitSnakeLaddersResult { won: bool, game_mode: GameMode },
    SubmitUnoResult { won: bool, game_mode: GameMode },
    UpdateProfile { username: String, avatar_id: u8 },
    CreateRoom { game_type: GameType, max_players: u8, entry_fee: u64, game_mode: GameMode },
    JoinRoom { room_id: String },
    LeaveRoom { room_id: String },
    MakeMove { room_id: String, move_data: String },
    CloseRoom { room_id: String },
    CreateTournament { name: String, game_type: GameType, max_players: u8 },
    JoinTournament { tournament_id: String },
    StartTournament { tournament_id: String },
    AdvanceTournament { tournament_id: String, match_id: String, winner: String },
    SendFriendRequest { to_address: String },
    AcceptFriendRequest { from_address: String },
    RejectFriendRequest { from_address: String },
    RemoveFriend { friend_address: String },
    CreateChallenge { opponent: String, game_type: GameType, wager: u64 },
    AcceptChallenge { challenge_id: String },
    DeclineChallenge { challenge_id: String },
}

/// Messages for cross-chain communication
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    RoomCreated { room_id: String, creator: String, game_type: GameType },
    PlayerJoinedRoom { room_id: String, player: String },
    GameMove { room_id: String, player: String, move_data: String },
    GameEnded { room_id: String, winner: Option<String> },
    TournamentStarted { tournament_id: String },
    MatchCompleted { tournament_id: String, match_id: String, winner: String },

    // Phase 2: Microchain messages
    /// Initialize a room chain with game configuration
    InitializeRoom {
        room_id: String,
        game_type: GameType,
        creator: String,
        max_players: u8,
        creator_chain: ChainId,
    },
    /// Confirmation that room chain is ready
    RoomChainReady {
        room_id: String,
        creator: String,
        game_type: GameType,
        room_chain_id: ChainId,
    },
    /// Player joining notification to room chain
    PlayerJoiningRoom {
        room_id: String,
        player: String,
    },
    /// Game move to be processed by room chain
    ProcessMove {
        room_id: String,
        player: String,
        move_data: String,
    },
    /// Game completion with full stats
    GameEndedWithStats {
        room_id: String,
        winner: Option<String>,
        player_stats: Vec<(String, u32)>, // (player_id, score)
        game_type: GameType,
        duration_seconds: u64,
    },
}

/// Leaderboard query
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct LeaderboardQuery {
    pub game_type: Option<GameType>,
    pub limit: Option<u32>,
    pub time_filter: Option<String>,
}

/// Global statistics
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct GlobalStats {
    pub total_players: u64,
    pub total_games: u64,
    pub active_rooms: u32,
    pub active_tournaments: u32,
}

/// Response for mutations
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct MutationResponse {
    pub success: bool,
    pub message: String,
}

/// Response for create room
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct CreateRoomResponse {
    pub success: bool,
    pub room_id: String,
}

/// Response for make move
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct MakeMoveResponse {
    pub success: bool,
    pub game_over: bool,
    pub winner: Option<String>,
}

/// Response for create tournament
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct CreateTournamentResponse {
    pub success: bool,
    pub tournament_id: String,
}

/// Response for create challenge
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct CreateChallengeResponse {
    pub success: bool,
    pub challenge_id: String,
}

/// Response for accept challenge
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct AcceptChallengeResponse {
    pub success: bool,
    pub room_id: Option<String>,
}
