/**
 * Mock Linera Client for Local Testing
 *
 * Uses localStorage + BroadcastChannel to simulate multiplayer
 * across multiple browser tabs WITHOUT needing a Linera network.
 */

import { ethers } from 'ethers';
import type { GameRoom, UserProfile } from './types';

// Storage keys
const MOCK_ROOMS_KEY = 'neon_arcade_mock_rooms';
const MOCK_MNEMONIC_KEY = 'neon_arcade_mock_mnemonic';

// BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;

try {
  broadcastChannel = new BroadcastChannel('neon_arcade_rooms');
} catch (e) {
  console.warn('[MockLinera] BroadcastChannel not supported');
}

// Room update listeners
type RoomUpdateCallback = (rooms: GameRoom[]) => void;
const roomUpdateCallbacks: RoomUpdateCallback[] = [];

// Listen for cross-tab updates
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data.type === 'ROOMS_UPDATED') {
      console.info('[MockLinera] Received room update from another tab');
      roomUpdateCallbacks.forEach(cb => cb(getRoomsFromStorage()));
    }
  };
}

function notifyRoomUpdate() {
  const rooms = getRoomsFromStorage();
  roomUpdateCallbacks.forEach(cb => cb(rooms));
  broadcastChannel?.postMessage({ type: 'ROOMS_UPDATED' });
}

