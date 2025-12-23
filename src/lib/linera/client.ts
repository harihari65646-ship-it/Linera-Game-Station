/**
 * Linera Client Service
 *
 * Handles real blockchain operations with Linera network.
 * Follows the DeadKeys/LineraFlow pattern for reliable wallet/chain initialization.
 */

// Static imports - same pattern as deadkeys-ref and lineraflow-ref
import * as linera from '@linera/client';
import * as signer from '@linera/signer';
import { ethers } from 'ethers';

import {
  lineraConfig,
  isLineraConfigured,
  GRAPHQL_QUERIES,
  GRAPHQL_MUTATIONS,
  GameTypeEnum,
  GameModeEnum,
  type GameType
} from './config';

// Map frontend game type strings to GraphQL enum values
const gameTypeToEnum: Record<string, GameType> = {
  'snake': GameTypeEnum.SNAKE,
  'tictactoe': GameTypeEnum.TIC_TAC_TOE,
  'snakeladders': GameTypeEnum.SNAKE_LADDERS,
  'uno': GameTypeEnum.UNO,
  // Also support direct enum values
  'SNAKE': GameTypeEnum.SNAKE,
  'TIC_TAC_TOE': GameTypeEnum.TIC_TAC_TOE,
  'SNAKE_LADDERS': GameTypeEnum.SNAKE_LADDERS,
  'UNO': GameTypeEnum.UNO,
};
import type {
  LineraWallet,
  LineraClient,
  LineraApplication,
  LineraNotification,
  UserProfile,
  LeaderboardEntry,
  GameRoom,
  GraphQLResponse,
  MultiplayerGameRoom,
  Tournament,
  FriendEntry,
  FriendRequest,
  Challenge,
  CreateRoomResponse,
  MutationSuccessResponse,
  ActiveRoomsResponse,
  RoomQueryResponse,
  TournamentsResponse,
  FriendsResponse,
  FriendRequestsResponse,
  ChallengesResponse,
  CreateTournamentResponse,
  CreateChallengeResponse
} from './types';

// =============================================================================
// LINERA SDK - WASM INITIALIZATION
// =============================================================================

let wasmInitialized = false;
let initializationAttempted = false;
let wasmInitPromise: Promise<boolean> | null = null;

/**
 * Initialize the Linera WebAssembly module
 * Uses dynamic import pattern with promise caching (lineraodds pattern)
 */
async function initializeWasm(): Promise<boolean> {
  if (wasmInitialized) return true;

  // Return cached promise if initialization in progress
  if (wasmInitPromise) return wasmInitPromise;

  // Cache the promise to prevent concurrent initialization
  wasmInitPromise = (async () => {
    try {
      // Initialize WASM module using default() export (0.15.6 pattern)
      await (linera as any).default();

      wasmInitialized = true;
      console.info('[Linera] WASM module initialized successfully');
      return true;
    } catch (error: any) {
      // Handle case where WASM is already initialized
      if (error?.message?.includes('already initialized') ||
        error?.message?.includes('Already initialized') ||
        error?.message?.includes('storage is already initialized')) {
        wasmInitialized = true;
        console.info('[Linera] WASM module already initialized (graceful)');
        return true;
      }
      console.error('[Linera] Failed to initialize WASM:', error);
      wasmInitPromise = null; // Clear promise on failure
      throw error;
    }
  })();

  return wasmInitPromise;
}

/**
 * Initialize the Linera SDK with configuration check
 */
export async function initializeLinera(): Promise<boolean> {
  if (wasmInitialized && initializationAttempted) return true;
  if (initializationAttempted && !wasmInitialized) return false;

  initializationAttempted = true;

  if (!isLineraConfigured()) {
    console.warn('[Linera] Application ID not configured - running in demo mode');
    return false;
  }

  try {
    await initializeWasm();
    console.info('[Linera] Real blockchain integration enabled');
    return true;
  } catch (error) {
    console.error('[Linera] SDK initialization failed:', error);
    console.warn('[Linera] Ensure @linera/client and @linera/signer are properly installed');
    return false;
  }
}

/**
 * Check if Linera SDK is available and initialized
 */
export function isLineraAvailable(): boolean {
  return wasmInitialized;
}

// =============================================================================
// MNEMONIC PERSISTENCE
// =============================================================================

const MNEMONIC_STORAGE_KEY = 'neon_arcade_linera_mnemonic';

/**
 * Get or create a persistent mnemonic for wallet generation
 * Uses ethers.js for proper BIP39 mnemonic generation (DeadKeys pattern)
 */
