import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/games/GameCard";
import { 
  Users, 
  Trophy, 
  Zap, 
  Plus, 
  Filter,
  Search,
  Gamepad2,
  Clock,
  Coins
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

// Game icons
const SnakeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M21 6c-1.1 0-2 .9-2 2 0 .4.1.7.3 1L17 12H9c-1.1 0-2 .9-2 2v2H3c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2h4.6l2.8 3.2c-.3.3-.4.7-.4 1.1 0 1.1.9 2 2 2s2-.9 2-2c0-1.1-.9-2-2-2-.4 0-.7.1-1 .3l-3-3.4 3-3.4c.3.2.6.3 1 .3 1.1 0 2-.9 2-2s-.9-2-2-2z"/>
  </svg>
);

const TicTacToeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M4 4h4v4H4V4m6 0h4v4h-4V4m6 0h4v4h-4V4M4 10h4v4H4v-4m6 0h4v4h-4v-4m6 0h4v4h-4v-4M4 16h4v4H4v-4m6 0h4v4h-4v-4m6 0h4v4h-4v-4z"/>
  </svg>
);

const DiceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2 4a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 10a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 7 7m10 0a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 17 10a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 17 7m-5 5a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 12 15a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 12 12m-5 5a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 20a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 7 17m10 0a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 17 20a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 17 17z"/>
  </svg>
);

const UnoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4m8 3.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5m0 2c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
  </svg>
);

type GameFilter = "all" | "snake" | "tictactoe" | "snakeladders" | "uno";

const games = [
  {
    type: "snake" as const,
    title: "SNAKE",
    description: "Classic Nokia vibes. Eat, grow, don't crash!",
    icon: <SnakeIcon />,
    players: "1 Player",
    color: "green" as const,
    onlineCount: 142,
  },
  {
    type: "tictactoe" as const,
    title: "TIC-TAC-TOE",
    description: "X vs O. Simple but deadly competitive.",
    icon: <TicTacToeIcon />,
    players: "1-2 Players",
    color: "cyan" as const,
    onlineCount: 89,
  },
  {
    type: "snakeladders" as const,
    title: "SNAKE & LADDERS",
    description: "Roll dice, climb ladders, avoid snakes!",
    icon: <DiceIcon />,
    players: "2-4 Players",
    color: "purple" as const,
    onlineCount: 67,
  },
  {
    type: "uno" as const,
    title: "UNO",
    description: "Draw 4 your friends into oblivion.",
    icon: <UnoIcon />,
    players: "2-4 Players",
    color: "pink" as const,
    onlineCount: 124,
  },
];

const mockRooms = [
  { id: "SNK-4821", game: "snake", players: 1, maxPlayers: 1, fee: 0, host: "CryptoNinja", status: "waiting" },
  { id: "TTT-7293", game: "tictactoe", players: 1, maxPlayers: 2, fee: 10, host: "BlockMaster", status: "waiting" },
  { id: "TTT-1842", game: "tictactoe", players: 2, maxPlayers: 2, fee: 50, host: "Web3Gamer", status: "playing" },
  { id: "SNK-9921", game: "snake", players: 1, maxPlayers: 1, fee: 0, host: "PixelKing", status: "playing" },
];

export default function LobbyPage() {
  const [filter, setFilter] = useState<GameFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = mockRooms.filter(room => {
    if (filter !== "all" && room.game !== filter) return false;
    if (searchQuery && !room.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !room.host.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-pixel text-xl md:text-2xl text-foreground mb-2">
              GAME <span className="text-neon-cyan">LOBBY</span>
            </h1>
            <p className="text-muted-foreground">
              Join a room or create your own
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="relative">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-neon-green opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
              </div>
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">231</span> players online
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Play Section */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  QUICK PLAY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {games.map((game) => (
                    <Link 
                      key={game.type} 
                      to={`/games/${game.type}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all text-center"
                      >
                        <div className={`mx-auto mb-2 text-neon-${game.color}`}>
                          {game.icon}
                        </div>
                        <p className="font-display text-[10px] text-foreground">{game.title}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Rooms */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    ACTIVE ROOMS
                  </CardTitle>
                  <Button variant="neon" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" /> Create Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/30"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <Button
                      variant={filter === "all" ? "neon" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "snake" ? "neon-green" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("snake")}
                    >
                      Snake
                    </Button>
                    <Button
                      variant={filter === "tictactoe" ? "neon" : "ghost"}
                      size="sm"
                      onClick={() => setFilter("tictactoe")}
                    >
                      Tic-Tac-Toe
                    </Button>
                  </div>
                </div>

                {/* Room List */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredRooms.map((room) => (
                      <motion.div
                        key={room.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            room.game === "snake" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                          }`}>
                            {room.game === "snake" ? <SnakeIcon /> : <TicTacToeIcon />}
                          </div>
                          <div>
                            <p className="font-mono text-sm text-foreground">{room.id}</p>
                            <p className="text-xs text-muted-foreground">
                              Host: <span className="text-primary">{room.host}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-foreground">
                              {room.players}/{room.maxPlayers} <Users className="inline w-3 h-3" />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {room.fee > 0 ? (
                                <span className="text-neon-yellow">{room.fee} tokens</span>
                              ) : (
                                <span className="text-neon-green">FREE</span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant={room.status === "waiting" ? "neon" : "outline"}
                            size="sm"
                            disabled={room.status === "playing" || room.players >= room.maxPlayers}
                          >
                            {room.status === "playing" ? "In Progress" : "Join"}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredRooms.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No rooms found</p>
                      <p className="text-sm">Create one or adjust your filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Stats Card */}
            <Card variant="neon">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-neon-yellow" />
                  YOUR STATS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    ?
                  </div>
                  <p className="font-pixel text-xs text-muted-foreground">CONNECT WALLET</p>
                </div>
                <Button variant="arcade" className="w-full">
                  Connect & Play
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-neon-yellow" />
                    TOP PLAYERS
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
                  { rank: 1, name: "CryptoKing", score: 12847, trend: "+2" },
                  { rank: 2, name: "Web3Pro", score: 11293, trend: "-1" },
                  { rank: 3, name: "BlockMaster", score: 10892, trend: "+1" },
                  { rank: 4, name: "ChainGamer", score: 9847, trend: "0" },
                  { rank: 5, name: "PixelNinja", score: 8921, trend: "+3" },
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
                    <span className="font-mono text-xs text-primary">{player.score.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  RECENT GAMES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { game: "Snake", result: "Win", score: 247, time: "2m ago" },
                  { game: "Tic-Tac-Toe", result: "Win", score: 100, time: "5m ago" },
                  { game: "Snake", result: "Loss", score: 89, time: "12m ago" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                    <div>
                      <p className="text-sm font-medium">{activity.game}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-pixel ${
                        activity.result === "Win" ? "text-neon-green" : "text-neon-pink"
                      }`}>
                        {activity.result}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.score} pts</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
