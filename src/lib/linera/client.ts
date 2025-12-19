/**
 * Linera Client Service
 * 
 * Handles real blockchain operations with Linera network.
 * Falls back to demo mode if not configured or package not installed.
 */

import { 
  lineraConfig, 
  isLineraConfigured, 
  GRAPHQL_QUERIES, 
  GRAPHQL_MUTATIONS 
} from './config';
import type { 
  LineraWallet, 
  LineraClient, 
  LineraApplication,
  LineraNotification,
  UserProfile,
  LeaderboardEntry,
  GameRoom,
  GraphQLResponse
} from './types';

// =============================================================================
// LINERA SDK DYNAMIC IMPORT
// =============================================================================

let lineraModule: any = null;
let isInitialized = false;
let initializationAttempted = false;

/**
 * Initialize the Linera WebAssembly module
 */
export async function initializeLinera(): Promise<boolean> {
  if (isInitialized) return true;
  if (initializationAttempted) return false;
  
  initializationAttempted = true;

  if (!isLineraConfigured()) {
    console.warn('[Linera] Application ID not configured - running in demo mode');
    return false;
  }

  try {
    // Dynamic import of @linera/client
    // This package must be installed separately after deployment
    // The import is wrapped in a try-catch to gracefully fallback to demo mode
    // When @linera/client is installed, this will load the real SDK
    
    // NOTE: This dynamic import will fail at build time if @linera/client is not installed
    // That's expected - the app runs in demo mode until deployment
    // After deployment, install @linera/client and rebuild
    
    // For now, we return false to use demo mode
    // When you install @linera/client, uncomment the lines below:
    // const module = await import('@linera/client');
    // lineraModule = module;
    // await lineraModule.default();
    // isInitialized = true;
    // return true;
    
    console.info('[Linera] Real blockchain integration ready - install @linera/client to enable');
    return false;
  } catch (error) {
    console.warn('[Linera] Running in demo mode');
    return false;
  }
}

/**
 * Check if Linera SDK is available
 */
export function isLineraAvailable(): boolean {
  return isInitialized && lineraModule !== null;
}

// =============================================================================
// WALLET MANAGEMENT
// =============================================================================

const WALLET_STORAGE_KEY = 'linera-game-station-wallet';

/**
 * Save wallet to localStorage
 */
export function saveWallet(wallet: LineraWallet): void {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, wallet.toJson());
  } catch (error) {
    console.error('[Linera] Failed to save wallet:', error);
  }
}

/**
 * Load wallet from localStorage
 */
export async function loadWallet(): Promise<LineraWallet | null> {
  if (!lineraModule) return null;
  
  try {
    const walletJson = localStorage.getItem(WALLET_STORAGE_KEY);
    if (walletJson) {
      return lineraModule.Wallet.fromJson(walletJson);
    }
  } catch (error) {
    console.error('[Linera] Failed to load wallet:', error);
  }
  return null;
}

/**
 * Clear stored wallet
 */