function getOrCreateMnemonic(): string {
  let mnemonic = localStorage.getItem(MNEMONIC_STORAGE_KEY);

  // Validate existing mnemonic (must be 12-24 words separated by spaces)
  if (mnemonic) {
    const words = mnemonic.trim().split(/\s+/);
    const isValid = [12, 15, 18, 21, 24].includes(words.length) && words.every(w => w.length > 0);

    if (!isValid) {
      console.warn('[Linera] Invalid mnemonic detected (wrong format), regenerating...');
      mnemonic = null; // Force regeneration
      localStorage.removeItem(MNEMONIC_STORAGE_KEY);
    } else {
      console.info('[Linera] Existing mnemonic loaded from storage');
      return mnemonic;
    }
  }

  // Generate a proper BIP39 mnemonic using ethers (same as DeadKeys)
  const wallet = ethers.Wallet.createRandom();
  const phrase = wallet.mnemonic?.phrase;

  if (!phrase) {
    throw new Error('Failed to generate BIP39 mnemonic');
  }

  mnemonic = phrase;

  try {
    localStorage.setItem(MNEMONIC_STORAGE_KEY, mnemonic);
    console.info('[Linera] New mnemonic generated and stored');
  } catch (error) {
    console.error('[Linera] Failed to store mnemonic:', error);
  }

  return mnemonic;
}

/**
 * Clear stored mnemonic (use with caution - will change wallet address)
 */
