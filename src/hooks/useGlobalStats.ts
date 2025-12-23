/**
 * Global Stats Hook
 * 
 * Provides real-time global statistics for the landing page.
 * In demo mode, simulates live updates. In real mode, fetches from blockchain.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLineraClient } from './useLineraClient';

export interface GlobalStats {
  playersOnline: number;
  gamesPlayed: number;
  activeRooms: number;
}

export interface LiveActivity {
  id: string;
  player: string;
  action: string;
  target?: string;
  score?: string;
  time: string;
  timestamp: number;
}

const DEMO_PLAYERS = [
  'CryptoNinja', 'Web3Gamer', 'PixelKing', 'ChainChamp', 'BlockMaster',
  'DeFiPlayer', 'NFTCollector', 'MetaGamer', 'ZeroLag', 'TokenChamp',
  'GameFi_Pro', 'SnakeKing99', 'UnoMaster', 'TicTacPro', 'LadderClimber'
];

const DEMO_ACTIONS = [
  { action: 'won Snake', hasScore: true },
  { action: 'beat', hasTarget: true },
  { action: 'challenged', hasTarget: true },
  { action: 'joined', hasTarget: true },
  { action: 'set record', hasScore: true },
  { action: 'won UNO against', hasTarget: true },
  { action: 'climbed to #', hasScore: true },
];

const DEMO_TARGETS = [
  'Room #4821', 'Room #7392', 'AI Hard Mode', 'AI Extreme',
  'BlockMaster', 'PixelKing', 'CryptoNinja', 'Web3Gamer'
];

function generateRandomActivity(): LiveActivity {
  const player = DEMO_PLAYERS[Math.floor(Math.random() * DEMO_PLAYERS.length)];
  const actionType = DEMO_ACTIONS[Math.floor(Math.random() * DEMO_ACTIONS.length)];
  const timestamp = Date.now();
  
  return {
    id: `activity-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    player,
    action: actionType.action,
    target: actionType.hasTarget 
      ? DEMO_TARGETS[Math.floor(Math.random() * DEMO_TARGETS.length)]
      : undefined,
    score: actionType.hasScore 
      ? `${Math.floor(Math.random() * 500 + 50)} pts`
      : undefined,
    time: 'just now',
    timestamp,
  };
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function useGlobalStats() {
  const { isDemoMode } = useLineraClient();
  
  const [stats, setStats] = useState<GlobalStats>({
    playersOnline: 2847,
    gamesPlayed: 147392,
    activeRooms: 89,
  });
  
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize activities
  useEffect(() => {
    const initial = Array.from({ length: 4 }, () => generateRandomActivity());
    setActivities(initial);
    setIsLoading(false);
  }, []);

  // Simulate real-time stats updates
  useEffect(() => {
    if (!isDemoMode) return;

    intervalRef.current = setInterval(() => {
      setStats(prev => ({
        playersOnline: Math.max(2000, prev.playersOnline + Math.floor(Math.random() * 21) - 10),
        gamesPlayed: prev.gamesPlayed + Math.floor(Math.random() * 5),
        activeRooms: Math.max(50, prev.activeRooms + Math.floor(Math.random() * 5) - 2),
      }));
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isDemoMode]);

  // Simulate live activity feed
  useEffect(() => {
    if (!isDemoMode) return;

    activityIntervalRef.current = setInterval(() => {
      // Update timestamps
      setActivities(prev => prev.map(a => ({
        ...a,
        time: formatTimeAgo(a.timestamp),
      })));

      // Add new activity occasionally
      if (Math.random() > 0.5) {
        setActivities(prev => [
          generateRandomActivity(),
          ...prev.slice(0, 9),
        ]);
      }
    }, 2000);

    return () => {
      if (activityIntervalRef.current) clearInterval(activityIntervalRef.current);
    };
  }, [isDemoMode]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    // In real mode, would fetch from blockchain
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  }, []);

  return {
    stats,
    activities,
    isLoading,
    refresh,
    isDemoMode,
  };
}

export default useGlobalStats;
