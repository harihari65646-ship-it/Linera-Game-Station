//! Linera Game Station - State Definitions

use linera_sdk::{
    linera_base_types::ChainId,
    views::{linera_views, RegisterView, MapView, RootView, ViewStorageContext},
};
use game_station::{UserProfile, LeaderboardEntry, GameRoom, Tournament, FriendEntry, FriendRequest, Challenge, GameType, RoomStatus};

/// The application state for Game Station
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct GameStationState {
    /// User profiles indexed by address
    pub users: MapView<String, UserProfile>,
    /// Snake high scores indexed by address
    pub snake_high_scores: MapView<String, u32>,
    /// Leaderboards indexed by game type
    pub leaderboards: MapView<String, Vec<LeaderboardEntry>>,
    /// Total games played
    pub total_games: RegisterView<u64>,
    /// Total players
    pub total_players: RegisterView<u64>,

    // Multiplayer rooms
    pub rooms: MapView<String, GameRoom>,
    pub room_counter: RegisterView<u64>,
    pub active_room_ids: RegisterView<Vec<String>>,

    // Tournaments
    pub tournaments: MapView<String, Tournament>,
    pub tournament_counter: RegisterView<u64>,
    pub active_tournament_ids: RegisterView<Vec<String>>,

    // Social features
    pub friends: MapView<String, Vec<FriendEntry>>,
    pub friend_requests: MapView<String, Vec<FriendRequest>>,

    // Challenges
    pub challenges: MapView<String, Challenge>,
    pub challenge_counter: RegisterView<u64>,
    pub user_challenges: MapView<String, Vec<String>>,

    // Idempotency tracking (XFighterZone pattern for exactly-once semantics)
    /// Track sent cross-chain messages to prevent duplicates
    pub sent_messages: MapView<String, bool>,
    /// Track processed operations to prevent duplicate execution
    pub processed_operations: MapView<String, bool>,

    // Microchain architecture - Phase 2
    /// Map room_id to the ChainId hosting that room
    pub room_chains: MapView<String, ChainId>,
    /// Reverse mapping for message routing
    pub chain_to_room: MapView<ChainId, String>,
    /// Track main chain ID for room chains to reference
    pub main_chain_id: RegisterView<Option<ChainId>>,
}

/// State for individual room microchains
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct RoomChainState {
    /// Unique identifier for this room
    pub room_id: RegisterView<String>,
    /// Type of game being played (stored as string to avoid Default requirement)
    pub game_type_str: RegisterView<String>,
    /// List of player addresses
    pub players: RegisterView<Vec<String>>,
    /// Maximum number of players allowed
    pub max_players: RegisterView<u8>,
    /// Current status (stored as string to avoid Default requirement)
    pub status_str: RegisterView<String>,
    /// Serialized game state (board, positions, etc.)
    pub current_state: RegisterView<String>,
    /// Move history indexed by move number
    pub moves: MapView<u64, String>,
    /// Timestamp when room was created
    pub created_at: RegisterView<u64>,
    /// Main chain reference (stored as string to avoid Default requirement)
    pub creator_chain_str: RegisterView<String>,
    /// Move counter for tracking game progress
    pub move_counter: RegisterView<u64>,
}
