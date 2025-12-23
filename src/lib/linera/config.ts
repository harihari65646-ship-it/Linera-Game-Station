/**
 * Linera Configuration
 * 
 * Configure your Linera network connection here.
 * Update these values after deploying your smart contracts.
 */

import type { GameStationConfig } from './types';

// =============================================================================
// GRAPHQL ENUM VALUES (Must match contract's async_graphql enum conversion)
// =============================================================================

/**
 * GameType enum values (SCREAMING_SNAKE_CASE for GraphQL)
 * These MUST be used unquoted in GraphQL queries
 */
export const GameTypeEnum = {
  SNAKE: 'SNAKE',
  TIC_TAC_TOE: 'TIC_TAC_TOE',
  SNAKE_LADDERS: 'SNAKE_LADDERS',
  UNO: 'UNO',
} as const;

/**
 * GameMode enum values (SCREAMING_SNAKE_CASE for GraphQL)
 */
export const GameModeEnum = {
  SOLO: 'SOLO',
  PRACTICE: 'PRACTICE',
  MULTIPLAYER: 'MULTIPLAYER',
} as const;

export type GameType = typeof GameTypeEnum[keyof typeof GameTypeEnum];
export type GameMode = typeof GameModeEnum[keyof typeof GameModeEnum];

// =============================================================================
// CONFIGURATION - UPDATE THESE VALUES AFTER DEPLOYMENT
// =============================================================================

/**
 * Conway Testnet Faucet URL
 * Default: Official Linera Conway testnet faucet
 */
export const LINERA_FAUCET_URL = 
  import.meta.env.VITE_LINERA_FAUCET_URL || 
  'https://faucet.testnet-conway.linera.net';

/**
 * Your deployed Game Station Application ID
 * Get this by running: linera project publish-and-create
 * 
 * IMPORTANT: This must be set for real blockchain integration
 */
export const LINERA_APP_ID = 
  import.meta.env.VITE_LINERA_APP_ID || 
  '';

/**
 * Linera Storage URL (for wallet persistence)
 */
export const LINERA_STORAGE_URL =
  import.meta.env.VITE_LINERA_STORAGE_URL ||
  '';

/**
 * Chain ID (set by deployment)
 */
export const LINERA_CHAIN_ID =
  import.meta.env.VITE_LINERA_CHAIN_ID ||
  '';

/**
 * GraphQL endpoint URL
 * Constructed from faucet URL, chain ID, and app ID
 */
export const LINERA_GRAPHQL_URL =
  import.meta.env.VITE_LINERA_GRAPHQL_URL ||
  (LINERA_CHAIN_ID && LINERA_APP_ID
    ? `${LINERA_FAUCET_URL}/chains/${LINERA_CHAIN_ID}/applications/${LINERA_APP_ID}`
    : '');

/**
 * Linera Service URL (for local Docker network)
 * Set by run.bash for local Conway network
 */
export const LINERA_SERVICE_URL =
  import.meta.env.VITE_LINERA_SERVICE_URL ||
  '';

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

export const lineraConfig: GameStationConfig = {
  faucetUrl: LINERA_FAUCET_URL,
  applicationId: LINERA_APP_ID,
  storageUrl: LINERA_STORAGE_URL,
  chainId: LINERA_CHAIN_ID,
  graphqlUrl: LINERA_GRAPHQL_URL,
  serviceUrl: LINERA_SERVICE_URL,
};