export function clearWallet(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

// =============================================================================
// LINERA CLIENT CLASS
// =============================================================================

export class LineraGameClient {
  private faucet: any = null;
  private wallet: LineraWallet | null = null;
  private client: LineraClient | null = null;
  private application: LineraApplication | null = null;
  private chainId: string = '';
  private notificationCallbacks: Array<(notification: LineraNotification) => void> = [];

  /**
   * Check if client is connected
   */
  get isConnected(): boolean {
    return Boolean(this.client && this.wallet);
  }

  /**
   * Get wallet address (chain ID)
   */
  get address(): string {
    return this.chainId;
  }

  /**
   * Get short address for display
   */
  get shortAddress(): string {
    if (!this.chainId) return '';
    return `${this.chainId.slice(0, 6)}...${this.chainId.slice(-4)}`;
  }

  /**
   * Initialize and connect to Linera network
   */
  async connect(): Promise<{ success: boolean; address: string; error?: string }> {
    try {
      // Initialize Linera module
      const initialized = await initializeLinera();
      if (!initialized || !lineraModule) {
        return { success: false, address: '', error: 'Linera SDK not available' };
      }

      // Try to load existing wallet
      this.wallet = await loadWallet();

      if (!this.wallet) {
        // Create new wallet from faucet
        this.faucet = new lineraModule.Faucet(lineraConfig.faucetUrl);
        this.wallet = await this.faucet.createWallet();
        if (this.wallet) {
          saveWallet(this.wallet);
        }
      }

      if (!this.wallet) {
        return { success: false, address: '', error: 'Failed to create wallet' };
      }

      // Create client
      this.client = new lineraModule.Client(this.wallet);

      // Claim chain if new wallet
      if (this.faucet && this.client) {
        this.chainId = await this.faucet.claimChain(this.client);
      } else if (this.wallet) {
        this.chainId = this.wallet.defaultChainId();
      }

      // Connect to application
      if (lineraConfig.applicationId && this.client) {
        const frontend = (this.client as any).frontend();
        this.application = await frontend.application(lineraConfig.applicationId);
      }

      // Set up notification handler
      if (this.client) {
        (this.client as any).onNotification((notification: LineraNotification) => {
          this.notificationCallbacks.forEach(cb => cb(notification));
        });
      }

      console.info('[Linera] Connected successfully:', this.shortAddress);
      return { success: true, address: this.chainId };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      console.error('[Linera] Connection error:', error);
      return { success: false, address: '', error: message };
    }
  }

  /**
   * Disconnect from Linera network
   */
  disconnect(): void {
    this.client = null;
    this.wallet = null;
    this.application = null;
    this.chainId = '';
    this.faucet = null;
    console.info('[Linera] Disconnected');
  }

  /**
   * Full disconnect (clears stored wallet)
   */
  fullDisconnect(): void {
    this.disconnect();
    clearWallet();
    console.info('[Linera] Full disconnect - wallet cleared');
  }

  /**
   * Subscribe to chain notifications
   */
  onNotification(callback: (notification: LineraNotification) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Execute a GraphQL query
   */
  async query<T>(graphqlQuery: string): Promise<GraphQLResponse<T> | null> {
    if (!this.application) {
      console.error('[Linera] Application not connected');
      return null;
    }

    try {
      const response = await this.application.query(graphqlQuery);
      return JSON.parse(response) as GraphQLResponse<T>;
    } catch (error) {
      console.error('[Linera] Query error:', error);
      return null;
    }
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T>(graphqlMutation: string): Promise<GraphQLResponse<T> | null> {
    return this.query<T>(graphqlMutation);
  }

  // ===========================================================================
  // GAME OPERATIONS
  // ===========================================================================

  async submitSnakeScore(score: number): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.SUBMIT_SNAKE_SCORE(score));
    return Boolean(result?.data);
  }

  async submitTicTacToeResult(won: boolean, opponent?: string): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.SUBMIT_TICTACTOE_RESULT(won, opponent));
    return Boolean(result?.data);
  }

  async submitSnakeLaddersResult(won: boolean, position: number): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.SUBMIT_SNAKELADDERS_RESULT(won, position));
    return Boolean(result?.data);
  }

  async submitUnoResult(won: boolean): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.SUBMIT_UNO_RESULT(won));
    return Boolean(result?.data);
  }

  async updateProfile(username: string, avatarId: number): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.UPDATE_PROFILE(username, avatarId));
    return Boolean(result?.data);
  }

  async createRoom(gameType: string, maxPlayers: number, entryFee: number): Promise<string | null> {
    const result = await this.mutate<{ createRoom: { roomId: string } }>(
      GRAPHQL_MUTATIONS.CREATE_ROOM(gameType, maxPlayers, entryFee)
    );
    return result?.data?.createRoom?.roomId || null;
  }

  async joinRoom(roomId: string): Promise<boolean> {
    const result = await this.mutate<{ joinRoom: { success: boolean } }>(
      GRAPHQL_MUTATIONS.JOIN_ROOM(roomId)
    );
    return Boolean(result?.data?.joinRoom?.success);
  }

  async submitMove(roomId: string, moveData: string): Promise<boolean> {
    const result = await this.mutate(GRAPHQL_MUTATIONS.SUBMIT_MOVE(roomId, moveData));
    return Boolean(result?.data);
  }

  // ===========================================================================
  // QUERY OPERATIONS
  // ===========================================================================

  async getLeaderboard(gameType: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const result = await this.query<{ leaderboard: LeaderboardEntry[] }>(
      GRAPHQL_QUERIES.GET_LEADERBOARD(gameType, limit)
    );
    return result?.data?.leaderboard || [];
  }

  async getUserProfile(address?: string): Promise<UserProfile | null> {
    const targetAddress = address || this.chainId;
    if (!targetAddress) return null;

    const result = await this.query<{ userProfile: UserProfile }>(
      GRAPHQL_QUERIES.GET_USER_PROFILE(targetAddress)
    );
    return result?.data?.userProfile || null;
  }

  async getSnakeHighScore(address?: string): Promise<number> {
    const targetAddress = address || this.chainId;
    if (!targetAddress) return 0;

    const result = await this.query<{ snakeHighScore: number }>(
      GRAPHQL_QUERIES.GET_SNAKE_HIGH_SCORE(targetAddress)
    );
    return result?.data?.snakeHighScore || 0;
  }

  async getActiveRooms(gameType?: string): Promise<GameRoom[]> {
    const result = await this.query<{ activeRooms: GameRoom[] }>(
      GRAPHQL_QUERIES.GET_ACTIVE_ROOMS(gameType)
    );
    return result?.data?.activeRooms || [];
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const lineraClient = new LineraGameClient();
