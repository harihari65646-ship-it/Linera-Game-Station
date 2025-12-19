import { motion } from "framer-motion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Play, Trophy, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface GameCardProps {
  type: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  players: string;
  color: "cyan" | "purple" | "pink" | "green";
  onlineCount?: number;
  isComingSoon?: boolean;
}

const colorClasses = {
  cyan: {
    border: "hover:border-primary/60",
    shadow: "hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
    icon: "text-neon-cyan",
    iconGlow: "shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5)]",
    badge: "bg-primary/20 text-primary border-primary/30",
  },
  purple: {
    border: "hover:border-secondary/60",
    shadow: "hover:shadow-[0_0_40px_hsl(var(--secondary)/0.3)]",
    icon: "text-neon-purple",
    iconGlow: "shadow-[0_0_20px_hsl(var(--neon-purple)/0.5)]",
    badge: "bg-secondary/20 text-secondary border-secondary/30",
  },
  pink: {
    border: "hover:border-destructive/60",
    shadow: "hover:shadow-[0_0_40px_hsl(var(--destructive)/0.3)]",
    icon: "text-neon-pink",
    iconGlow: "shadow-[0_0_20px_hsl(var(--neon-pink)/0.5)]",
    badge: "bg-destructive/20 text-destructive border-destructive/30",
  },
  green: {
    border: "hover:border-accent/60",
    shadow: "hover:shadow-[0_0_40px_hsl(var(--accent)/0.3)]",
    icon: "text-neon-green",
    iconGlow: "shadow-[0_0_20px_hsl(var(--neon-green)/0.5)]",
    badge: "bg-accent/20 text-accent border-accent/30",
  },
};

export function GameCard({
  type,
  title,
  description,
  icon,
  players,
  color,
  onlineCount = 0,
  isComingSoon = false,
}: GameCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        variant="game"
        className={`relative overflow-hidden group ${colors.border} ${colors.shadow}`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 0%, hsl(var(--neon-${color}) / 0.1) 0%, transparent 50%)`
            }}
          />
        </div>

        <CardContent className="p-6 relative z-10">
          {/* Icon */}
          <div 
            className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-muted/50 ${colors.icon} ${colors.iconGlow}`}
          >
            {icon}
          </div>

          {/* Title */}
          <CardTitle className="text-sm mb-2 text-foreground">{title}</CardTitle>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{players}</span>
            </div>
            {onlineCount > 0 && (
              <div className={`flex items-center gap-1 ${colors.badge} px-2 py-0.5 rounded-full border`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.icon}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.icon} bg-current`}></span>
                </span>
                <span>{onlineCount} online</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {isComingSoon ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-pixel text-xs">COMING SOON</span>
            </div>
          ) : (
            <Link to={`/games/${type}`}>
              <Button 
                variant={color === "cyan" ? "neon" : color === "purple" ? "neon-purple" : color === "green" ? "neon-green" : "neon-pink"} 
                size="sm" 
                className="w-full gap-2"
              >
                <Play className="w-4 h-4" /> PLAY NOW
              </Button>
            </Link>
          )}
        </CardContent>

        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 text-[10px] font-pixel bg-muted text-muted-foreground rounded-full border border-border">
              SOON
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
