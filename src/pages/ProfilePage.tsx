import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Edit2,
  Check,
  X
} from "lucide-react";
import { useLineraClient } from "@/hooks/useLineraClient";
import { Link } from "react-router-dom";

const AVATARS = ['👤', '👑', '🎮', '⚡', '🔥', '🥷', '🏆', '💎', '🎨', '🌐', '🚀', '🎯'];

export default function ProfilePage() {
  const { isConnected, wallet, connect, isConnecting, getUserProfile, updateProfile } = useLineraClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [wallet, isConnected]);

  const loadProfile = async () => {
    setIsLoading(true);
    if (isConnected && wallet) {
      const data = await getUserProfile();
      if (data) {
        setProfile(data);
        setEditUsername(data.username);
        setEditAvatar(data.avatarId);
      }
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) return;
    
    const success = await updateProfile(editUsername.trim(), editAvatar);
    if (success) {
      setProfile({ ...profile, username: editUsername.trim(), avatarId: editAvatar });
      setIsEditing(false);
    }
  };

  const totalGames = profile ? 
    profile.snakeGames + 
    profile.tictactoeWins + profile.tictactoeLosses +
    profile.snakeLaddersWins + profile.snakeLaddersLosses +
    profile.unoWins + profile.unoLosses : 0;

  const totalWins = profile ?
    profile.tictactoeWins + profile.snakeLaddersWins + profile.unoWins : 0;

  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const statCards = [
    { label: "Games Played", value: totalGames, icon: Gamepad2, color: "text-primary" },
    { label: "Total Wins", value: totalWins, icon: Trophy, color: "text-neon-yellow" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-neon-green" },
    { label: "Snake High", value: profile?.snakeHighScore || 0, icon: Zap, color: "text-neon-purple" },
  ];

  const achievements = [
    { id: 1, name: "First Steps", description: "Play your first game", unlocked: totalGames > 0 },
    { id: 2, name: "Winner", description: "Win your first game", unlocked: totalWins > 0 },
    { id: 3, name: "Snake Charmer", description: "Score 100+ in Snake", unlocked: (profile?.snakeHighScore || 0) >= 100 },
    { id: 4, name: "Strategist", description: "Win 10 Tic-Tac-Toe games", unlocked: (profile?.tictactoeWins || 0) >= 10 },
    { id: 5, name: "Dice Master", description: "Win 5 Snake & Ladders", unlocked: (profile?.snakeLaddersWins || 0) >= 5 },
    { id: 6, name: "UNO Champion", description: "Win 10 UNO games", unlocked: (profile?.unoWins || 0) >= 10 },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <Card variant="neon" className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="font-display text-xl text-foreground mb-4">
              CONNECT YOUR WALLET
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your Linera wallet to view your profile, track your stats, and compete on the leaderboard.
            </p>
            <Button 
              variant="arcade" 
              size="lg" 
              onClick={connect}
              disabled={isConnecting}
              className="gap-2"
            >
              <Wallet className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl sm:text-5xl border-4 border-background shadow-xl">
                    {isEditing ? (
                      <span>{AVATARS[editAvatar]}</span>
                    ) : (
                      profile ? AVATARS[profile.avatarId] || <User className="w-12 h-12 text-primary-foreground" /> : <User className="w-12 h-12 text-primary-foreground" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => setEditAvatar((editAvatar - 1 + AVATARS.length) % AVATARS.length)}
                      >
                        ←
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => setEditAvatar((editAvatar + 1) % AVATARS.length)}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  {isEditing ? (
                    <Input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="font-display text-lg max-w-xs mb-2"
                      placeholder="Enter username"
                    />
                  ) : (
                    <h1 className="font-display text-lg text-foreground mb-1">
                      {profile?.username || 'Loading...'}
                    </h1>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Medal className="w-4 h-4 text-neon-yellow" />
                      Level {profile?.level || 1}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs">
                      {wallet?.address}
                    </span>
                  </div>
                  
                  {/* XP Bar */}
                  <div className="mt-3 max-w-xs mx-auto sm:mx-0">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>XP</span>
                      <span>{profile?.xp || 0} / 500</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                        style={{ width: `${((profile?.xp || 0) / 500) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="neon-green" size="icon" onClick={handleSaveProfile}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
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
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="arcade" className="text-center">
                <CardContent className="p-4">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="font-display text-xl text-foreground">{stat.value}</p>
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
                  ACHIEVEMENTS ({achievements.filter(a => a.unlocked).length}/{achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => (
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
                      <Trophy className={`w-5 h-5 ${achievement.unlocked ? "text-neon-yellow" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                    {achievement.unlocked && (
                      <span className="text-xs text-primary font-display">UNLOCKED</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="arcade">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  GAME STATS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Snake */}
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-neon-green">SNAKE</span>
                    <span className="text-xs text-muted-foreground">{profile?.snakeGames || 0} games</span>
                  </div>
                  <p className="text-2xl font-mono text-primary">{profile?.snakeHighScore || 0}</p>
                  <p className="text-xs text-muted-foreground">High Score</p>
                </div>

                {/* Tic-Tac-Toe */}
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-neon-cyan">TIC-TAC-TOE</span>
                    <span className="text-xs text-muted-foreground">
                      {(profile?.tictactoeWins || 0) + (profile?.tictactoeLosses || 0)} games
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-2xl font-mono text-neon-green">{profile?.tictactoeWins || 0}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-mono text-neon-pink">{profile?.tictactoeLosses || 0}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </div>

                {/* Snake & Ladders */}
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-neon-purple">SNAKE & LADDERS</span>
                    <span className="text-xs text-muted-foreground">
                      {(profile?.snakeLaddersWins || 0) + (profile?.snakeLaddersLosses || 0)} games
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-2xl font-mono text-neon-green">{profile?.snakeLaddersWins || 0}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-mono text-neon-pink">{profile?.snakeLaddersLosses || 0}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </div>

                {/* UNO */}
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm text-neon-pink">UNO</span>
                    <span className="text-xs text-muted-foreground">
                      {(profile?.unoWins || 0) + (profile?.unoLosses || 0)} games
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-2xl font-mono text-neon-green">{profile?.unoWins || 0}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-mono text-neon-pink">{profile?.unoLosses || 0}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                  </div>
                </div>

                <Link to="/lobby">
                  <Button variant="arcade" className="w-full mt-4">
                    <Gamepad2 className="w-4 h-4 mr-2" />
                    Play More Games
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}