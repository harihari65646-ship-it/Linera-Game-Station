/**
 * Linera Client Hook
 *
 * Provides integration with the Linera blockchain for the Game Station.
 * Uses LineraProvider context - NO demo mode fallback.
 */

import { useCallback } from 'react';
import { useLinera } from '@/contexts/LineraProvider';
import { GRAPHQL_QUERIES, GRAPHQL_MUTATIONS } from '@/lib/linera/config';
import type { UserProfile, LeaderboardEntry, GameRoom } from '@/lib/linera';

// =============================================================================
// TYPES
// =============================================================================

interface LineraWallet {
  address: string;
  chainId: string;
  isRealBlockchain: boolean;
}

interface UseLineraClientReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  wallet: LineraWallet | null;
  error: string | null;
  isDemoMode: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;

  // Game operations
  submitSnakeScore: (score: number) => Promise<boolean>;
  submitTicTacToeResult: (won: boolean, opponent?: string) => Promise<boolean>;
  submitSnakeLaddersResult: (won: boolean, position: number) => Promise<boolean>;
  submitUnoResult: (won: boolean) => Promise<boolean>;
  updateProfile: (username: string, avatarId: number) => Promise<boolean>;

  // Room operations
  createRoom: (gameType: string, maxPlayers: number, fee: number) => Promise<string | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  getActiveRooms: (gameType?: string) => Promise<GameRoom[]>;

  // Queries
  getLeaderboard: (gameType: string, limit?: number) => Promise<LeaderboardEntry[]>;
  getUserProfile: (address?: string) => Promise<UserProfile | null>;
  getSnakeHighScore: (address?: string) => Promise<number>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useLineraClient(): UseLineraClientReturn {
  const {
    isConnected,
    isConnecting,
    chainId,
    error,
    connect: lineraConnect,
    disconnect: lineraDisconnect,
    query,
    mutate,
  } = useLinera();

  // Build wallet object from context
  const wallet: LineraWallet | null = chainId
    ? {
        address: chainId,
        chainId: chainId,
        isRealBlockchain: true, // Always real - no demo mode
      }
    : null;

  /**
   * Connect to Linera network
   */
  const connect = useCallback(async () => {
    await lineraConnect();
  }, [lineraConnect]);

  /**
   * Disconnect from Linera network
   */
  const disconnect = useCallback(() => {
    lineraDisconnect();
  }, [lineraDisconnect]);

  // ===========================================================================
  // GAME OPERATIONS (Real blockchain only)
  // ===========================================================================

  const submitSnakeScore = useCallback(
    async (score: number): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot submit score');
        return false;
      }

      try {
        const result = await mutate<{ submitSnakeScore: boolean }>(
          GRAPHQL_MUTATIONS.SUBMIT_SNAKE_SCORE(score)
        );
        return Boolean(result?.submitSnakeScore);
      } catch (err) {
        console.error('[useLineraClient] Failed to submit snake score:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  const submitTicTacToeResult = useCallback(
    async (won: boolean, opponent?: string): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot submit result');
        return false;
      }

      try {
        const result = await mutate<{ submitTicTacToeResult: boolean }>(
          GRAPHQL_MUTATIONS.SUBMIT_TICTACTOE_RESULT(won, opponent)
        );
        return Boolean(result?.submitTicTacToeResult);
      } catch (err) {
        console.error('[useLineraClient] Failed to submit tic-tac-toe result:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  const submitSnakeLaddersResult = useCallback(
    async (won: boolean, position: number): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot submit result');
        return false;
      }

      try {
        const result = await mutate<{ submitSnakeLaddersResult: boolean }>(
          GRAPHQL_MUTATIONS.SUBMIT_SNAKELADDERS_RESULT(won, position)
        );
        return Boolean(result?.submitSnakeLaddersResult);
      } catch (err) {
        console.error('[useLineraClient] Failed to submit snake & ladders result:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  const submitUnoResult = useCallback(
    async (won: boolean): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot submit result');
        return false;
      }

      try {
        const result = await mutate<{ submitUnoResult: boolean }>(
          GRAPHQL_MUTATIONS.SUBMIT_UNO_RESULT(won)
        );
        return Boolean(result?.submitUnoResult);
      } catch (err) {
        console.error('[useLineraClient] Failed to submit UNO result:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  const updateProfile = useCallback(
    async (username: string, avatarId: number): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot update profile');
        return false;
      }

      try {
        const result = await mutate<{ updateProfile: boolean }>(
          GRAPHQL_MUTATIONS.UPDATE_PROFILE(username, avatarId)
        );
        return Boolean(result?.updateProfile);
      } catch (err) {
        console.error('[useLineraClient] Failed to update profile:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  // ===========================================================================
  // ROOM OPERATIONS
  // ===========================================================================

  const createRoom = useCallback(
    async (gameType: string, maxPlayers: number, fee: number): Promise<string | null> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot create room');
        return null;
      }

      try {
        const result = await mutate<{ createRoom: { roomId: string } }>(
          GRAPHQL_MUTATIONS.CREATE_ROOM(gameType, maxPlayers, fee)
        );
        return result?.createRoom?.roomId || null;
      } catch (err) {
        console.error('[useLineraClient] Failed to create room:', err);
        return null;
      }
    },
    [isConnected, mutate]
  );

  const joinRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot join room');
        return false;
      }

      try {
        const result = await mutate<{ joinRoom: { success: boolean } }>(
          GRAPHQL_MUTATIONS.JOIN_ROOM(roomId)
        );
        return Boolean(result?.joinRoom?.success);
      } catch (err) {
        console.error('[useLineraClient] Failed to join room:', err);
        return false;
      }
    },
    [isConnected, mutate]
  );

  const getActiveRooms = useCallback(
    async (gameType?: string): Promise<GameRoom[]> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot get rooms');
        return [];
      }

      try {
        const result = await query<{ activeRooms: GameRoom[] }>(
          GRAPHQL_QUERIES.GET_ACTIVE_ROOMS(gameType)
        );
        return result?.activeRooms || [];
      } catch (err) {
        console.error('[useLineraClient] Failed to get active rooms:', err);
        return [];
      }
    },
    [isConnected, query]
  );

  // ===========================================================================
  // QUERY OPERATIONS
  // ===========================================================================

  const getLeaderboard = useCallback(
    async (gameType: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
      if (!isConnected) {
        console.warn('[useLineraClient] Not connected - cannot get leaderboard');
        return [];
      }

      try {
        const result = await query<{ leaderboard: LeaderboardEntry[] }>(
          GRAPHQL_QUERIES.GET_LEADERBOARD(gameType, limit)
        );
        return result?.leaderboard || [];
      } catch (err) {
        console.error('[useLineraClient] Failed to get leaderboard:', err);
        return [];
      }
    },
    [isConnected, query]
  );

  const getUserProfile = useCallback(
    async (address?: string): Promise<UserProfile | null> => {
      const targetAddress = address || chainId;
      if (!isConnected || !targetAddress) {
        console.warn('[useLineraClient] Not connected - cannot get profile');
        return null;
      }

      try {
        const result = await query<{ userProfile: UserProfile }>(
          GRAPHQL_QUERIES.GET_USER_PROFILE(targetAddress)
        );
        return result?.userProfile || null;
      } catch (err) {
        console.error('[useLineraClient] Failed to get user profile:', err);
        return null;
      }
    },
    [isConnected, chainId, query]
  );

  const getSnakeHighScore = useCallback(
    async (address?: string): Promise<number> => {
      const targetAddress = address || chainId;
      if (!isConnected || !targetAddress) {
        console.warn('[useLineraClient] Not connected - cannot get high score');
        return 0;
      }

      try {
        const result = await query<{ snakeHighScore: number }>(
          GRAPHQL_QUERIES.GET_SNAKE_HIGH_SCORE(targetAddress)
        );
        return result?.snakeHighScore || 0;
      } catch (err) {
        console.error('[useLineraClient] Failed to get snake high score:', err);
        return 0;
      }
    },
    [isConnected, chainId, query]
  );

  return {
    isConnected,
    isConnecting,
    wallet,
    error,
    isDemoMode: false, // Never demo mode - always real blockchain
    connect,
    disconnect,
    submitSnakeScore,
    submitTicTacToeResult,
    submitSnakeLaddersResult,
    submitUnoResult,
    updateProfile,
    createRoom,
    joinRoom,
    getActiveRooms,
    getLeaderboard,
    getUserProfile,
    getSnakeHighScore,
  };
}

export default useLineraClient;
