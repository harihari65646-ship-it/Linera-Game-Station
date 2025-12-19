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
  game: string;
  players: number;
  maxPlayers: number;
  fee: number;
  host: string;
  status: 'waiting' | 'playing' | 'finished';
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
