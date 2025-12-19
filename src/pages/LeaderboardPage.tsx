import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Medal, 
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from "lucide-react";
import { useLineraClient } from "@/hooks/useLineraClient";

type TimeFilter = "daily" | "weekly" | "alltime";
type GameFilter = "all" | "snake" | "tictactoe" | "snakeladders" | "uno";

interface LeaderboardPlayer {
  rank: number;
  playerName: string;
  playerAddress: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  avatar: string;
}

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getLeaderboard } = useLineraClient();

  useEffect(() => {
    loadLeaderboard();
  }, [gameFilter, timeFilter]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(gameFilter, 10);
      setLeaderboard(data);
    } catch (err) {
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (winRate: number) => {
    if (winRate >= 60) return <TrendingUp className="w-4 h-4 text-neon-green" />;
    if (winRate <= 40) return <TrendingDown className="w-4 h-4 text-neon-pink" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50";
      default:
        return "bg-muted/20 border-border";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="font-display text-xl md:text-2xl text-foreground mb-2">
            LEADER<span className="text-neon-yellow">BOARD</span>
          </h1>
          <p className="text-muted-foreground">
            Top players of Linera Game Station
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/30 border border-border">
            <Button
              variant={timeFilter === "daily" ? "neon" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("daily")}
            >
              Daily
            </Button>
            <Button
              variant={timeFilter === "weekly" ? "neon" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={timeFilter === "alltime" ? "neon" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("alltime")}
            >
              All Time
            </Button>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/30 border border-border flex-wrap justify-center">
            <Button
              variant={gameFilter === "all" ? "neon-purple" : "ghost"}
              size="sm"
              onClick={() => setGameFilter("all")}
            >
              All
            </Button>
            <Button
              variant={gameFilter === "snake" ? "neon-green" : "ghost"}
              size="sm"
              onClick={() => setGameFilter("snake")}
            >
              Snake
            </Button>
            <Button
              variant={gameFilter === "tictactoe" ? "neon" : "ghost"}
              size="sm"
              onClick={() => setGameFilter("tictactoe")}
            >
              Tic-Tac-Toe
            </Button>
            <Button
              variant={gameFilter === "snakeladders" ? "neon-purple" : "ghost"}
              size="sm"
              onClick={() => setGameFilter("snakeladders")}
            >
              S&L
            </Button>
            <Button
              variant={gameFilter === "uno" ? "neon-pink" : "ghost"}
              size="sm"
              onClick={() => setGameFilter("uno")}
            >
              UNO
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={loadLeaderboard}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </motion.div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {/* Second Place */}
            <div className="mt-8">
              <Card variant="arcade" className="text-center p-4 border-gray-400/30">
                <div className="text-4xl mb-2">{leaderboard[1]?.avatar}</div>
                <Medal className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="font-display text-xs text-gray-400">#2</p>
                <p className="font-medium text-sm truncate">{leaderboard[1]?.playerName}</p>
                <p className="font-mono text-lg text-gray-400">{leaderboard[1]?.score.toLocaleString()}</p>
              </Card>
            </div>

            {/* First Place */}
            <div>
              <Card variant="arcade" className="text-center p-4 border-yellow-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent" />
                <div className="relative z-10">
                  <div className="text-5xl mb-2">{leaderboard[0]?.avatar}</div>
                  <Crown className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
                  <p className="font-display text-sm text-yellow-500">#1</p>
                  <p className="font-medium truncate">{leaderboard[0]?.playerName}</p>
                  <p className="font-mono text-xl text-yellow-500">{leaderboard[0]?.score.toLocaleString()}</p>
                </div>
              </Card>
            </div>

            {/* Third Place */}
            <div className="mt-12">
              <Card variant="arcade" className="text-center p-4 border-orange-600/30">
                <div className="text-3xl mb-2">{leaderboard[2]?.avatar}</div>
                <Medal className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                <p className="font-display text-xs text-orange-600">#3</p>
                <p className="font-medium text-sm truncate">{leaderboard[2]?.playerName}</p>
                <p className="font-mono text-lg text-orange-600">{leaderboard[2]?.score.toLocaleString()}</p>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="arcade">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                RANKINGS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border mb-2">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right hidden sm:block">Games</div>
                <div className="col-span-2 text-right hidden sm:block">Win Rate</div>
                <div className="col-span-1 text-right">Trend</div>
              </div>

              {/* Leaderboard Rows */}
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <motion.div
                      key={player.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg border transition-colors hover:border-primary/30 ${getRankStyle(player.rank)}`}
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        {getRankIcon(player.rank) || (
                          <span className="font-display text-sm text-muted-foreground">
                            #{player.rank}
                          </span>
                        )}
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <span className="font-medium truncate">{player.playerName}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-primary">{player.score.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 text-right hidden sm:block">
                        <span className="text-muted-foreground">{player.gamesPlayed}</span>
                      </div>
                      <div className="col-span-2 text-right hidden sm:block">
                        <span className={player.winRate >= 60 ? "text-neon-green" : "text-muted-foreground"}>
                          {player.winRate}%
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {getTrendIcon(player.winRate)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && leaderboard.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No players yet</p>
                  <p className="text-sm">Be the first to claim the top spot!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}