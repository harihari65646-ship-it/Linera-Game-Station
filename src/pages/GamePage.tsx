import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SnakeGame } from "@/components/games/SnakeGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { SnakeLaddersGame } from "@/components/games/SnakeLaddersGame";
import { UnoGame } from "@/components/games/UnoGame";
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Share2,
  Info
} from "lucide-react";

const gameInfo = {
  snake: {
    title: "SNAKE",
    description: "The classic Nokia game! Use arrow keys or WASD to control your snake. Eat food to grow, don't hit the walls or yourself!",
    color: "green",
    controls: ["Arrow Keys / WASD to move", "SPACE to pause/resume"],
  },
  tictactoe: {
    title: "TIC-TAC-TOE",
    description: "The timeless game of X's and O's. Play against a friend or challenge the unbeatable AI!",
    color: "cyan",
    controls: ["Click to place your mark", "Get 3 in a row to win"],
  },
  snakeladders: {
    title: "SNAKE & LADDERS",
    description: "Roll the dice and race to 100! Climb ladders for shortcuts, but watch out for snakes that send you sliding back down.",
    color: "purple",
    controls: ["Click Roll Dice to move", "First to 100 wins"],
  },
  uno: {
    title: "UNO",
    description: "Match cards by color or number. Use action cards strategically and be the first to empty your hand!",
    color: "pink",
    controls: ["Click a card to play", "Draw if you can't play"],
  },
};

export default function GamePage() {
  const { gameType } = useParams<{ gameType: string }>();
  const game = gameInfo[gameType as keyof typeof gameInfo];

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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
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
              <p className="text-sm text-muted-foreground">Solo Mode</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </motion.div>

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
                {gameType === "tictactoe" && <TicTacToeGame />}
                {gameType === "snakeladders" && <SnakeLaddersGame />}
                {gameType === "uno" && <UnoGame />}
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

            {/* Leaderboard */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-neon-yellow" />
                    TOP SCORES
                  </CardTitle>
                  <Link to="/leaderboard">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { rank: 1, name: "PixelMaster", score: 892 },
                  { rank: 2, name: "CryptoSnake", score: 756 },
                  { rank: 3, name: "BlockGamer", score: 643 },
                  { rank: 4, name: "Web3Pro", score: 589 },
                  { rank: 5, name: "ChainKing", score: 521 },
                ].map((player) => (
                  <div
                    key={player.rank}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <span className={`font-pixel text-sm w-6 ${
                      player.rank === 1 ? "text-neon-yellow" :
                      player.rank === 2 ? "text-muted-foreground" :
                      player.rank === 3 ? "text-neon-orange" :
                      "text-muted-foreground"
                    }`}>
                      #{player.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{player.name}</p>
                    </div>
                    <span className={`font-mono text-xs text-neon-${game.color}`}>
                      {player.score}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Challenge Friend */}
            <Card variant="neon">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-4 text-primary" />
                <p className="font-pixel text-xs text-foreground mb-2">
                  CHALLENGE A FRIEND
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a room and invite your friends to play!
                </p>
                <Button variant="arcade" className="w-full">
                  Create Room
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
