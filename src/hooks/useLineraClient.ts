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
  tictactoeWins: number;
  tictactoeLosses: number;
}

interface LeaderboardEntry {
  playerName: string;
  playerAddress: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
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
  updateProfile: (username: string, avatarId: number) => Promise<boolean>;
  
  // Queries
  getLeaderboard: (gameType: string, limit?: number) => Promise<LeaderboardEntry[]>;
  getUserProfile: (address?: string) => Promise<UserProfile | null>;
  getSnakeHighScore: (address?: string) => Promise<number>;
}

// Environment variables for Linera connection
const FAUCET_URL = import.meta.env.VITE_FAUCET_URL || 'http://localhost:8080';
const APP_ID = import.meta.env.VITE_LINERA_APP_ID || '';

// Mock data for development/demo mode
const mockLeaderboard: LeaderboardEntry[] = [
  { playerName: "CryptoKing", playerAddress: "0x1234...5678", score: 12847, gamesPlayed: 234, winRate: 78 },
  { playerName: "Web3Pro", playerAddress: "0x2345...6789", score: 11293, gamesPlayed: 198, winRate: 72 },
  { playerName: "BlockMaster", playerAddress: "0x3456...7890", score: 10892, gamesPlayed: 312, winRate: 65 },
  { playerName: "ChainGamer", playerAddress: "0x4567...8901", score: 9847, gamesPlayed: 156, winRate: 69 },
  { playerName: "PixelNinja", playerAddress: "0x5678...9012", score: 8921, gamesPlayed: 287, winRate: 61 },
];

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
   * In production, this would use @linera/client to create a real wallet
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // For demo/development, create a mock wallet
      // In production with @linera/client:
      // const linera = await import('@linera/client');
      // await linera.default();
      // const faucet = await new linera.Faucet(FAUCET_URL);
      // const wallet = await faucet.createWallet();
      // const client = await new linera.Client(wallet);
      // const chain = await faucet.claimChain(client);

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock wallet for demo
      const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      const mockChainId = `chain-${Math.random().toString(36).slice(2, 10)}`;

      const newWallet: LineraWallet = {
        address: mockAddress,
        chainId: mockChainId,
      };

      setWallet(newWallet);
      setIsConnected(true);
      localStorage.setItem('linera-wallet', JSON.stringify(newWallet));

      console.log('🎮 Connected to Linera Game Station');
      console.log(`   Address: ${mockAddress}`);
      console.log(`   Chain: ${mockChainId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Linera';
      setError(message);
      console.error('Connection error:', err);
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
    console.log('👋 Disconnected from Linera Game Station');
  }, []);

  /**
   * Submit a Snake game score to the blockchain
   */
  const submitSnakeScore = useCallback(async (score: number): Promise<boolean> => {
    if (!isConnected || !wallet) {
      console.warn('Not connected to Linera');
      return false;
    }

    try {
      console.log(`📤 Submitting Snake score: ${score}`);
      
      // In production with @linera/client:
      // const app = await client.frontend().application(APP_ID);
      // await app.mutate(`
      //   mutation {
      //     submitSnakeScore(score: ${score})
      //   }
      // `);

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local storage for demo
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const currentHigh = storedScores[wallet.address] || 0;
      if (score > currentHigh) {
        storedScores[wallet.address] = score;
        localStorage.setItem('linera-snake-scores', JSON.stringify(storedScores));
      }

      console.log(`✅ Score submitted successfully`);
      return true;
    } catch (err) {
      console.error('Failed to submit score:', err);
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Submit a Tic-Tac-Toe game result
   */
  const submitTicTacToeResult = useCallback(async (won: boolean, opponent?: string): Promise<boolean> => {
    if (!isConnected || !wallet) {
      console.warn('Not connected to Linera');
      return false;
    }

    try {
      console.log(`📤 Submitting TicTacToe result: ${won ? 'WIN' : 'LOSS'}`);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local storage for demo
      const storedStats = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      const stats = storedStats[wallet.address] || { wins: 0, losses: 0 };
      if (won) {
        stats.wins++;
      } else {
        stats.losses++;
      }
      storedStats[wallet.address] = stats;
      localStorage.setItem('linera-tictactoe-stats', JSON.stringify(storedStats));

      console.log(`✅ Result submitted successfully`);
      return true;
    } catch (err) {
      console.error('Failed to submit result:', err);
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Update user profile on-chain
   */
  const updateProfile = useCallback(async (username: string, avatarId: number): Promise<boolean> => {
    if (!isConnected || !wallet) {
      console.warn('Not connected to Linera');
      return false;
    }

    try {
      console.log(`📤 Updating profile: ${username}`);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local storage for demo
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      storedProfiles[wallet.address] = { username, avatarId };
      localStorage.setItem('linera-profiles', JSON.stringify(storedProfiles));

      console.log(`✅ Profile updated successfully`);
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      return false;
    }
  }, [isConnected, wallet]);

  /**
   * Get leaderboard from the blockchain
   */
  const getLeaderboard = useCallback(async (gameType: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
    try {
      console.log(`📥 Fetching ${gameType} leaderboard`);
      
      // In production with @linera/client:
      // const app = await client.frontend().application(APP_ID);
      // const result = await app.query(`
      //   query {
      //     leaderboard(gameType: "${gameType}", limit: ${limit}) {
      //       playerName
      //       playerAddress
      //       score
      //       gamesPlayed
      //       winRate
      //     }
      //   }
      // `);
      // return result.data.leaderboard;

      // Return mock data for demo
      return mockLeaderboard.slice(0, limit);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      return [];
    }
  }, []);

  /**
   * Get user profile from the blockchain
   */
  const getUserProfile = useCallback(async (address?: string): Promise<UserProfile | null> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return null;

    try {
      console.log(`📥 Fetching profile for ${targetAddress}`);
      
      // Get from local storage for demo
      const storedProfiles = JSON.parse(localStorage.getItem('linera-profiles') || '{}');
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      const storedStats = JSON.parse(localStorage.getItem('linera-tictactoe-stats') || '{}');
      
      const profile = storedProfiles[targetAddress] || {};
      const snakeHighScore = storedScores[targetAddress] || 0;
      const tttStats = storedStats[targetAddress] || { wins: 0, losses: 0 };

      return {
        username: profile.username || 'Anonymous Player',
        avatarId: profile.avatarId || 0,
        level: Math.floor((snakeHighScore / 100 + tttStats.wins * 5) / 10) + 1,
        xp: snakeHighScore + tttStats.wins * 50 + tttStats.losses * 10,
        snakeHighScore,
        snakeGames: Math.floor(snakeHighScore / 50) + 1,
        tictactoeWins: tttStats.wins,
        tictactoeLosses: tttStats.losses,
      };
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  }, [wallet]);

  /**
   * Get Snake high score from the blockchain
   */
  const getSnakeHighScore = useCallback(async (address?: string): Promise<number> => {
    const targetAddress = address || wallet?.address;
    if (!targetAddress) return 0;

    try {
      const storedScores = JSON.parse(localStorage.getItem('linera-snake-scores') || '{}');
      return storedScores[targetAddress] || 0;
    } catch (err) {
      console.error('Failed to fetch high score:', err);
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
    updateProfile,
    getLeaderboard,
    getUserProfile,
    getSnakeHighScore,
  };
}

export default useLineraClient;
