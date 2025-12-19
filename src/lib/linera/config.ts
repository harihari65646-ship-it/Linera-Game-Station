/**
 * Linera Configuration
 * 
 * Configure your Linera network connection here.
 * Update these values after deploying your smart contracts.
 */

import type { GameStationConfig } from './types';

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

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

export const lineraConfig: GameStationConfig = {
  faucetUrl: LINERA_FAUCET_URL,
  applicationId: LINERA_APP_ID,
  storageUrl: LINERA_STORAGE_URL,
};

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
    storageUrl: LINERA_STORAGE_URL || 'NOT SET',
    isDemoMode: isDemoMode(),
    isConfigured: isLineraConfigured(),
  };
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

export const GRAPHQL_QUERIES = {
  // Leaderboard queries
  GET_LEADERBOARD: (gameType: string, limit: number) => JSON.stringify({
    query: `query { leaderboard(gameType: "${gameType}", limit: ${limit}) { playerName score gamesPlayed winRate } }`
  }),

  // User profile queries
  GET_USER_PROFILE: (address: string) => JSON.stringify({
    query: `query { userProfile(address: "${address}") { username avatarId level xp snakeHighScore snakeGames tictactoeWins tictactoeLosses snakeLaddersWins snakeLaddersLosses unoWins unoLosses } }`
  }),

  // Snake high score query
  GET_SNAKE_HIGH_SCORE: (address: string) => JSON.stringify({
    query: `query { snakeHighScore(address: "${address}") }`
  }),

  // Active rooms query
  GET_ACTIVE_ROOMS: (gameType?: string) => JSON.stringify({
    query: gameType 
      ? `query { activeRooms(gameType: "${gameType}") { id game players maxPlayers fee host status chainId } }`
      : `query { activeRooms { id game players maxPlayers fee host status chainId } }`
  }),

  // Room state query
  GET_ROOM_STATE: (roomId: string) => JSON.stringify({
    query: `query { roomState(roomId: "${roomId}") { id game players maxPlayers status gameState currentTurn } }`
  }),
};

export const GRAPHQL_MUTATIONS = {
  // Submit snake score
  SUBMIT_SNAKE_SCORE: (score: number) => JSON.stringify({
    query: `mutation { submitSnakeScore(score: ${score}) }`
  }),

  // Submit tic-tac-toe result
  SUBMIT_TICTACTOE_RESULT: (won: boolean, opponent?: string) => JSON.stringify({
    query: opponent 
      ? `mutation { submitTicTacToeResult(won: ${won}, opponent: "${opponent}") }`
      : `mutation { submitTicTacToeResult(won: ${won}) }`
  }),

  // Submit snake & ladders result
  SUBMIT_SNAKELADDERS_RESULT: (won: boolean, position: number) => JSON.stringify({
    query: `mutation { submitSnakeLaddersResult(won: ${won}, position: ${position}) }`
  }),

  // Submit UNO result
  SUBMIT_UNO_RESULT: (won: boolean) => JSON.stringify({
    query: `mutation { submitUnoResult(won: ${won}) }`
  }),

  // Update profile
  UPDATE_PROFILE: (username: string, avatarId: number) => JSON.stringify({
    query: `mutation { updateProfile(username: "${username}", avatarId: ${avatarId}) }`
  }),

  // Create room
  CREATE_ROOM: (gameType: string, maxPlayers: number, entryFee: number) => JSON.stringify({
    query: `mutation { createRoom(gameType: "${gameType}", maxPlayers: ${maxPlayers}, entryFee: ${entryFee}) { roomId chainId } }`
  }),

  // Join room
  JOIN_ROOM: (roomId: string) => JSON.stringify({
    query: `mutation { joinRoom(roomId: "${roomId}") { success } }`
  }),

  // Submit game move
  SUBMIT_MOVE: (roomId: string, moveData: string) => JSON.stringify({
    query: `mutation { submitMove(roomId: "${roomId}", moveData: "${moveData}") { success newState } }`
  }),
};