function getRoomsFromStorage(): GameRoom[] {
  try {
    const data = localStorage.getItem(MOCK_ROOMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRoomsToStorage(rooms: GameRoom[]) {
  localStorage.setItem(MOCK_ROOMS_KEY, JSON.stringify(rooms));
}

function getOrCreateMockMnemonic(): string {
  let mnemonic = localStorage.getItem(MOCK_MNEMONIC_KEY);
  if (!mnemonic) {
    const wallet = ethers.Wallet.createRandom();
    mnemonic = wallet.mnemonic?.phrase || '';
    localStorage.setItem(MOCK_MNEMONIC_KEY, mnemonic);
  }
  return mnemonic;
}

export class MockLineraClient {
  private mockChainId: string = '';
  private mockOwnerAddress: string = '';
  private mockLineraOwner: string = '';
  private connected: boolean = false;

  get isConnected(): boolean {
    return this.connected;
  }

  get address(): string {
    return this.mockChainId;
  }

  get shortAddress(): string {
    if (!this.mockChainId) return '';
    return `${this.mockChainId.slice(0, 6)}...${this.mockChainId.slice(-4)}`;
  }

  get owner(): string {
    return this.mockOwnerAddress;
  }

  get lineraOwnerAddress(): string {
    return this.mockLineraOwner;
  }

  getMyOwnerHex(): string {
    return this.mockLineraOwner || this.mockOwnerAddress;
  }

  async connect(): Promise<boolean> {
    try {
      console.info('[MockLinera] Starting mock connection...');

      // Generate deterministic addresses from mnemonic
      const mnemonic = getOrCreateMockMnemonic();
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      this.mockOwnerAddress = wallet.address.toLowerCase().replace('0x', '');
      // Linera Address32 is left-padded EVM address
      this.mockLineraOwner = this.mockOwnerAddress.padStart(64, '0');
      // Chain ID is a random hash based on the wallet
      this.mockChainId = ethers.keccak256(ethers.toUtf8Bytes(wallet.address)).slice(2);

      this.connected = true;

      console.info('[MockLinera] Connected successfully (MOCK MODE)');
      console.info('[MockLinera] Chain ID:', this.mockChainId);
      console.info('[MockLinera] Owner Address:', this.mockOwnerAddress);
      console.info('[MockLinera] Linera Owner:', this.mockLineraOwner);

      return true;
    } catch (error) {
      console.error('[MockLinera] Connection failed:', error);
      return false;
    }
  }

  disconnect(): void {
    this.connected = false;
    this.mockChainId = '';
    this.mockOwnerAddress = '';
    this.mockLineraOwner = '';
    console.info('[MockLinera] Disconnected');
  }

  onRoomUpdate(callback: RoomUpdateCallback): () => void {
    roomUpdateCallbacks.push(callback);
    return () => {
      const idx = roomUpdateCallbacks.indexOf(callback);
      if (idx >= 0) roomUpdateCallbacks.splice(idx, 1);
    };
  }

  async getActiveRooms(gameType?: string): Promise<GameRoom[]> {
    let rooms = getRoomsFromStorage();

    // Filter out expired rooms (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    rooms = rooms.filter(r => (r.createdAt || 0) > oneHourAgo);

    // Filter by game type if provided
    if (gameType) {
      const gameTypeUpper = gameType.toUpperCase().replace('-', '_');
      rooms = rooms.filter(r => r.gameType === gameTypeUpper || r.gameType === gameType);
    }

    console.info('[MockLinera] Active rooms:', rooms.length);
    return rooms;
  }

  async createMultiplayerRoom(gameType: string, maxPlayers: number): Promise<string | null> {
    if (!this.connected) {
      console.error('[MockLinera] Cannot create room: not connected');
      return null;
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const gameTypeUpper = gameType.toUpperCase().replace('-', '_');

    const newRoom: GameRoom = {
      id: roomId,
      roomId: roomId,
      gameType: gameTypeUpper,
      creator: this.mockLineraOwner,
      players: [this.mockLineraOwner],
      maxPlayers: maxPlayers,
      entryFee: 0,
      status: 'WAITING',
      currentState: '',
      winner: null,
      createdAt: Date.now(),
      lastMoveTime: Date.now(),
      gameMode: 'MULTIPLAYER',
    };

    const rooms = getRoomsFromStorage();
    rooms.push(newRoom);
    saveRoomsToStorage(rooms);

    console.info('[MockLinera] Created room:', roomId);
    notifyRoomUpdate();

    return roomId;
  }

  async joinMultiplayerRoom(roomId: string): Promise<boolean> {
    if (!this.connected) {
      console.error('[MockLinera] Cannot join room: not connected');
      return false;
    }

    const rooms = getRoomsFromStorage();
    const room = rooms.find(r => r.id === roomId || r.roomId === roomId);

    if (!room) {
      console.error('[MockLinera] Room not found:', roomId);
      return false;
    }

    if (room.players.includes(this.mockLineraOwner)) {
      console.info('[MockLinera] Already in room');
      return true;
    }

    if (room.players.length >= room.maxPlayers) {
      console.error('[MockLinera] Room is full');
      return false;
    }

    room.players.push(this.mockLineraOwner);

    if (room.players.length >= room.maxPlayers) {
      room.status = 'IN_PROGRESS';
    }

    saveRoomsToStorage(rooms);

    console.info('[MockLinera] Joined room:', roomId, 'Players:', room.players.length);
    notifyRoomUpdate();

    return true;
  }

  async leaveMultiplayerRoom(roomId: string): Promise<boolean> {
    if (!this.connected) return false;

    const rooms = getRoomsFromStorage();
    const roomIndex = rooms.findIndex(r => r.id === roomId || r.roomId === roomId);

    if (roomIndex === -1) return false;

    const room = rooms[roomIndex];
    room.players = room.players.filter(p => p !== this.mockLineraOwner);

    if (room.players.length === 0) {
      rooms.splice(roomIndex, 1);
    } else {
      room.status = 'WAITING';
    }

    saveRoomsToStorage(rooms);
    notifyRoomUpdate();

    return true;
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    const rooms = getRoomsFromStorage();
    return rooms.find(r => r.id === roomId || r.roomId === roomId) || null;
  }

  async makeMove(roomId: string, moveData: string): Promise<{ success: boolean; gameState?: string }> {
    const rooms = getRoomsFromStorage();
    const room = rooms.find(r => r.id === roomId || r.roomId === roomId);

    if (!room) {
      return { success: false };
    }

    room.currentState = moveData;
    room.lastMoveTime = Date.now();

    // Check for winner in the move data
    try {
      const state = JSON.parse(moveData);
      if (state.winner) {
        room.winner = state.winner;
        room.status = 'COMPLETED';
      }
    } catch {}

    saveRoomsToStorage(rooms);
    notifyRoomUpdate();

    return { success: true, gameState: moveData };
  }

  // Stub methods for compatibility
  async getUserProfile(): Promise<UserProfile | null> {
    return null;
  }

  async getSnakeHighScore(): Promise<number> {
    return 0;
  }

  async submitSnakeScore(): Promise<boolean> {
    return true;
  }

  async submitTicTacToeResult(): Promise<boolean> {
    return true;
  }

  onNotification(callback: (notification: any) => void): () => void {
    // No-op for mock
    return () => {};
  }
}

// Singleton instance
let mockClientInstance: MockLineraClient | null = null;

export function getMockClient(): MockLineraClient {
  if (!mockClientInstance) {
    mockClientInstance = new MockLineraClient();
  }
  return mockClientInstance;
}

// Check if we should use mock mode
export function shouldUseMockMode(): boolean {
  // Use mock mode if explicitly enabled or if no app ID configured
  const useMock = import.meta.env.VITE_USE_MOCK_MODE === 'true';
  const noAppId = !import.meta.env.VITE_LINERA_APP_ID;
  return useMock || noAppId;
}
