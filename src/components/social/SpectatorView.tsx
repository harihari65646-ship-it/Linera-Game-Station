/**
 * Spectator View Component
 *
 * Allows users to watch ongoing games in real-time.
 * Shows game state, player info, and spectator-only features.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Users,
  Clock,
  X,
  Volume2,
  VolumeX,
  MessageSquare,
  Share2,
  Trophy,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface Player {
  address: string;
  username: string;
  score?: number;
  isCurrentTurn?: boolean;
}

interface SpectatorViewProps {
  roomId: string;
  gameType: GameType;
  players: Player[];
  spectatorCount?: number;
  gameState?: unknown; // Generic game state - actual component would render based on gameType
  gameStartTime?: number;
  onClose?: () => void;
  onOpenChat?: () => void;
  onShare?: () => void;
  children?: React.ReactNode; // Actual game view
}

// Demo spectator data
const DEMO_PLAYERS: Player[] = [
  { address: "0x1234...5678", username: "CryptoGamer", score: 150, isCurrentTurn: true },
  { address: "0xabcd...ef01", username: "NeonMaster", score: 120, isCurrentTurn: false },
];

const GAME_TITLES: Record<GameType, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  snakeladders: "Snake & Ladders",
  uno: "UNO",
};

export function SpectatorView({
  roomId = "demo-room",
  gameType = "tictactoe",
  players = DEMO_PLAYERS,
  spectatorCount = 5,
  gameStartTime = Date.now() - 120000,
  onClose,
  onOpenChat,
  onShare,
  children,
}: SpectatorViewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStartTime]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/90 to-transparent p-4"
          >
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Left: Room Info */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10"
                >
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-pink/20 rounded-full border border-neon-pink/50">
                    <Eye className="w-4 h-4 text-neon-pink" />
                    <span className="text-sm font-pixel text-neon-pink">LIVE</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gamepad2 className="w-4 h-4" />
                    <span className="text-sm">{GAME_TITLES[gameType]}</span>
                  </div>
                </div>
              </div>

              {/* Center: Game Time */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
              </div>

              {/* Right: Spectator Count & Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{spectatorCount} watching</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-9 w-9"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onShare}
                  className="h-9 w-9"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="neon-purple"
                  size="sm"
                  onClick={onOpenChat}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Game View */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children || (
          <div className="text-center text-muted-foreground">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-pixel text-lg">Game View Placeholder</p>
            <p className="text-sm">
              The actual game component would render here
            </p>
          </div>
        )}
      </div>

      {/* Bottom Bar - Player Info */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-4"
          >
            <div className="max-w-4xl mx-auto">
              {/* Players */}
              <div className="flex justify-center gap-8">
                {players.map((player, index) => (
                  <motion.div
                    key={player.address}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      player.isCurrentTurn
                        ? "bg-neon-yellow/10 border border-neon-yellow/50"
                        : "bg-muted/30 border border-border"
                    }`}
                    animate={
                      player.isCurrentTurn
                        ? { scale: [1, 1.02, 1] }
                        : { scale: 1 }
                    }
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? "bg-gradient-to-br from-neon-cyan to-neon-purple"
                          : "bg-gradient-to-br from-neon-pink to-neon-yellow"
                      }`}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-foreground">
                          {player.username}
                        </span>
                        {player.isCurrentTurn && (
                          <span className="text-xs text-neon-yellow font-pixel animate-pulse">
                            PLAYING
                          </span>
                        )}
                      </div>
                      {player.score !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Trophy className="w-3 h-3" />
                          <span>{player.score} pts</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Spectate List - Shows available games to watch
interface SpectateGame {
  roomId: string;
  gameType: GameType;
  players: { username: string }[];
  spectatorCount: number;
  startTime: number;
}

interface SpectateListProps {
  games?: SpectateGame[];
  onSpectate?: (roomId: string) => void;
}

const DEMO_GAMES: SpectateGame[] = [
  {
    roomId: "room-1",
    gameType: "tictactoe",
    players: [{ username: "CryptoGamer" }, { username: "NeonMaster" }],
    spectatorCount: 12,
    startTime: Date.now() - 180000,
  },
  {
    roomId: "room-2",
    gameType: "snake",
    players: [{ username: "PixelPro" }],
    spectatorCount: 8,
    startTime: Date.now() - 300000,
  },
  {
    roomId: "room-3",
    gameType: "uno",
    players: [
      { username: "ChainChamp" },
      { username: "ArcadeKing" },
      { username: "BlockBoss" },
    ],
    spectatorCount: 25,
    startTime: Date.now() - 420000,
  },
];

export function SpectateList({
  games = DEMO_GAMES,
  onSpectate,
}: SpectateListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Eye className="w-6 h-6 text-neon-pink" />
        <div>
          <h3 className="font-pixel text-lg text-primary">Live Games</h3>
          <p className="text-xs text-muted-foreground">
            {games.length} games in progress
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {games.map((game) => (
          <motion.div
            key={game.roomId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-neon-pink/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              {/* Game Icon */}
              <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-neon-pink" />
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-foreground">
                    {GAME_TITLES[game.gameType]}
                  </span>
                  <span className="text-xs bg-neon-pink/20 text-neon-pink px-2 py-0.5 rounded-full font-pixel">
                    LIVE
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {game.players.map((p) => p.username).join(" vs ")}
                </p>
              </div>
            </div>

            {/* Stats & Action */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm">{game.spectatorCount}</span>
              </div>
              <Button
                variant="neon-pink"
                size="sm"
                onClick={() => onSpectate?.(game.roomId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
              >
                <Eye className="w-4 h-4" /> Watch
              </Button>
            </div>
          </motion.div>
        ))}

        {games.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No live games right now</p>
            <p className="text-sm">Check back later or start a game!</p>
          </div>
        )}
      </div>
    </div>
  );
}