// Log network mode on load (helpful for debugging)
console.info('[Config] Linera Network Mode:',
  LINERA_FAUCET_URL.includes('localhost') ? 'LOCAL (Docker)' : 'PUBLIC (Conway Testnet)'
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if Linera is properly configured for real blockchain operations
 */
export function isLineraConfigured(): boolean {
  return Boolean(LINERA_APP_ID && LINERA_APP_ID.length > 0);
}

/**
 * Check if running in demo mode (no real blockchain)
 */
export function isDemoMode(): boolean {
  return !isLineraConfigured();
}

/**
 * Get environment info for debugging
 */
export function getLineraEnvInfo() {
  return {
    faucetUrl: LINERA_FAUCET_URL,
    applicationId: LINERA_APP_ID ? `${LINERA_APP_ID.slice(0, 8)}...` : 'NOT SET',
    chainId: LINERA_CHAIN_ID ? `${LINERA_CHAIN_ID.slice(0, 8)}...` : 'NOT SET',
    graphqlUrl: LINERA_GRAPHQL_URL || 'NOT SET',
    storageUrl: LINERA_STORAGE_URL || 'NOT SET',
    isDemoMode: isDemoMode(),
    isConfigured: isLineraConfigured(),
  };
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

export const GRAPHQL_QUERIES = {
  // Leaderboard queries (gameType is unquoted GraphQL enum)
  GET_LEADERBOARD: (gameType: GameType, limit: number) => JSON.stringify({
    query: `query { leaderboard(gameType: ${gameType}, limit: ${limit}) { playerName score gamesPlayed winRate } }`
  }),

  // User profile queries
  GET_USER_PROFILE: (address: string) => JSON.stringify({
    query: `query { userProfile(address: "${address}") { username avatarId level xp snakeHighScore snakeGames tictactoeWins tictactoeLosses snakeLaddersWins snakeLaddersLosses unoWins unoLosses } }`
  }),

  // Snake high score query
  GET_SNAKE_HIGH_SCORE: (address: string) => JSON.stringify({
    query: `query { snakeHighScore(address: "${address}") }`
  }),

  // Active rooms query - contract doesn't support gameType filter, filter client-side instead
  GET_ACTIVE_ROOMS: (_gameType?: GameType) => JSON.stringify({
    query: `query { activeRooms { id gameType creator players maxPlayers entryFee status gameMode } }`
  }),

  // Room state query (legacy) - updated to match contract schema
  GET_ROOM_STATE: (roomId: string) => JSON.stringify({
    query: `query { room(roomId: "${roomId}") { id gameType players maxPlayers status currentState winner } }`
  }),

  // Multiplayer room queries
  // Note: Contract's activeRooms query does NOT support gameType filter - filter client-side
  // Contract uses 'id' field, not 'roomId'; status is uppercase 'WAITING', 'IN_PROGRESS', etc.
  GET_MULTIPLAYER_ROOMS: () => JSON.stringify({
    query: `query { activeRooms { id gameType creator players maxPlayers status currentState winner lastMoveTime gameMode } }`
  }),

  GET_ROOM: (roomId: string) => JSON.stringify({
    query: `query { room(roomId: "${roomId}") { id gameType creator players maxPlayers status currentState winner lastMoveTime gameMode } }`
  }),

  // Tournament queries
  GET_TOURNAMENTS: () => JSON.stringify({
    query: `query { activeTournaments { id name gameType maxPlayers players status currentRound winner } }`
  }),

  GET_TOURNAMENT: (tournamentId: string) => JSON.stringify({
    query: `query { tournament(id: "${tournamentId}") { id name gameType maxPlayers players status currentRound winner } }`
  }),

  // Friend system queries
  GET_FRIENDS: (address: string) => JSON.stringify({
    query: `query { friends(address: "${address}") { address addedAt } }`
  }),

  GET_FRIEND_REQUESTS: (address: string) => JSON.stringify({
    query: `query { friendRequests(address: "${address}") { from to createdAt } }`
  }),

  // Challenge queries
  GET_CHALLENGES: (address: string) => JSON.stringify({
    query: `query { challenges(address: "${address}") { id challenger challenged gameType status roomId expiresAt } }`
  }),

  GET_CHALLENGE: (challengeId: string) => JSON.stringify({
    query: `query { challenge(id: "${challengeId}") { id challenger challenged gameType status roomId expiresAt } }`
  }),
};

export const GRAPHQL_MUTATIONS = {
  // Submit snake score
  SUBMIT_SNAKE_SCORE: (score: number) => JSON.stringify({
    query: `mutation { submitSnakeScore(score: ${score}) }`
  }),

  // Submit tic-tac-toe result
  SUBMIT_TICTACTOE_RESULT: (won: boolean) => JSON.stringify({
    query: `mutation { submitTictactoeResult(won: ${won}) }`
  }),

  // Submit snake & ladders result
  SUBMIT_SNAKELADDERS_RESULT: (won: boolean) => JSON.stringify({
    query: `mutation { submitSnakeLaddersResult(won: ${won}) }`
  }),

  // Submit UNO result
  SUBMIT_UNO_RESULT: (won: boolean) => JSON.stringify({
    query: `mutation { submitUnoResult(won: ${won}) }`
  }),

  // Update profile
  UPDATE_PROFILE: (username: string, avatarId: number) => JSON.stringify({
    query: `mutation { updateProfile(username: "${username}", avatarId: ${avatarId}) }`
  }),

  // Create room (gameType must be unquoted GraphQL enum: SNAKE, TIC_TAC_TOE, SNAKE_LADDERS, UNO)
  CREATE_ROOM: (gameType: GameType, maxPlayers: number, entryFee: number) => JSON.stringify({
    query: `mutation { createRoom(gameType: ${gameType}, maxPlayers: ${maxPlayers}, entryFee: ${entryFee}) { roomId chainId } }`
  }),

  // Join room
  JOIN_ROOM: (roomId: string) => JSON.stringify({
    query: `mutation { joinRoom(roomId: "${roomId}") { success } }`
  }),

  // Submit game move (legacy)
  SUBMIT_MOVE: (roomId: string, moveData: string) => JSON.stringify({
    query: `mutation { submitMove(roomId: "${roomId}", moveData: "${moveData}") { success newState } }`
  }),

  // Multiplayer room operations (gameType and gameMode must be unquoted GraphQL enums)
  CREATE_MULTIPLAYER_ROOM: (gameType: GameType, maxPlayers: number, entryFee: number = 0, gameMode: GameMode = GameModeEnum.MULTIPLAYER) => JSON.stringify({
    query: `mutation { createRoom(gameType: ${gameType}, maxPlayers: ${maxPlayers}, entryFee: ${entryFee}, gameMode: ${gameMode}) { roomId } }`
  }),

  JOIN_MULTIPLAYER_ROOM: (roomId: string) => JSON.stringify({
    query: `mutation { joinRoom(roomId: "${roomId}") { success } }`
  }),

  LEAVE_ROOM: (roomId: string) => JSON.stringify({
    query: `mutation { leaveRoom(roomId: "${roomId}") { success } }`
  }),

  MAKE_MOVE: (roomId: string, moveData: string) => JSON.stringify({
    query: `mutation { makeMove(roomId: "${roomId}", moveData: "${moveData}") { success gameState } }`
  }),

  CLOSE_ROOM: (roomId: string) => JSON.stringify({
    query: `mutation { closeRoom(roomId: "${roomId}") { success } }`
  }),

  // Tournament operations - gameType is unquoted GraphQL enum
  CREATE_TOURNAMENT: (name: string, gameType: GameType, maxPlayers: number) => JSON.stringify({
    query: `mutation { createTournament(name: "${name}", gameType: ${gameType}, maxPlayers: ${maxPlayers}) { tournamentId } }`
  }),

  JOIN_TOURNAMENT: (tournamentId: string) => JSON.stringify({
    query: `mutation { joinTournament(tournamentId: "${tournamentId}") { success } }`
  }),

  START_TOURNAMENT: (tournamentId: string) => JSON.stringify({
    query: `mutation { startTournament(tournamentId: "${tournamentId}") { success } }`
  }),

  // Friend system operations
  SEND_FRIEND_REQUEST: (toAddress: string) => JSON.stringify({
    query: `mutation { sendFriendRequest(toAddress: "${toAddress}") { success } }`
  }),

  ACCEPT_FRIEND_REQUEST: (fromAddress: string) => JSON.stringify({
    query: `mutation { acceptFriendRequest(fromAddress: "${fromAddress}") { success } }`
  }),

  REJECT_FRIEND_REQUEST: (fromAddress: string) => JSON.stringify({
    query: `mutation { rejectFriendRequest(fromAddress: "${fromAddress}") { success } }`
  }),

  REMOVE_FRIEND: (friendAddress: string) => JSON.stringify({
    query: `mutation { removeFriend(friendAddress: "${friendAddress}") { success } }`
  }),

  // Challenge operations - gameType is unquoted GraphQL enum
  CREATE_CHALLENGE: (opponent: string, gameType: GameType) => JSON.stringify({
    query: `mutation { createChallenge(opponent: "${opponent}", gameType: ${gameType}) { challengeId } }`
  }),

  ACCEPT_CHALLENGE: (challengeId: string) => JSON.stringify({
    query: `mutation { acceptChallenge(challengeId: "${challengeId}") { roomId } }`
  }),

  DECLINE_CHALLENGE: (challengeId: string) => JSON.stringify({
    query: `mutation { declineChallenge(challengeId: "${challengeId}") { success } }`
  }),
};
