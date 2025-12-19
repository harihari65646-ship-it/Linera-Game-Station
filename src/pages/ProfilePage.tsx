import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Trophy, 
  Gamepad2, 
  Clock,
  Medal,
  Target,
  Zap,
  Wallet,
  Settings,
  LogOut
} from "lucide-react";

const mockProfile = {
  username: "Guest Player",
  level: 1,
  xp: 0,
  xpToNext: 100,
  tokens: 100,
  rank: "Bronze",
  totalGames: 0,
  totalWins: 0,
  winRate: 0,
  achievements: [
    { id: 1, name: "First Steps", description: "Play your first game", unlocked: false },
    { id: 2, name: "Winner", description: "Win your first game", unlocked: false },
    { id: 3, name: "Snake Charmer", description: "Score 100 in Snake", unlocked: false },
    { id: 4, name: "Strategist", description: "Win 10 Tic-Tac-Toe games", unlocked: false },
  ],
  recentGames: [],
};

const statCards = [
  { label: "Games Played", value: mockProfile.totalGames, icon: Gamepad2, color: "primary" },
  { label: "Total Wins", value: mockProfile.totalWins, icon: Trophy, color: "neon-yellow" },
  { label: "Win Rate", value: `${mockProfile.winRate}%`, icon: Target, color: "neon-green" },
  { label: "Tokens", value: mockProfile.tokens, icon: Zap, color: "neon-purple" },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="arcade" className="mb-8 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-destructive/20 relative">
              <div className="absolute inset-0 grid-bg opacity-20" />
            </div>
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
                {/* Avatar */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl sm:text-5xl border-4 border-background shadow-xl">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="font-pixel text-lg text-foreground mb-1">
                    {mockProfile.username}
                  </h1>
                  <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Medal className="w-4 h-4 text-neon-yellow" />
                      Level {mockProfile.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-neon-orange" />
                      {mockProfile.rank}
                    </span>
                  </div>
                  
                  {/* XP Bar */}
                  <div className="mt-3 max-w-xs mx-auto sm:mx-0">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>XP</span>
                      <span>{mockProfile.xp} / {mockProfile.xpToNext}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                        style={{ width: `${(mockProfile.xp / mockProfile.xpToNext) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="neon" className="gap-2">
                    <Wallet className="w-4 h-4" /> Connect Wallet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="arcade" className="text-center">
                <CardContent className="p-4">
                  <Icon className={`w-6 h-6 mx-auto mb-2 text-${stat.color}`} />
                  <p className="font-pixel text-xl text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Medal className="w-4 h-4 text-neon-yellow" />
                  ACHIEVEMENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockProfile.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      achievement.unlocked 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-muted/20 border-border opacity-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      achievement.unlocked ? "bg-primary/20" : "bg-muted"
                    }`}>
                      {achievement.unlocked ? (
                        <Trophy className="w-5 h-5 text-neon-yellow" />
                      ) : (
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                    {achievement.unlocked && (
                      <span className="text-xs text-primary font-pixel">UNLOCKED</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Games */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  RECENT GAMES
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockProfile.recentGames.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No games played yet</p>
                    <p className="text-sm">Start playing to see your history!</p>
                    <Button variant="neon" className="mt-4">
                      Play Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockProfile.recentGames.map((game: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Gamepad2 className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{game.name}</p>
                            <p className="text-xs text-muted-foreground">{game.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-pixel text-xs ${
                            game.result === "Win" ? "text-neon-green" : "text-neon-pink"
                          }`}>
                            {game.result}
                          </p>
                          <p className="text-xs text-muted-foreground">{game.score} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Connect Wallet CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card variant="neon" className="text-center">
            <CardContent className="p-8">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="font-pixel text-sm text-foreground mb-2">
                CONNECT YOUR WALLET
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Link your Linera wallet to save your progress, earn tokens, 
                and compete on the global leaderboard.
              </p>
              <Button variant="arcade" size="lg" className="gap-2">
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