export function clearMnemonic(): void {
  localStorage.removeItem(MNEMONIC_STORAGE_KEY);
  console.info('[Linera] Mnemonic cleared from storage');
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
  if (!wasmInitialized) return null;

  try {
    const walletJson = localStorage.getItem(WALLET_STORAGE_KEY);
    if (walletJson) {
      return linera.Wallet.fromJson(walletJson);
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
  private ownerAddress: string = ''; // The owner's signing address (EVM format - 20 bytes)
  private lineraOwner: string = '';  // Linera Address32 format (32 bytes) - what contract stores
  private notificationCallbacks: Array<(notification: LineraNotification) => void> = [];
  private isLocalNetworkMode: boolean = false; // Set to true when using local network (GraphQL-only mode)


  /**
   * Check if client is connected
   * For local network mode: only requires chainId (GraphQL-only mode)
   * For public network: requires client, wallet, and chainId
   */
  get isConnected(): boolean {
    if (this.isLocalNetworkMode) {
      // Local network mode: connected if we have chain ID and GraphQL endpoint
      return Boolean(this.chainId && lineraConfig.graphqlUrl);
    }
    // Public network mode: need full client/wallet
    return Boolean(this.client && this.wallet && this.chainId);
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
   * Get the owner's signing address (used in contract for player identification)
   * This is different from chainId - the contract stores Address32(owner) for players
   */
  get owner(): string {
    return this.ownerAddress;
  }

  /**
   * Get the Linera Address32 format for player matching
   * This is what the contract actually stores via authenticated_signer()
   */
  get lineraOwnerAddress(): string {
    return this.lineraOwner;
  }

  /**
   * Get the owner's hex address for player matching in rooms
   * Returns Address32 format (64 chars) if available, falls back to EVM address (40 chars)
   */
  getMyOwnerHex(): string {
    // Prefer the Linera Address32 format (matches what contract stores)
    return this.lineraOwner || this.ownerAddress;
  }

  /**
   * Initialize and connect to Linera network
   * Uses the exact pattern from DeadKeys for reliable connection
   */
  async connect(): Promise<{ success: boolean; address: string; error?: string }> {
    try {
      console.info('[Linera] Starting connection process...');

      // Step 1: Initialize WASM module
      await initializeWasm();
      if (!wasmInitialized) {
        return { success: false, address: '', error: 'Failed to initialize WASM module' };
      }
      console.info('[Linera] WASM initialized');

      // Step 2: Get or create persistent mnemonic
      const mnemonic = getOrCreateMnemonic();
      console.info('[Linera] Mnemonic ready');

      // Step 3: Create signer from mnemonic using @linera/signer
      let signerInstance: any;
      try {
        signerInstance = signer.PrivateKey.fromMnemonic(mnemonic);
        console.info('[Linera] Signer created from mnemonic');
      } catch (error) {
        console.error('[Linera] Failed to create signer:', error);
        return { success: false, address: '', error: 'Failed to create signer from mnemonic' };
      }

      // Get owner address from signer (EVM format - 20 bytes)
      const owner = signerInstance.address();
      this.ownerAddress = owner;
      console.info('[Linera] Owner address (EVM):', owner);

      // Compute Linera Address32 from EVM address
      // For EVM signers, Linera's Address32 is the EVM address LEFT-PADDED with zeros to 32 bytes
      // EVM address: 0x1234...5678 (20 bytes = 40 hex chars)
      // Address32:   0000000000000000000000001234...5678 (32 bytes = 64 hex chars)
      try {
        let evmHex = owner.startsWith('0x') ? owner.slice(2) : owner;
        evmHex = evmHex.toLowerCase();
        // Left-pad to 64 hex chars (32 bytes)
        this.lineraOwner = evmHex.padStart(64, '0');
        console.info('[Linera] Linera Owner (Address32 from padded EVM):', this.lineraOwner);
      } catch (error) {
        console.warn('[Linera] Could not compute Address32 from EVM address:', error);
      }

      // Step 4: Check if using local network (no faucet available)
      const isLocalNetwork = lineraConfig.faucetUrl.includes('localhost') || lineraConfig.faucetUrl.includes('127.0.0.1');

      if (isLocalNetwork && lineraConfig.chainId) {
        // LOCAL NETWORK MODE: Skip faucet, use pre-configured chain ID
        console.info('[Linera] LOCAL NETWORK MODE - Using pre-configured chain');

        this.chainId = lineraConfig.chainId;
        this.isLocalNetworkMode = true;
        console.info('[Linera] Using chain ID from config:', this.chainId);

        // For local network, we operate in GraphQL-only mode
        // No wallet/client needed - we interact via HTTP GraphQL calls
        console.info('[Linera] Operating in GraphQL-only mode (local network)');
        console.info('[Linera] GraphQL endpoint:', lineraConfig.graphqlUrl);

      } else {
        // PUBLIC NETWORK MODE: Use faucet to claim chain
        if (!lineraConfig.faucetUrl) {
          return { success: false, address: '', error: 'Faucet URL not configured' };
        }

        this.faucet = new linera.Faucet(lineraConfig.faucetUrl);
        console.info('[Linera] Faucet initialized:', lineraConfig.faucetUrl);

        // Step 5: Create wallet from faucet
        this.wallet = await this.faucet.createWallet();
        if (!this.wallet) {
          return { success: false, address: '', error: 'Failed to create wallet from faucet' };
        }
        console.info('[Linera] Wallet created successfully');

        // Step 6: Claim chain with wallet and owner
        try {
          this.chainId = await this.faucet.claimChain(this.wallet, owner);
          console.info('[Linera] Chain claimed:', this.chainId);
        } catch (error) {
          console.error('[Linera] Failed to claim chain:', error);
          return {
            success: false,
            address: '',
            error: `Failed to claim chain: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }

        // Step 7: Create client with wallet and signer (0.15.6 pattern)
        try {
          this.client = await new linera.Client(this.wallet, signerInstance, false);
          console.info('[Linera] Client created with signer');
        } catch (error) {
          console.error('[Linera] Failed to create client:', error);
          return { success: false, address: '', error: 'Failed to create Linera client' };
        }

        if (!this.client) {
          return { success: false, address: '', error: 'Client creation returned null' };
        }

        // Step 8: Connect to application if configured
        if (lineraConfig.applicationId) {
          try {
            const frontend = (this.client as any).frontend();
            this.application = await frontend.application(lineraConfig.applicationId);
            console.info('[Linera] Application connected:', lineraConfig.applicationId);
          } catch (error) {
            console.warn('[Linera] Application connection failed (will retry later):', error);
            // Don't fail the entire connection if app connection fails
          }
        }

        // Step 9: Set up notification handler
        try {
          if (this.client && typeof (this.client as any).onNotification === 'function') {
            (this.client as any).onNotification((notification: LineraNotification) => {
              this.notificationCallbacks.forEach(cb => cb(notification));
            });
            console.info('[Linera] Notification handler configured');
          }
        } catch (error) {
          console.warn('[Linera] Failed to set up notifications:', error);
          // Don't fail connection if notifications fail
        }

        // Step 10: Get the actual Linera Owner from client identity
        // This is the Address32 that the contract sees via authenticated_signer()
        try {
          const identity = await (this.client as any).identity();
          console.info('[Linera] Client identity (raw):', JSON.stringify(identity, null, 2));

          if (identity) {
            // Try different property names for owner
            const ownerValue = identity.owner || identity.Owner || identity.account_owner || identity.accountOwner;
            if (ownerValue) {
              // Extract the hex from owner - handle various formats
              let ownerStr = String(ownerValue);
              console.info('[Linera] Raw owner value:', ownerStr);

              // Handle Address32(hex) format
              if (ownerStr.includes('Address32(')) {
                ownerStr = ownerStr.replace(/Address32\(/g, '').replace(/\)/g, '');
              }
              // Handle Evm(hex) format
              if (ownerStr.includes('Evm(')) {
                ownerStr = ownerStr.replace(/Evm\(/g, '').replace(/\)/g, '');
              }
              // Remove 0x prefix if present
              if (ownerStr.startsWith('0x')) {
                ownerStr = ownerStr.slice(2);
              }

              this.lineraOwner = ownerStr.toLowerCase();
              console.info('[Linera] Linera Owner (from identity):', this.lineraOwner, `(${this.lineraOwner.length} chars)`);
            }
          }
        } catch (error) {
          console.warn('[Linera] Could not get identity:', error);
          // Keep the padded EVM address computed earlier as fallback
        }
      }

      console.info('[Linera] Connected successfully');
      console.info('[Linera] Chain ID:', this.chainId);
      console.info('[Linera] Short address:', this.shortAddress);
      console.info('[Linera] Linera Owner:', this.lineraOwner);

      return { success: true, address: this.chainId };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      console.error('[Linera] Connection error:', error);

      // Clean up on failure
      this.client = null;
      this.wallet = null;
      this.application = null;
      this.chainId = '';
      this.faucet = null;

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
    this.ownerAddress = '';
    this.lineraOwner = '';
    this.faucet = null;
    console.info('[Linera] Disconnected');
  }

  /**
   * Full disconnect (clears stored wallet and mnemonic)
   */
  fullDisconnect(): void {
    this.disconnect();
    clearWallet();
    clearMnemonic();
    console.info('[Linera] Full disconnect - wallet and mnemonic cleared');
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
   * Execute a GraphQL query against the main chain via HTTP
   * This is necessary because the SDK's application.query() goes to the user's chain
   */
  async query<T>(graphqlQuery: string): Promise<GraphQLResponse<T> | null> {
    // Use direct HTTP to the main chain's GraphQL endpoint
    const graphqlUrl = lineraConfig.graphqlUrl;
    if (!graphqlUrl) {
      console.error('[Linera] GraphQL URL not configured');
      return null;
    }

    try {
      console.debug('[Linera] Query to:', graphqlUrl);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: graphqlQuery,
      });

      if (!response.ok) {
        console.error('[Linera] Query HTTP error:', response.status);
        return null;
      }

      const result = await response.json();
      return result as GraphQLResponse<T>;
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
    // Fetch all rooms (contract doesn't support gameType filter)
    const result = await this.query<{ activeRooms: GameRoom[] }>(
      GRAPHQL_QUERIES.GET_ACTIVE_ROOMS()
    );

    let rooms = result?.data?.activeRooms || [];

    // Client-side filter by gameType if provided
    if (gameType) {
      const graphqlGameType = gameTypeToEnum[gameType.toLowerCase()] || gameTypeToEnum[gameType];
      if (graphqlGameType) {
        rooms = rooms.filter(r => r.gameType === graphqlGameType);
      }
    }

    console.info('[Linera] Active rooms:', rooms.length, 'for gameType:', gameType);
    return rooms;
  }

  // ===========================================================================
  // MULTIPLAYER ROOM OPERATIONS
  // ===========================================================================

  /**
   * Create a new multiplayer game room
   * @param gameType Type of game (e.g., 'snake', 'tictactoe', 'snakeladders', 'uno')
   * @param maxPlayers Maximum number of players allowed in the room
   * @returns Room ID if successful, null otherwise
   */
  async createMultiplayerRoom(gameType: string, maxPlayers: number): Promise<string | null> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot create room: not connected');
      return null;
    }

    // Convert frontend gameType to GraphQL enum
    const graphqlGameType = gameTypeToEnum[gameType.toLowerCase()] || gameTypeToEnum[gameType];
    if (!graphqlGameType) {
      console.error('[Linera] Unknown game type:', gameType);
      return null;
    }

    try {
      // Get existing rooms before creating (to find the new one)
      const existingRooms = await this.getActiveRooms();
      const existingRoomIds = new Set(existingRooms.map(r => r.roomId || r.id));
      const myAddress = this.chainId || '';

      const mutationQuery = GRAPHQL_MUTATIONS.CREATE_MULTIPLAYER_ROOM(graphqlGameType, maxPlayers);
      console.info('[Linera] Creating room with mutation:', mutationQuery);

      // Submit the create room mutation
      const result = await this.mutate<string>(mutationQuery);

      console.info('[Linera] Mutation result:', JSON.stringify(result));

      // The mutation returns the room ID directly as data (not { roomId } or { success })
      // Check for errors first
      if (result?.errors && result.errors.length > 0) {
        console.error('[Linera] Mutation errors:', result.errors);
        return null;
      }

      if (!result?.data) {
        console.error('[Linera] Create room mutation failed - no data:', result);
        return null;
      }

      console.info('[Linera] Room creation response:', result.data);

      // The mutation returns a transaction hash, not the room ID directly
      // We need to poll for the new room
      console.info('[Linera] Room creation submitted, polling for new room...');

      // Poll for the newly created room (max 10 attempts, 500ms apart)
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentRooms = await this.getActiveRooms();

        // Find rooms that didn't exist before (use 'id' field from GraphQL)
        const newRooms = currentRooms.filter(r =>
          !existingRoomIds.has(r.id) &&
          (r.creator?.includes(myAddress) || r.players?.some(p => p.includes(myAddress)))
        );

        if (newRooms.length > 0) {
          const newRoom = newRooms[0];
          console.info('[Linera] Found new room:', newRoom.id);
          return newRoom.id;
        }

        console.debug(`[Linera] Polling for room... attempt ${attempt + 1}/10`);
      }

      // Fallback: return any new room if we couldn't match by creator
      const finalRooms = await this.getActiveRooms();
      const anyNewRoom = finalRooms.find(r => !existingRoomIds.has(r.id));
      if (anyNewRoom) {
        console.info('[Linera] Found new room (fallback):', anyNewRoom.id);
        return anyNewRoom.id;
      }

      console.error('[Linera] Failed to find newly created room after polling');
      return null;
    } catch (error) {
      console.error('[Linera] Error creating room:', error);
      return null;
    }
  }

  /**
   * Join an existing multiplayer game room
   * @param roomId ID of the room to join
   * @returns True if successfully joined, false otherwise
   */
  async joinMultiplayerRoom(roomId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot join room: not connected');
      return false;
    }

    if (!roomId || roomId.trim() === '') {
      console.error('[Linera] Invalid room ID');
      return false;
    }

    try {
      const result = await this.mutate<string>(
        GRAPHQL_MUTATIONS.JOIN_MULTIPLAYER_ROOM(roomId)
      );

      // Mutation returns transaction hash as data, not { success }
      const success = Boolean(result?.data);
      if (success) {
        console.info('[Linera] Successfully joined room:', roomId, 'tx:', result.data);
      } else {
        console.error('[Linera] Failed to join room:', roomId, result);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error joining room:', error);
      return false;
    }
  }

  /**
   * Leave a multiplayer game room
   * @param roomId ID of the room to leave
   * @returns True if successfully left, false otherwise
   */
  async leaveMultiplayerRoom(roomId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot leave room: not connected');
      return false;
    }

    if (!roomId || roomId.trim() === '') {
      console.error('[Linera] Invalid room ID');
      return false;
    }

    try {
      const result = await this.mutate<string>(
        GRAPHQL_MUTATIONS.LEAVE_ROOM(roomId)
      );

      // Mutation returns transaction hash as data
      const success = Boolean(result?.data);
      if (success) {
        console.info('[Linera] Successfully left room:', roomId, 'tx:', result.data);
      } else {
        console.error('[Linera] Failed to leave room:', roomId, result);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error leaving room:', error);
      return false;
    }
  }

  /**
   * Make a move in a multiplayer game
   * @param roomId ID of the room
   * @param moveData Serialized move data (format depends on game type)
   * @returns True if move was successful, false otherwise
   */
  async makeGameMove(roomId: string, moveData: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot make move: not connected');
      return false;
    }

    if (!roomId || roomId.trim() === '') {
      console.error('[Linera] Invalid room ID');
      return false;
    }

    if (!moveData || moveData.trim() === '') {
      console.error('[Linera] Invalid move data');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.MAKE_MOVE(roomId, moveData)
      );

      // The mutation returns { success: bool, gameState: string } or just truthy data
      // Check for explicit success field first, then fall back to truthy data
      const success = Boolean(result?.data?.success ?? result?.data);

      console.log('[Linera] makeGameMove result:', { roomId, moveData, result, success });

      if (success) {
        console.info('[Linera] Move executed successfully in room:', roomId);
      } else {
        console.error('[Linera] Failed to execute move in room:', roomId);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error making move:', error);
      return false;
    }
  }

  /**
   * Close a multiplayer game room (only creator can close)
   * @param roomId ID of the room to close
   * @returns True if successfully closed, false otherwise
   */
  async closeMultiplayerRoom(roomId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot close room: not connected');
      return false;
    }

    if (!roomId || roomId.trim() === '') {
      console.error('[Linera] Invalid room ID');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.CLOSE_ROOM(roomId)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Successfully closed room:', roomId);
      } else {
        console.error('[Linera] Failed to close room:', roomId);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error closing room:', error);
      return false;
    }
  }

  /**
   * Get details of a specific room
   * @param roomId ID of the room
   * @returns Room details or null if not found
   */
  async getRoom(roomId: string): Promise<MultiplayerGameRoom | null> {
    if (!roomId || roomId.trim() === '') {
      console.error('[Linera] Invalid room ID');
      return null;
    }

    try {
      const result = await this.query<RoomQueryResponse>(
        GRAPHQL_QUERIES.GET_ROOM(roomId)
      );

      const room = result?.data?.room;
      if (!room) return null;

      // Normalize the room data
      return {
        ...room,
        roomId: room.roomId || (room as any).id,
        // Normalize status to consistent format (uppercase)
        status: (room.status?.toUpperCase() || 'WAITING') as any,
      };
    } catch (error) {
      console.error('[Linera] Error fetching room:', error);
      return null;
    }
  }

  /**
   * Get all active multiplayer rooms, optionally filtered by game type
   * @param gameType Optional game type filter (e.g., 'tictactoe', 'snake')
   * @returns Array of active rooms
   */
  async getMultiplayerRooms(gameType?: string): Promise<MultiplayerGameRoom[]> {
    try {
      // Don't pass gameType to query - contract doesn't support filtering
      // We'll filter client-side after fetching all rooms
      const result = await this.query<ActiveRoomsResponse>(
        GRAPHQL_QUERIES.GET_MULTIPLAYER_ROOMS()
      );

      let rooms = result?.data?.activeRooms || [];
      console.info('[Linera] Fetched multiplayer rooms:', rooms.length);

      // Client-side filter by gameType if provided
      if (gameType) {
        const graphqlGameType = gameTypeToEnum[gameType.toLowerCase()] || gameTypeToEnum[gameType];
        if (graphqlGameType) {
          rooms = rooms.filter(r => r.gameType === graphqlGameType);
          console.info('[Linera] Filtered to', rooms.length, 'rooms for gameType:', graphqlGameType);
        }
      }

      // Normalize room fields (contract uses 'id', some code expects 'roomId')
      rooms = rooms.map(r => ({
        ...r,
        roomId: r.roomId || (r as any).id,
      }));

      return rooms;
    } catch (error) {
      console.error('[Linera] Error fetching rooms:', error);
      return [];
    }
  }

  // ===========================================================================
  // TOURNAMENT OPERATIONS
  // ===========================================================================

  /**
   * Create a new tournament
   * @param name Tournament name
   * @param gameType Type of game
   * @param maxPlayers Maximum number of players
   * @returns Tournament ID if successful, null otherwise
   */
  async createTournament(name: string, gameType: string, maxPlayers: number): Promise<string | null> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot create tournament: not connected');
      return null;
    }

    if (!name || name.trim() === '') {
      console.error('[Linera] Invalid tournament name');
      return null;
    }

    if (maxPlayers < 2) {
      console.error('[Linera] Tournament must have at least 2 players');
      return null;
    }

    try {
      const result = await this.mutate<CreateTournamentResponse>(
        GRAPHQL_MUTATIONS.CREATE_TOURNAMENT(name, gameType, maxPlayers)
      );

      if (result?.data?.createTournament?.tournamentId) {
        console.info('[Linera] Tournament created:', result.data.createTournament.tournamentId);
        return result.data.createTournament.tournamentId;
      }

      console.error('[Linera] Failed to create tournament: no tournament ID returned');
      return null;
    } catch (error) {
      console.error('[Linera] Error creating tournament:', error);
      return null;
    }
  }

  /**
   * Join an existing tournament
   * @param tournamentId ID of the tournament to join
   * @returns True if successfully joined, false otherwise
   */
  async joinTournament(tournamentId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot join tournament: not connected');
      return false;
    }

    if (!tournamentId || tournamentId.trim() === '') {
      console.error('[Linera] Invalid tournament ID');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.JOIN_TOURNAMENT(tournamentId)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Successfully joined tournament:', tournamentId);
      } else {
        console.error('[Linera] Failed to join tournament:', tournamentId);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error joining tournament:', error);
      return false;
    }
  }

  /**
   * Start a tournament (only creator can start)
   * @param tournamentId ID of the tournament to start
   * @returns True if successfully started, false otherwise
   */
  async startTournament(tournamentId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot start tournament: not connected');
      return false;
    }

    if (!tournamentId || tournamentId.trim() === '') {
      console.error('[Linera] Invalid tournament ID');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.START_TOURNAMENT(tournamentId)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Successfully started tournament:', tournamentId);
      } else {
        console.error('[Linera] Failed to start tournament:', tournamentId);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error starting tournament:', error);
      return false;
    }
  }

  /**
   * Get all active tournaments
   * @returns Array of tournaments
   */
  async getTournaments(): Promise<Tournament[]> {
    try {
      const result = await this.query<TournamentsResponse>(
        GRAPHQL_QUERIES.GET_TOURNAMENTS()
      );
      return result?.data?.activeTournaments || [];
    } catch (error) {
      console.error('[Linera] Error fetching tournaments:', error);
      return [];
    }
  }

  // ===========================================================================
  // FRIEND SYSTEM OPERATIONS
  // ===========================================================================

  /**
   * Send a friend request to another player
   * @param toAddress Address of the player to send friend request to
   * @returns True if request sent successfully, false otherwise
   */
  async sendFriendRequest(toAddress: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot send friend request: not connected');
      return false;
    }

    if (!toAddress || toAddress.trim() === '') {
      console.error('[Linera] Invalid address');
      return false;
    }

    if (toAddress === this.chainId) {
      console.error('[Linera] Cannot send friend request to yourself');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.SEND_FRIEND_REQUEST(toAddress)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Friend request sent to:', toAddress);
      } else {
        console.error('[Linera] Failed to send friend request to:', toAddress);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error sending friend request:', error);
      return false;
    }
  }

  /**
   * Accept a friend request
   * @param fromAddress Address of the player who sent the request
   * @returns True if accepted successfully, false otherwise
   */
  async acceptFriendRequest(fromAddress: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot accept friend request: not connected');
      return false;
    }

    if (!fromAddress || fromAddress.trim() === '') {
      console.error('[Linera] Invalid address');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.ACCEPT_FRIEND_REQUEST(fromAddress)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Friend request accepted from:', fromAddress);
      } else {
        console.error('[Linera] Failed to accept friend request from:', fromAddress);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error accepting friend request:', error);
      return false;
    }
  }

  /**
   * Reject a friend request
   * @param fromAddress Address of the player who sent the request
   * @returns True if rejected successfully, false otherwise
   */
  async rejectFriendRequest(fromAddress: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot reject friend request: not connected');
      return false;
    }

    if (!fromAddress || fromAddress.trim() === '') {
      console.error('[Linera] Invalid address');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.REJECT_FRIEND_REQUEST(fromAddress)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Friend request rejected from:', fromAddress);
      } else {
        console.error('[Linera] Failed to reject friend request from:', fromAddress);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error rejecting friend request:', error);
      return false;
    }
  }

  /**
   * Remove a friend
   * @param friendAddress Address of the friend to remove
   * @returns True if removed successfully, false otherwise
   */
  async removeFriend(friendAddress: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot remove friend: not connected');
      return false;
    }

    if (!friendAddress || friendAddress.trim() === '') {
      console.error('[Linera] Invalid address');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.REMOVE_FRIEND(friendAddress)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Friend removed:', friendAddress);
      } else {
        console.error('[Linera] Failed to remove friend:', friendAddress);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error removing friend:', error);
      return false;
    }
  }

  /**
   * Get list of friends for a player
   * @param address Optional address (defaults to current user)
   * @returns Array of friends
   */
  async getFriends(address?: string): Promise<FriendEntry[]> {
    const targetAddress = address || this.chainId;
    if (!targetAddress) {
      console.error('[Linera] No address provided and not connected');
      return [];
    }

    try {
      const result = await this.query<FriendsResponse>(
        GRAPHQL_QUERIES.GET_FRIENDS(targetAddress)
      );
      return result?.data?.friends || [];
    } catch (error) {
      console.error('[Linera] Error fetching friends:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests
   * @param address Optional address (defaults to current user)
   * @returns Array of friend requests
   */
  async getFriendRequests(address?: string): Promise<FriendRequest[]> {
    const targetAddress = address || this.chainId;
    if (!targetAddress) {
      console.error('[Linera] No address provided and not connected');
      return [];
    }

    try {
      const result = await this.query<FriendRequestsResponse>(
        GRAPHQL_QUERIES.GET_FRIEND_REQUESTS(targetAddress)
      );
      return result?.data?.friendRequests || [];
    } catch (error) {
      console.error('[Linera] Error fetching friend requests:', error);
      return [];
    }
  }

  // ===========================================================================
  // CHALLENGE OPERATIONS
  // ===========================================================================

  /**
   * Create a challenge to another player
   * @param opponent Address of the opponent
   * @param gameType Type of game
   * @returns Challenge ID if successful, null otherwise
   */
  async createChallenge(opponent: string, gameType: string): Promise<string | null> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot create challenge: not connected');
      return null;
    }

    if (!opponent || opponent.trim() === '') {
      console.error('[Linera] Invalid opponent address');
      return null;
    }

    if (opponent === this.chainId) {
      console.error('[Linera] Cannot challenge yourself');
      return null;
    }

    try {
      const result = await this.mutate<CreateChallengeResponse>(
        GRAPHQL_MUTATIONS.CREATE_CHALLENGE(opponent, gameType)
      );

      if (result?.data?.createChallenge?.challengeId) {
        console.info('[Linera] Challenge created:', result.data.createChallenge.challengeId);
        return result.data.createChallenge.challengeId;
      }

      console.error('[Linera] Failed to create challenge: no challenge ID returned');
      return null;
    } catch (error) {
      console.error('[Linera] Error creating challenge:', error);
      return null;
    }
  }

  /**
   * Accept a challenge
   * @param challengeId ID of the challenge to accept
   * @returns Room ID if successful, null otherwise
   */
  async acceptChallenge(challengeId: string): Promise<string | null> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot accept challenge: not connected');
      return null;
    }

    if (!challengeId || challengeId.trim() === '') {
      console.error('[Linera] Invalid challenge ID');
      return null;
    }

    try {
      const result = await this.mutate<{ acceptChallenge: { roomId: string } }>(
        GRAPHQL_MUTATIONS.ACCEPT_CHALLENGE(challengeId)
      );

      if (result?.data?.acceptChallenge?.roomId) {
        console.info('[Linera] Challenge accepted, room created:', result.data.acceptChallenge.roomId);
        return result.data.acceptChallenge.roomId;
      }

      console.error('[Linera] Failed to accept challenge: no room ID returned');
      return null;
    } catch (error) {
      console.error('[Linera] Error accepting challenge:', error);
      return null;
    }
  }

  /**
   * Decline a challenge
   * @param challengeId ID of the challenge to decline
   * @returns True if declined successfully, false otherwise
   */
  async declineChallenge(challengeId: string): Promise<boolean> {
    if (!this.isConnected) {
      console.error('[Linera] Cannot decline challenge: not connected');
      return false;
    }

    if (!challengeId || challengeId.trim() === '') {
      console.error('[Linera] Invalid challenge ID');
      return false;
    }

    try {
      const result = await this.mutate<MutationSuccessResponse>(
        GRAPHQL_MUTATIONS.DECLINE_CHALLENGE(challengeId)
      );

      const success = Boolean(result?.data?.success);
      if (success) {
        console.info('[Linera] Challenge declined:', challengeId);
      } else {
        console.error('[Linera] Failed to decline challenge:', challengeId);
      }

      return success;
    } catch (error) {
      console.error('[Linera] Error declining challenge:', error);
      return false;
    }
  }

  /**
   * Get challenges for a player
   * @param address Optional address (defaults to current user)
   * @returns Array of challenges
   */
  async getChallenges(address?: string): Promise<Challenge[]> {
    const targetAddress = address || this.chainId;
    if (!targetAddress) {
      console.error('[Linera] No address provided and not connected');
      return [];
    }

    try {
      const result = await this.query<ChallengesResponse>(
        GRAPHQL_QUERIES.GET_CHALLENGES(targetAddress)
      );
      return result?.data?.challenges || [];
    } catch (error) {
      console.error('[Linera] Error fetching challenges:', error);
      return [];
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE WITH MOCK MODE SUPPORT
// =============================================================================

import { getMockClient, shouldUseMockMode, MockLineraClient } from './mockClient';

// Check if we should use mock mode
const useMockMode = shouldUseMockMode();

if (useMockMode) {
  console.info('[Linera] 🎮 MOCK MODE ENABLED - Using localStorage for multiplayer');
  console.info('[Linera] Open multiple browser tabs to test multiplayer!');
}

// Create a wrapper that delegates to either mock or real client
class LineraClientWrapper {
  private realClient: LineraGameClient;
  private mockClient: MockLineraClient;
  private usingMock: boolean;

  constructor() {
    this.realClient = new LineraGameClient();
    this.mockClient = getMockClient();
    this.usingMock = useMockMode;
  }

  get isConnected(): boolean {
    return this.usingMock ? this.mockClient.isConnected : this.realClient.isConnected;
  }

  get address(): string {
    return this.usingMock ? this.mockClient.address : this.realClient.address;
  }

  get shortAddress(): string {
    return this.usingMock ? this.mockClient.shortAddress : this.realClient.shortAddress;
  }

  get owner(): string {
    return this.usingMock ? this.mockClient.owner : this.realClient.owner;
  }

  get lineraOwnerAddress(): string {
    return this.usingMock ? this.mockClient.lineraOwnerAddress : this.realClient.lineraOwnerAddress;
  }

  getMyOwnerHex(): string {
    return this.usingMock ? this.mockClient.getMyOwnerHex() : this.realClient.getMyOwnerHex();
  }

  async connect(): Promise<{ success: boolean; address?: string; error?: string }> {
    if (this.usingMock) {
      const success = await this.mockClient.connect();
      return {
        success,
        address: success ? this.mockClient.address : undefined,
        error: success ? undefined : 'Mock connection failed'
      };
    }
    return this.realClient.connect();
  }

  disconnect(): void {
    if (this.usingMock) {
      this.mockClient.disconnect();
    } else {
      this.realClient.disconnect();
    }
  }

  async getActiveRooms(gameType?: string) {
    return this.usingMock
      ? this.mockClient.getActiveRooms(gameType)
      : this.realClient.getActiveRooms(gameType);
  }

  async createMultiplayerRoom(gameType: string, maxPlayers: number) {
    return this.usingMock
      ? this.mockClient.createMultiplayerRoom(gameType, maxPlayers)
      : this.realClient.createMultiplayerRoom(gameType, maxPlayers);
  }

  async joinMultiplayerRoom(roomId: string) {
    return this.usingMock
      ? this.mockClient.joinMultiplayerRoom(roomId)
      : this.realClient.joinMultiplayerRoom(roomId);
  }

  async leaveMultiplayerRoom(roomId: string) {
    return this.usingMock
      ? this.mockClient.leaveMultiplayerRoom(roomId)
      : this.realClient.leaveMultiplayerRoom(roomId);
  }

  async getRoom(roomId: string) {
    return this.usingMock
      ? this.mockClient.getRoom(roomId)
      : this.realClient.getRoom(roomId);
  }

  async makeMove(roomId: string, moveData: string) {
    return this.usingMock
      ? this.mockClient.makeMove(roomId, moveData)
      : this.realClient.makeMove(roomId, moveData);
  }

  async getMultiplayerRooms(gameType?: string) {
    return this.usingMock
      ? this.mockClient.getActiveRooms(gameType)
      : this.realClient.getMultiplayerRooms(gameType);
  }

  // Delegate other methods to real client (stubs in mock)
  async getUserProfile(address?: string) {
    return this.usingMock ? null : this.realClient.getUserProfile(address);
  }

  async getSnakeHighScore(address?: string) {
    return this.usingMock ? 0 : this.realClient.getSnakeHighScore(address);
  }

  async submitSnakeScore(score: number) {
    return this.usingMock ? true : this.realClient.submitSnakeScore(score);
  }

  async submitTicTacToeResult(won: boolean) {
    return this.usingMock ? true : this.realClient.submitTicTacToeResult(won);
  }

  onNotification(callback: (notification: any) => void) {
    return this.usingMock
      ? this.mockClient.onNotification(callback)
      : this.realClient.onNotification(callback);
  }

  // Room update listener for mock mode
  onRoomUpdate(callback: (rooms: any[]) => void) {
    if (this.usingMock) {
      return this.mockClient.onRoomUpdate(callback);
    }
    return () => { }; // No-op for real client
  }

  // GraphQL passthrough for components that use raw queries
  async query<T>(graphqlQuery: string) {
    if (this.usingMock) {
      console.warn('[Linera] GraphQL queries not available in mock mode');
      return null;
    }
    return this.realClient.query<T>(graphqlQuery);
  }

  async mutate<T>(graphqlMutation: string) {
    if (this.usingMock) {
      console.warn('[Linera] GraphQL mutations not available in mock mode');
      return null;
    }
    return this.realClient.mutate<T>(graphqlMutation);
  }
}

export const lineraClient = new LineraClientWrapper();
