/**
 * Linera Client Hook
 * 
 * Provides integration with the Linera blockchain for the Game Station.
 * Automatically falls back to demo mode if Linera SDK is not available.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  lineraClient, 
  initializeLinera, 
  isLineraAvailable,
  isDemoMode,
  isLineraConfigured,
  getLineraEnvInfo
} from '@/lib/linera';
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
// DEMO MODE HELPERS
// =============================================================================

const AVATARS = ['👑', '🎮', '⚡', '🔥', '🥷', '🏆', '💎', '🎨', '🌐', '🚀', '🎯', '💀'];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Demo data generators
function generateDemoLeaderboard(gameType: string, limit: number): LeaderboardEntry[] {
  const demoPlayers = [
    { name: 'CryptoKing', score: 12847, games: 234, winRate: 78, avatar: '👑' },
    { name: 'Web3Pro', score: 11293, games: 198, winRate: 72, avatar: '🎮' },
    { name: 'BlockMaster', score: 10892, games: 312, winRate: 65, avatar: '⚡' },
    { name: 'ChainGamer', score: 9847, games: 156, winRate: 69, avatar: '🔥' },
    { name: 'PixelNinja', score: 8921, games: 287, winRate: 61, avatar: '🥷' },
    { name: 'TokenChamp', score: 8456, games: 201, winRate: 58, avatar: '🏆' },
    { name: 'DeFiGamer', score: 7892, games: 178, winRate: 55, avatar: '💎' },
    { name: 'NFTPlayer', score: 7234, games: 245, winRate: 52, avatar: '🎨' },
    { name: 'MetaGamer', score: 6891, games: 134, winRate: 60, avatar: '🌐' },
    { name: 'ZeroLag', score: 6543, games: 167, winRate: 54, avatar: '⚡' },
  ];

  return demoPlayers.slice(0, limit).map((p, i) => ({
    rank: i + 1,
    playerName: p.name,
    playerAddress: `0x${hashCode(p.name).toString(16).slice(0, 8)}...`,
    score: p.score,
    gamesPlayed: p.games,
    winRate: p.winRate,
    avatar: p.avatar,
  }));
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useLineraClient(): UseLineraClientReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<LineraWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingDemoMode, setUsingDemoMode] = useState(true);
  
  const initAttempted = useRef(false);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Only run once
      if (initAttempted.current) return;
      initAttempted.current = true;

      // Log environment info
      const envInfo = getLineraEnvInfo();
      console.info('[useLineraClient] Environment:', envInfo);

      // Check if Linera is configured
      if (isLineraConfigured()) {
        // Try to initialize real Linera
        await initializeLinera();
        if (isLineraAvailable() && lineraClient.isConnected) {
          setWallet({
            address: lineraClient.address,
            chainId: lineraClient.address,
            isRealBlockchain: true,
          });
          setIsConnected(true);
          setUsingDemoMode(false);
          return;
        }
      }

      // Fall back to demo mode - check localStorage
      const savedWallet = localStorage.getItem('linera-wallet');
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet);
          setWallet({ ...parsed, isRealBlockchain: false });
          setIsConnected(true);
          setUsingDemoMode(true);
        } catch {
          localStorage.removeItem('linera-wallet');
        }
      }
    };

    checkConnection();
  }, []);

  /**
   * Connect to Linera network (or demo mode)
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Try real Linera first if configured
      if (isLineraConfigured()) {
        await initializeLinera();
        
        if (isLineraAvailable()) {
          const result = await lineraClient.connect();
          
          if (result.success) {
            setWallet({
              address: result.address,
              chainId: result.address,
              isRealBlockchain: true,
            });
            setIsConnected(true);
            setUsingDemoMode(false);
            setIsConnecting(false);
            return;
          } else {
            console.warn('[useLineraClient] Real Linera connection failed:', result.error);
          }
        }
      }

      // Fall back to demo mode
      console.info('[useLineraClient] Using demo mode');
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      const mockChainId = `chain-${Math.random().toString(36).slice(2, 10)}`;

      const newWallet: LineraWallet = {
        address: mockAddress,
        chainId: mockChainId,
        isRealBlockchain: false,
      };

      setWallet(newWallet);
      setIsConnected(true);
      setUsingDemoMode(true);
      localStorage.setItem('linera-wallet', JSON.stringify(newWallet));

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect from Linera network
   */
  const disconnect = useCallback(() => {
    if (!usingDemoMode && lineraClient.isConnected) {
      lineraClient.disconnect();
    }
    setWallet(null);
    setIsConnected(false);
    localStorage.removeItem('linera-wallet');
  }, [usingDemoMode]);

  // ===========================================================================
  // GAME OPERATIONS (Real blockchain or demo mode)
  // ===========================================================================

  const submitSnakeScore = useCallback(async (score: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    // Real blockchain
    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.submitSnakeScore(score);
    }

    // Demo mode
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const currentHigh = storedScores[wallet.address] || 0;
      if (score > currentHigh) {
        storedScores[wallet.address] = score;
        localStorage.setItem('linera-snake-scores', JSON.stringify(storedScores));
      }
      const gamesPlayed = JSON.parse(localStorage.getItem('linera-games-played') || '{}');
      gamesPlayed[wallet.address] = (gamesPlayed[wallet.address] || 0) + 1;
      localStorage.setItem('linera-games-played', JSON.stringify(gamesPlayed));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const submitTicTacToeResult = useCallback(async (won: boolean): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.submitTicTacToeResult(won);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedStats = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0 };
      if (won) stats.wins++; else stats.losses++;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-tictactoe-stats', JSON.stringify(storedStats));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const submitSnakeLaddersResult = useCallback(async (won: boolean, position: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.submitSnakeLaddersResult(won, position);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedStats = JSON.parse(localStorage.getItem('linera-snakeladders-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0, bestPosition: 4 };
      if (won) stats.wins++; else stats.losses++;
      if (position < stats.bestPosition) stats.bestPosition = position;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-snakeladders-stats', JSON.stringify(storedStats));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const submitUnoResult = useCallback(async (won: boolean): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.submitUnoResult(won);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedStats = JSON.parse(localStorage.getItem('linera-uno-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0 };
      if (won) stats.wins++; else stats.losses++;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-uno-stats', JSON.stringify(storedStats));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const updateProfile = useCallback(async (username: string, avatarId: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.updateProfile(username, avatarId);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      storedProfiles[wallet.address] = { username, avatarId };
      localStorage.setItem('linera-profiles', JSON.stringify(storedProfiles));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  // ===========================================================================
  // ROOM OPERATIONS
  // ===========================================================================

  const createRoom = useCallback(async (gameType: string, maxPlayers: number, fee: number): Promise<string | null> => {
    if (!isConnected || !wallet) return null;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.createRoom(gameType, maxPlayers, fee);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const roomId = `${gameType.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const storedRooms = JSON.parse(localStorage.getItem('linera-rooms') || '[]');
      const profile = JSON.parse(localStorage.getItem('linera-profiles') || '{}')[wallet.address];
      
      storedRooms.push({
        id: roomId,
        game: gameType,
        players: 1,
        maxPlayers,
        fee,
        host: profile?.username || wallet.address.slice(0, 10),
        status: 'waiting',
        createdAt: Date.now(),
      });
      
      localStorage.setItem('linera-rooms', JSON.stringify(storedRooms));
      return roomId;
    } catch {
      return null;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.joinRoom(roomId);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const storedRooms = JSON.parse(localStorage.getItem('linera-rooms') || '[]');
      const roomIndex = storedRooms.findIndex((r: GameRoom) => r.id === roomId);
      
      if (roomIndex === -1) return false;
      
      const room = storedRooms[roomIndex];
      if (room.players >= room.maxPlayers) return false;
      
      room.players++;
      if (room.players >= room.maxPlayers) room.status = 'playing';
      
      localStorage.setItem('linera-rooms', JSON.stringify(storedRooms));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet, usingDemoMode]);

  const getActiveRooms = useCallback(async (gameType?: string): Promise<GameRoom[]> => {
    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.getActiveRooms(gameType);
    }

    try {
      const storedRooms = JSON.parse(localStorage.getItem('linera-rooms') || '[]');
      const now = Date.now();
      const activeRooms = storedRooms.filter((r: any) => 
        now - r.createdAt < 3600000 && r.status !== 'finished'
      );
      
      if (gameType && gameType !== 'all') {
        return activeRooms.filter((r: GameRoom) => r.game === gameType);
      }
      return activeRooms;
    } catch {
      return [];
    }
  }, [usingDemoMode]);

  // ===========================================================================
  // QUERY OPERATIONS
  // ===========================================================================

  const getLeaderboard = useCallback(async (gameType: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.getLeaderboard(gameType, limit);
    }

    // Demo mode - combine stored data with demo players
    try {
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const storedTTT = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const storedSL = JSON.parse(localStorage.getItem('linera-snakeladders-stats') || '{}');
      const storedUno = JSON.parse(localStorage.getItem('linera-uno-stats') || '{}');
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      const storedGames = JSON.parse(localStorage.getItem('linera-games-played') || '{}');

      const allPlayers = new Set([
        ...Object.keys(storedScores),
        ...Object.keys(storedTTT),
        ...Object.keys(storedSL),
        ...Object.keys(storedUno),
      ]);

      const entries: LeaderboardEntry[] = Array.from(allPlayers).map((address) => {
        const profile = storedProfiles[address] || {};
        const snakeScore = storedScores[address] || 0;
        const tttStats = storedTTT[address] || { wins: 0, losses: 0 };
        const slStats = storedSL[address] || { wins: 0, losses: 0 };
        const unoStats = storedUno[address] || { wins: 0, losses: 0 };

        let score = 0;
        let wins = 0;
        let losses = 0;

        switch (gameType) {
          case 'snake':
            score = snakeScore;
            wins = Math.floor(snakeScore / 50);
            break;
          case 'tictactoe':
            score = tttStats.wins * 100;
            wins = tttStats.wins;
            losses = tttStats.losses;
            break;
          case 'snakeladders':
            score = slStats.wins * 150;
            wins = slStats.wins;
            losses = slStats.losses;
            break;
          case 'uno':
            score = unoStats.wins * 100;
            wins = unoStats.wins;
            losses = unoStats.losses;
            break;
          default:
            score = snakeScore + (tttStats.wins + slStats.wins + unoStats.wins) * 100;
            wins = tttStats.wins + slStats.wins + unoStats.wins;
            losses = tttStats.losses + slStats.losses + unoStats.losses;
        }

        const gamesPlayed = wins + losses || storedGames[address] || 1;
        const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

        return {
          rank: 0,
          playerName: profile.username || `Player${hashCode(address) % 1000}`,
          playerAddress: address,
          score,
          gamesPlayed,
          winRate,
          avatar: AVATARS[hashCode(address) % AVATARS.length],
        };
      });

      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => { entry.rank = index + 1; });

      // If no real data, show demo leaderboard
      if (entries.length === 0) {
        return generateDemoLeaderboard(gameType, limit);
      }

      return entries.slice(0, limit);
    } catch {
      return generateDemoLeaderboard(gameType, limit);
    }
  }, [usingDemoMode]);

  const getUserProfile = useCallback(async (address?: string): Promise<UserProfile | null> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return null;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.getUserProfile(targetAddress);
    }

    try {
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const storedTTT = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const storedSL = JSON.parse(localStorage.getItem('linera-snakeladders-stats') || '{}');
      const storedUno = JSON.parse(localStorage.getItem('linera-uno-stats') || '{}');
      const storedGames = JSON.parse(localStorage.getItem('linera-games-played') || '{}');
      
      const profile = storedProfiles[targetAddress] || {};
      const snakeHighScore = storedScores[targetAddress] || 0;
      const tttStats = storedTTT[targetAddress] || { wins: 0, losses: 0 };
      const slStats = storedSL[targetAddress] || { wins: 0, losses: 0 };
      const unoStats = storedUno[targetAddress] || { wins: 0, losses: 0 };
      const snakeGames = storedGames[targetAddress] || 0;

      const totalWins = tttStats.wins + slStats.wins + unoStats.wins;
      const totalXP = snakeHighScore + totalWins * 50;

      return {
        username: profile.username || 'Anonymous Player',
        avatarId: profile.avatarId || 0,
        level: Math.floor(totalXP / 500) + 1,
        xp: totalXP % 500,
        snakeHighScore,
        snakeGames,
        snakeLaddersWins: slStats.wins,
        snakeLaddersLosses: slStats.losses,
        tictactoeWins: tttStats.wins,
        tictactoeLosses: tttStats.losses,
        unoWins: unoStats.wins,
        unoLosses: unoStats.losses,
      };
    } catch {
      return null;
    }
  }, [wallet, usingDemoMode]);

  const getSnakeHighScore = useCallback(async (address?: string): Promise<number> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return 0;

    if (!usingDemoMode && lineraClient.isConnected) {
      return lineraClient.getSnakeHighScore(targetAddress);
    }

    try {
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      return storedScores[targetAddress] || 0;
    } catch {
      return 0;
    }
  }, [wallet, usingDemoMode]);

  return {
    isConnected,
    isConnecting,
    wallet,
    error,
    isDemoMode: usingDemoMode,
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
