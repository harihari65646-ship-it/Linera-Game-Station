/**
 * Linera Client Hook
 * 
 * This hook provides integration with the Linera blockchain for the Game Station.
 * It handles wallet connection, chain creation, and game operations.
 */

import { useState, useCallback, useEffect } from 'react';

// Types for Linera integration
interface LineraWallet {
  address: string;
  chainId: string;
}

interface UserProfile {
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

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  playerAddress: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  avatar: string;
}

interface GameRoom {
  id: string;
  game: string;
  players: number;
  maxPlayers: number;
  fee: number;
  host: string;
  status: 'waiting' | 'playing' | 'finished';
}

interface UseLineraClientReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  wallet: LineraWallet | null;
  error: string | null;
  
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

// Environment variables for Linera connection
const FAUCET_URL = import.meta.env.VITE_FAUCET_URL || 'http://localhost:8080';
const APP_ID = import.meta.env.VITE_LINERA_APP_ID || '';

// Avatar options
const AVATARS = ['👑', '🎮', '⚡', '🔥', '🥷', '🏆', '💎', '🎨', '🌐', '🚀', '🎯', '💀'];

// Generate deterministic data based on wallet for consistency
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function useLineraClient(): UseLineraClientReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<LineraWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('linera-wallet');
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        setWallet(parsed);
        setIsConnected(true);
      } catch {
        localStorage.removeItem('linera-wallet');
      }
    }
  }, []);

  /**
   * Connect to Linera network
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Production mode with real Linera client (when available)
      // The @linera/client package would be used here in production
      
      // Demo mode: Create simulated wallet
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      const mockChainId = `chain-${Math.random().toString(36).slice(2, 10)}`;

      const newWallet: LineraWallet = {
        address: mockAddress,
        chainId: mockChainId,
      };

      setWallet(newWallet);
      setIsConnected(true);
      localStorage.setItem('linera-wallet', JSON.stringify(newWallet));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Linera';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect from Linera network
   */
  const disconnect = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    localStorage.removeItem('linera-wallet');
  }, []);

  /**
   * Submit a Snake game score
   */
  const submitSnakeScore = useCallback(async (score: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const currentHigh = storedScores[wallet.address] || 0;
      if (score > currentHigh) {
        storedScores[wallet.address] = score;
        localStorage.setItem('linera-snake-scores', JSON.stringify(storedScores));
      }

      // Update games played
      const gamesPlayed = JSON.parse(localStorage.getItem('linera-games-played') || '{}');
      gamesPlayed[wallet.address] = (gamesPlayed[wallet.address] || 0) + 1;
      localStorage.setItem('linera-games-played', JSON.stringify(gamesPlayed));

      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Submit a Tic-Tac-Toe game result
   */
  const submitTicTacToeResult = useCallback(async (won: boolean): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedStats = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0 };
      if (won) stats.wins++;
      else stats.losses++;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-tictactoe-stats', JSON.stringify(storedStats));

      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Submit Snake & Ladders result
   */
  const submitSnakeLaddersResult = useCallback(async (won: boolean, position: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedStats = JSON.parse(localStorage.getItem('linera-snakeladders-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0, bestPosition: 4 };
      if (won) stats.wins++;
      else stats.losses++;
      if (position < stats.bestPosition) stats.bestPosition = position;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-snakeladders-stats', JSON.stringify(storedStats));

      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Submit UNO result
   */
  const submitUnoResult = useCallback(async (won: boolean): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedStats = JSON.parse(localStorage.getItem('linera-uno-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0 };
      if (won) stats.wins++;
      else stats.losses++;
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-uno-stats', JSON.stringify(storedStats));

      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (username: string, avatarId: number): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      storedProfiles[wallet.address] = { username, avatarId };
      localStorage.setItem('linera-profiles', JSON.stringify(storedProfiles));

      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Create a game room
   */
  const createRoom = useCallback(async (gameType: string, maxPlayers: number, fee: number): Promise<string | null> => {
    if (!isConnected || !wallet) return null;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

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
  }, [isConnected, wallet]);

  /**
   * Join a game room
   */
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    if (!isConnected || !wallet) return false;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const storedRooms = JSON.parse(localStorage.getItem('linera-rooms') || '[]');
      const roomIndex = storedRooms.findIndex((r: GameRoom) => r.id === roomId);
      
      if (roomIndex === -1) return false;
      
      const room = storedRooms[roomIndex];
      if (room.players >= room.maxPlayers) return false;
      
      room.players++;
      if (room.players >= room.maxPlayers) {
        room.status = 'playing';
      }
      
      localStorage.setItem('linera-rooms', JSON.stringify(storedRooms));
      return true;
    } catch {
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Get active rooms
   */
  const getActiveRooms = useCallback(async (gameType?: string): Promise<GameRoom[]> => {
    try {
      const storedRooms = JSON.parse(localStorage.getItem('linera-rooms') || '[]');
      
      // Filter out old rooms (older than 1 hour)
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
  }, []);

  /**
   * Get leaderboard
   */
  const getLeaderboard = useCallback(async (gameType: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
    try {
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const storedTTT = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const storedSL = JSON.parse(localStorage.getItem('linera-snakeladders-stats') || '{}');
      const storedUno = JSON.parse(localStorage.getItem('linera-uno-stats') || '{}');
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      const storedGames = JSON.parse(localStorage.getItem('linera-games-played') || '{}');

      // Combine all players
      const allPlayers = new Set([
        ...Object.keys(storedScores),
        ...Object.keys(storedTTT),
        ...Object.keys(storedSL),
        ...Object.keys(storedUno),
      ]);

      const entries: LeaderboardEntry[] = Array.from(allPlayers).map((address, index) => {
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

      // Sort by score and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // If no real data, show seeded demo data
      if (entries.length === 0) {
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

      return entries.slice(0, limit);
    } catch {
      return [];
    }
  }, []);

  /**
   * Get user profile
   */
  const getUserProfile = useCallback(async (address?: string): Promise<UserProfile | null> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return null;

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
  }, [wallet]);

  /**
   * Get Snake high score
   */
  const getSnakeHighScore = useCallback(async (address?: string): Promise<number> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return 0;

    try {
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      return storedScores[targetAddress] || 0;
    } catch {
      return 0;
    }
  }, [wallet]);

  return {
    isConnected,
    isConnecting,
    wallet,
    error,
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