import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SnakeGame } from "@/components/games/SnakeGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { SnakeLaddersGame } from "@/components/games/SnakeLaddersGame";
import { UnoGame } from "@/components/games/UnoGame";
import { QuickMatch } from "@/components/multiplayer/QuickMatch";
import {
  ArrowLeft,
  Users,
  Share2,
  Info,
  Globe,
  Plus,
  Copy,
  Zap
} from "lucide-react";
import { lineraClient } from "@/lib/linera/client";
import { toast } from "sonner";

const gameInfo = {
  snake: {
    title: "SNAKE",
    description: "The classic Nokia game! Use arrow keys or WASD to control your snake. Eat food to grow, don't hit the walls or yourself!",
    color: "green",
    controls: ["Arrow Keys / WASD to move", "SPACE to pause/resume"],
    supportsMultiplayer: false,
  },
  tictactoe: {
    title: "TIC-TAC-TOE",
    description: "The timeless game of X's and O's. Play against a friend or challenge the unbeatable AI!",
    color: "cyan",
    controls: ["Click to place your mark", "Get 3 in a row to win"],
    supportsMultiplayer: true,
  },
  snakeladders: {
    title: "SNAKE & LADDERS",
    description: "Roll the dice and race to 100! Climb ladders for shortcuts, but watch out for snakes that send you sliding back down.",
    color: "purple",
    controls: ["Click Roll Dice to move", "First to 100 wins"],
    supportsMultiplayer: true,
  },
  uno: {
    title: "UNO",
    description: "Match cards by color or number. Use action cards strategically and be the first to empty your hand!",
    color: "pink",
    controls: ["Click a card to play", "Draw if you can't play"],
    supportsMultiplayer: true,
  },
};

export default function GamePage() {
  const { gameType } = useParams<{ gameType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get roomId from URL if present
  const roomId = searchParams.get('roomId');
  const mode = searchParams.get('mode');

  const game = gameInfo[gameType as keyof typeof gameInfo];

  // Multiplayer state
  const [showQuickMatch, setShowQuickMatch] = useState(mode === 'quickmatch');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // FIX BUG 3: Hide QuickMatch when roomId is present (successful navigation)
  // This prevents QuickMatch from remounting and creating duplicate rooms
  useEffect(() => {
    if (roomId) {
      setShowQuickMatch(false);
    }
  }, [roomId]);

  if (!game) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-pixel text-2xl text-foreground mb-4">GAME NOT FOUND</h1>
          <Link to="/lobby">
            <Button variant="neon">Back to Lobby</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateRoom = async () => {
    if (!gameType) return;

    setIsCreatingRoom(true);
    try {
      const newRoomId = await lineraClient.createMultiplayerRoom(gameType, 2);

      if (newRoomId) {
        toast.success('Room created successfully!');
        // Navigate to game with roomId
        navigate(`/games/${gameType}?roomId=${newRoomId}`);
      } else {
        toast.error('Failed to create room');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreatingRoom(false);
      setShowCreateRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomCode.trim() || !gameType) return;

    setIsJoiningRoom(true);
    try {
      const success = await lineraClient.joinMultiplayerRoom(joinRoomCode);

      if (success) {
        toast.success('Joined room successfully!');
        // Navigate to game with roomId
        navigate(`/games/${gameType}?roomId=${joinRoomCode}`);
      } else {
        toast.error('Failed to join room');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsJoiningRoom(false);
      setShowJoinRoom(false);
      setJoinRoomCode("");
    }
  };

  const handleQuickMatch = () => {
    navigate(`/games/${gameType}?mode=quickmatch`);
    setShowQuickMatch(true);
  };

  const handleShareRoom = () => {
    if (roomId) {
      const shareUrl = `${window.location.origin}/games/${gameType}?roomId=${roomId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Room link copied to clipboard!');
    }
  };

  const handleCopyRoomCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success('Room code copied!');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* QuickMatch Modal */}
        <AnimatePresence>
          {showQuickMatch && gameType && (
            <QuickMatch
              gameType={gameType}
              maxPlayers={2}
              onCancel={() => {
                setShowQuickMatch(false);
                navigate(`/games/${gameType}`);
              }}
            />
          )}
        </AnimatePresence>

        {/* Create Room Modal */}
        <AnimatePresence>
          {showCreateRoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowCreateRoom(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-pixel text-lg text-primary mb-4">Create Room</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create a private room and share the code with your friend to play together.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="neon"
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="flex-1 gap-2"
                  >
                    {isCreatingRoom ? (
                      <>Creating...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Create</>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Room Modal */}
        <AnimatePresence>
          {showJoinRoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowJoinRoom(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-pixel text-lg text-primary mb-4">Join Room</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the room code shared by your friend.
                </p>
                <Input
                  placeholder="Enter room code..."
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value)}
                  className="mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowJoinRoom(false);
                      setJoinRoomCode("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="neon"
                    onClick={handleJoinRoom}
                    disabled={!joinRoomCode.trim() || isJoiningRoom}
                    className="flex-1"
                  >
                    {isJoiningRoom ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to="/lobby">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className={`font-pixel text-xl md:text-2xl text-neon-${game.color}`}>
                {game.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {roomId ? 'Multiplayer Mode' : 'Solo Mode'}
              </p>
            </div>
          </div>
          {roomId && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleShareRoom}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
          )}
        </motion.div>

        {/* Room Info Banner (when in multiplayer) */}
        {roomId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card variant="neon" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-pixel text-foreground">Room Code</p>
                    <p className="text-xs text-muted-foreground font-mono">{roomId.slice(0, 16)}...</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRoomCode}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card variant="arcade" className="overflow-hidden">
              <CardContent className="p-6 md:p-8 flex items-center justify-center min-h-[500px]">
                {gameType === "snake" && <SnakeGame />}
                {gameType === "tictactoe" && <TicTacToeGame roomId={roomId || undefined} />}
                {gameType === "snakeladders" && <SnakeLaddersGame roomId={roomId || undefined} />}
                {gameType === "uno" && <UnoGame roomId={roomId || undefined} />}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Game Info */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  HOW TO PLAY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {game.description}
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-pixel text-foreground">CONTROLS</p>
                  {game.controls.map((control, i) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {control}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Multiplayer Options (only if game supports multiplayer and not already in a room) */}
            {game.supportsMultiplayer && !roomId && (
              <Card variant="neon">
                <CardContent className="p-6 text-center">
                  <Globe className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <p className="font-pixel text-xs text-foreground mb-2">
                    PLAY ONLINE
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Challenge friends or find random opponents!
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="arcade"
                      className="w-full gap-2"
                      onClick={handleQuickMatch}
                    >
                      <Zap className="w-4 h-4" /> Quick Match
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setShowCreateRoom(true)}
                    >
                      <Plus className="w-4 h-4" /> Create Room
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setShowJoinRoom(true)}
                    >
                      <Users className="w-4 h-4" /> Join Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
