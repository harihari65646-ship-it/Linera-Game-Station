import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/games/GameCard";
import { useGlobalStats } from "@/hooks/useGlobalStats";
import {
  Gamepad2,
  Zap,
  Shield,
  Trophy,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  Activity
} from "lucide-react";

// Game icons as SVG components for better styling
const SnakeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M21 6c-1.1 0-2 .9-2 2 0 .4.1.7.3 1L17 12H9c-1.1 0-2 .9-2 2v2H3c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2h4.6l2.8 3.2c-.3.3-.4.7-.4 1.1 0 1.1.9 2 2 2s2-.9 2-2c0-1.1-.9-2-2-2-.4 0-.7.1-1 .3l-3-3.4 3-3.4c.3.2.6.3 1 .3 1.1 0 2-.9 2-2s-.9-2-2-2z" />
  </svg>
);

const TicTacToeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M4 4h4v4H4V4m6 0h4v4h-4V4m6 0h4v4h-4V4M4 10h4v4H4v-4m6 0h4v4h-4v-4m6 0h4v4h-4v-4M4 16h4v4H4v-4m6 0h4v4h-4v-4m6 0h4v4h-4v-4z" />
  </svg>
);

const DiceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2 4a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 10a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 7 7m10 0a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 17 10a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 17 7m-5 5a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 12 15a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 12 12m-5 5a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 7 20a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 7 17m10 0a1.5 1.5 0 0 0-1.5 1.5A1.5 1.5 0 0 0 17 20a1.5 1.5 0 0 0 1.5-1.5A1.5 1.5 0 0 0 17 17z" />
  </svg>
);

const UnoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4m8 3.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5m0 2c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
  </svg>
);

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

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Sub-0.5s Finality",
    description: "Lightning-fast moves with Linera's microchain technology",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Provably Fair",
    description: "Every move verified on-chain. Zero cheating possible.",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Earn Rewards",
    description: "Win games, climb leaderboards, earn tokens.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Real-Time PvP",
    description: "Challenge anyone, anywhere, instantly.",
  },
];

export default function LandingPage() {
  const { stats, activities, isLoading, isDemoMode } = useGlobalStats();

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Powered by Linera Blockchain</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-pixel text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 leading-relaxed"
            >
              <span className="text-neon-cyan">THE FASTEST</span>
              <br />
              <span className="text-foreground">GAME STATION</span>
              <br />
              <span className="text-neon-purple">IN WEB3</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Classic arcade games on blockchain. Zero lag. Provably fair.
              Real-time multiplayer with sub-second finality.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/lobby">
                <Button variant="arcade" size="xl" className="gap-2 min-w-[200px]">
                  <Gamepad2 className="w-5 h-5" />
                  START PLAYING
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="gap-2 min-w-[200px]">
                Learn More <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-8 mt-12 flex-wrap"
            >
              <motion.div
                className="text-center"
                key={stats.playersOnline}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-pixel text-2xl text-neon-cyan">
                  {formatNumber(stats.playersOnline)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                  </span>
                  Players Online
                </p>
              </motion.div>
              <div className="h-8 w-px bg-border" />
              <motion.div
                className="text-center"
                key={stats.gamesPlayed}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-pixel text-2xl text-neon-green">
                  {formatNumber(stats.gamesPlayed)}
                </p>
                <p className="text-xs text-muted-foreground">Games Played</p>
              </motion.div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="font-pixel text-2xl text-neon-purple">&lt;0.5s</p>
                <p className="text-xs text-muted-foreground">Move Finality</p>
              </div>
              {isDemoMode && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="font-pixel text-xs text-neon-pink/70 px-2 py-1 rounded bg-neon-pink/10 border border-neon-pink/20">
                      DEMO MODE
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-pixel text-xl md:text-2xl text-foreground mb-4">
              CHOOSE YOUR <span className="text-neon-cyan">GAME</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Classic games reimagined for Web3. Every move matters.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <motion.div
                key={game.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GameCard {...game} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-neon-green opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-neon-green" />
              </div>
              <h3 className="font-pixel text-sm text-foreground">LIVE ACTIVITY</h3>
            </div>
            <Link to="/lobby">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {activities.slice(0, 4).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.05
                  }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground group-hover:scale-110 transition-transform">
                    {activity.player[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium text-foreground">{activity.player}</span>
                      {" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                      {" "}
                      {activity.target && (
                        <span className="text-primary">{activity.target}</span>
                      )}
                      {activity.score && (
                        <span className="text-neon-green"> {activity.score}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-pixel text-xl md:text-2xl text-foreground mb-4">
              WHY <span className="text-neon-purple">LINERA</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The only blockchain fast enough for real-time gaming.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-pixel text-xs text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-destructive/20" />
            <div className="absolute inset-0 grid-bg opacity-20" />

            <div className="relative z-10 p-8 md:p-16 text-center">
              <h2 className="font-pixel text-2xl md:text-3xl text-foreground mb-4">
                READY TO <span className="text-neon-pink">PLAY</span>?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Connect your wallet and start your journey.
                100 free tokens waiting for new players.
              </p>
              <Link to="/lobby">
                <Button variant="arcade" size="xl" className="gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  ENTER THE ARCADE
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="font-pixel text-xs text-muted-foreground">
                LINERA GAME STATION
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built on Linera • Powered by Web3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
