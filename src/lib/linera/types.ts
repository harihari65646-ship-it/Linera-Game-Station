/**
 * Linera Type Definitions
 * 
 * Types for the Linera blockchain integration
 */

// Linera SDK types (from @linera/client)
export interface LineraFaucet {
  createWallet(): Promise<LineraWallet>;
  claimChain(client: LineraClient): Promise<string>;
}

export interface LineraWallet {
  chainIds(): string[];
  defaultChainId(): string;
  toJson(): string;
}

export interface LineraClient {
  frontend(): LineraFrontend;
  onNotification(callback: (notification: LineraNotification) => void): void;
}

export interface LineraFrontend {
  application(appId: string): Promise<LineraApplication>;
}

export interface LineraApplication {
  query(graphql: string): Promise<string>;
}

export interface LineraNotification {
  reason: {
    NewBlock?: boolean;
    NewIncomingMessage?: boolean;
    NewRound?: boolean;
  };
  chainId: string;
}

// Game Station specific types
export interface GameStationConfig {
  faucetUrl: string;
  applicationId: string;
  storageUrl?: string;
  chainId?: string;
  graphqlUrl?: string;
  serviceUrl?: string;
}

export interface UserProfile {
  username: string;
  avatarId: number;
  level: number;
  xp: number;
  snakeHighScore: number;
  snakeGames: number;
  snakeLaddersWins: number;
  snakeLaddersLosses: number;
  tictactoeWins: number;
  tictactoeLosses: number;
  unoWins: number;
  unoLosses: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  playerAddress: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  avatar: string;
}

export interface GameRoom {
  id: string;
  roomId?: string; // Alias for id
  gameType: string;
  game?: string; // Legacy alias
  creator: string;
  host?: string; // Legacy alias
  players: string[];
  maxPlayers: number;
  entryFee: number;
  fee?: number; // Legacy alias
  // Status from contract is uppercase: WAITING, IN_PROGRESS, FINISHED
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED' | 'waiting' | 'playing' | 'finished';
  currentState?: string;
  winner?: string | null;
  createdAt?: number;
  lastMoveTime?: number;
  gameMode?: string;
  chainId?: string;
}

// GraphQL response types
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export interface LeaderboardQueryResponse {
  leaderboard: Array<{
    playerName: string;
    score: number;
    gamesPlayed: number;
  }>;
}

export interface UserProfileQueryResponse {
  userProfile: UserProfile | null;
}

export interface ActiveRoomsQueryResponse {
  activeRooms: GameRoom[];
}

export interface SnakeHighScoreQueryResponse {
  snakeHighScore: number;
}

// Operation types
export type GameType = 'snake' | 'tictactoe' | 'snakeladders' | 'uno';

export interface SubmitScoreOperation {
  gameType: GameType;
  score: number;
  won?: boolean;
  opponent?: string;
}

export interface CreateRoomOperation {
  gameType: GameType;
  maxPlayers: number;
  entryFee: number;
  isPrivate?: boolean;
}

export interface JoinRoomOperation {
  roomId: string;
}

export interface GameMoveOperation {
  roomId: string;
  moveData: string;
}

// =============================================================================
// MULTIPLAYER TYPES
// =============================================================================

export interface MultiplayerGameRoom {
  roomId: string;
  id?: string; // Contract returns 'id', we normalize to roomId
  gameType: string;
  creator: string;
  players: string[];
  maxPlayers: number;
  // Status from contract is uppercase: WAITING, IN_PROGRESS, FINISHED, ABANDONED
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED' | 'Waiting' | 'Playing' | 'Finished' | 'Abandoned';
  currentState?: string; // Contract uses currentState
  currentTurn?: number;
  gameState?: string;
  winner: string | null;
  lastMoveAt?: number;
  lastMoveTime?: number;
  gameMode?: string;
}

export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  players: string[];
  status: 'Registration' | 'InProgress' | 'Finished';
  currentRound: number;
  winner: string | null;
}

export interface FriendEntry {
  address: string;
  addedAt: number;
}

export interface FriendRequest {
  from: string;
  to: string;
  createdAt: number;
}

export interface Challenge {
  id: string;
  challenger: string;
  challenged: string;
  gameType: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired';
  roomId: string | null;
  expiresAt: number;
}

// GraphQL response types for multiplayer
export interface CreateRoomResponse {
  createRoom: {
    roomId: string;
    chainId?: string;
  };
}

export interface RoomQueryResponse {
  room: MultiplayerGameRoom;
}

export interface ActiveRoomsResponse {
  activeRooms: MultiplayerGameRoom[];
}

export interface TournamentsResponse {
  activeTournaments: Tournament[];
}

export interface FriendsResponse {
  friends: FriendEntry[];
}

export interface FriendRequestsResponse {
  friendRequests: FriendRequest[];
}

export interface ChallengesResponse {
  challenges: Challenge[];
}

export interface MutationSuccessResponse {
  success: boolean;
}

export interface CreateTournamentResponse {
  createTournament: {
    tournamentId: string;
  };
}

export interface CreateChallengeResponse {
  createChallenge: {
    challengeId: string;
  };
}
