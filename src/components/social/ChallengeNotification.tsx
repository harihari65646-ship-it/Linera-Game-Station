/**
 * Challenge Notification Component
 *
 * Displays incoming game challenges with accept/decline actions.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, X, Check, Clock, Gamepad2 } from "lucide-react";

type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface Challenge {
  id: string;
  from: string;
  fromUsername: string;
  gameType: GameType;
  stake?: number;
  expiresAt: number;
}

interface ChallengeNotificationProps {
  challenge: Challenge;
  onAccept?: () => void;
  onDecline?: () => void;
  onExpired?: () => void;
}

const GAME_NAMES: Record<GameType, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  snakeladders: "Snake & Ladders",
  uno: "UNO",
};

const GAME_COLORS: Record<GameType, string> = {
  snake: "from-neon-green to-neon-cyan",
  tictactoe: "from-neon-cyan to-neon-purple",
  snakeladders: "from-neon-yellow to-neon-pink",
  uno: "from-neon-pink to-neon-purple",
};

export function ChallengeNotification({
  challenge,
  onAccept,
  onDecline,
  onExpired,
}: ChallengeNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((challenge.expiresAt - Date.now()) / 1000))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((challenge.expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining === 0) {
        onExpired?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge.expiresAt, onExpired]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 w-80"
    >
      <div className="bg-card border border-neon-pink/50 rounded-xl overflow-hidden shadow-2xl shadow-neon-pink/20">
        {/* Header */}
        <div className={`bg-gradient-to-r ${GAME_COLORS[challenge.gameType]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div className="text-white">
              <p className="font-pixel text-lg">CHALLENGE!</p>
              <p className="text-sm opacity-80">
                {challenge.fromUsername} wants to play
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Game Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gamepad2 className="w-4 h-4" />
              <span>{GAME_NAMES[challenge.gameType]}</span>
            </div>
            {challenge.stake && challenge.stake > 0 && (
              <span className="text-neon-yellow font-pixel">
                {challenge.stake} tokens
              </span>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">
              Expires in {timeLeft}s
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{
                duration: (challenge.expiresAt - Date.now()) / 1000,
                ease: "linear",
              }}
              className="h-full bg-gradient-to-r from-neon-pink to-neon-purple"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" /> Decline
            </Button>
            <Button
              variant="neon-green"
              onClick={onAccept}
              className="flex-1 gap-2"
            >
              <Check className="w-4 h-4" /> Accept
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Challenge Manager - Handles multiple challenges
interface ChallengeManagerProps {
  challenges?: Challenge[];
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
}

// Demo challenges
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    from: "0x1234...5678",
    fromUsername: "CryptoGamer",
    gameType: "tictactoe",
    expiresAt: Date.now() + 30000,
  },
];

export function ChallengeManager({
  challenges = DEMO_CHALLENGES,
  onAccept,
  onDecline,
}: ChallengeManagerProps) {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(
    challenges[0] || null
  );

  useEffect(() => {
    if (challenges.length > 0 && !activeChallenge) {
      setActiveChallenge(challenges[0]);
    }
  }, [challenges, activeChallenge]);

  const handleNext = () => {
    const currentIndex = challenges.findIndex((c) => c.id === activeChallenge?.id);
    if (currentIndex < challenges.length - 1) {
      setActiveChallenge(challenges[currentIndex + 1]);
    } else {
      setActiveChallenge(null);
    }
  };

  const handleAccept = () => {
    if (activeChallenge) {
      onAccept?.(activeChallenge.id);
      handleNext();
    }
  };

  const handleDecline = () => {
    if (activeChallenge) {
      onDecline?.(activeChallenge.id);
      handleNext();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {activeChallenge && (
        <ChallengeNotification
          key={activeChallenge.id}
          challenge={activeChallenge}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onExpired={handleNext}
        />
      )}
    </AnimatePresence>
  );
}

// Outgoing Challenge Component
interface OutgoingChallengeProps {
  to: string;
  toUsername: string;
  gameType: GameType;
  status: "pending" | "accepted" | "declined" | "expired";
  onCancel?: () => void;
  onGameStart?: () => void;
}

export function OutgoingChallenge({
  to,
  toUsername,
  gameType,
  status,
  onCancel,
  onGameStart,
}: OutgoingChallengeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 z-50 w-80"
    >
      <div className="bg-card border border-border rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <p className="font-medium text-foreground">Challenge Sent</p>
            <p className="text-sm text-muted-foreground">
              Waiting for {toUsername}...
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-muted-foreground">
            {GAME_NAMES[gameType]}
          </span>
          <span
            className={`font-pixel ${
              status === "pending"
                ? "text-neon-yellow animate-pulse"
                : status === "accepted"
                ? "text-neon-green"
                : status === "declined"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>

        {status === "pending" && (
          <div className="flex gap-3">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-full w-1/3 bg-neon-cyan rounded-full"
              />
            </div>
          </div>
        )}

        {status === "accepted" && (
          <Button
            variant="neon-green"
            onClick={onGameStart}
            className="w-full gap-2"
          >
            <Gamepad2 className="w-4 h-4" /> Start Game
          </Button>
        )}

        {(status === "pending" || status === "declined" || status === "expired") && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-muted-foreground"
          >
            {status === "pending" ? "Cancel" : "Close"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
