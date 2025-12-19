import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices, RotateCcw, Users, Trophy, Zap } from "lucide-react";

type Player = {
  id: number;
  name: string;
  position: number;
  color: string;
};

// Snakes: head -> tail (go down)
const SNAKES: Record<number, number> = {
  99: 54,
  70: 55,
  52: 42,
  25: 2,
  95: 72,
};

// Ladders: bottom -> top (go up)
const LADDERS: Record<number, number> = {
  6: 25,
  11: 40,
  60: 85,
  46: 90,
  17: 69,
};

const PLAYER_COLORS = [
  { bg: "bg-neon-cyan", border: "border-neon-cyan", text: "text-neon-cyan" },
  { bg: "bg-neon-pink", border: "border-neon-pink", text: "text-neon-pink" },
  { bg: "bg-neon-green", border: "border-neon-green", text: "text-neon-green" },
  { bg: "bg-neon-purple", border: "border-neon-purple", text: "text-neon-purple" },
];

export function SnakeLaddersGame() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Player 1", position: 0, color: "cyan" },
    { id: 2, name: "Player 2", position: 0, color: "pink" },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [message, setMessage] = useState("");

  const rollDice = useCallback(() => {
    if (isRolling || winner) return;

    setIsRolling(true);
    setMessage("");

    // Animate dice roll
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        movePlayer(finalValue);
        setIsRolling(false);
      }
    }, 100);
  }, [isRolling, winner, currentPlayer, players]);

  const movePlayer = (steps: number) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      const player = { ...newPlayers[currentPlayer] };
      let newPosition = player.position + steps;

      // Check if exceeds 100
      if (newPosition > 100) {
        setMessage("Need exact roll to win!");
        return prev;
      }

      // Check for snakes
      if (SNAKES[newPosition]) {
        setTimeout(() => {
          setMessage(`🐍 Oops! Slid down from ${newPosition} to ${SNAKES[newPosition]}!`);
        }, 500);
        newPosition = SNAKES[newPosition];
      }

      // Check for ladders
      if (LADDERS[newPosition]) {
        setTimeout(() => {
          setMessage(`🪜 Climbed up from ${newPosition} to ${LADDERS[newPosition]}!`);
        }, 500);
        newPosition = LADDERS[newPosition];
      }

      player.position = newPosition;
      newPlayers[currentPlayer] = player;

      // Check for winner
      if (newPosition === 100) {
        setWinner(player);
      }

      return newPlayers;
    });

    // Next player's turn
    if (!winner) {
      setTimeout(() => {
        setCurrentPlayer((prev) => (prev + 1) % players.length);
      }, 1500);
    }
  };

  const resetGame = () => {
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, position: 0 }))
    );
    setCurrentPlayer(0);
    setDiceValue(null);
    setWinner(null);
    setMessage("");
  };

  const getSquarePosition = (square: number) => {
    const row = Math.floor((square - 1) / 10);
    const col = row % 2 === 0 ? (square - 1) % 10 : 9 - ((square - 1) % 10);
    return { row: 9 - row, col };
  };

  const DiceFace = ({ value }: { value: number }) => {
    const dotPositions: Record<number, string[]> = {
      1: ["center"],
      2: ["top-right", "bottom-left"],
      3: ["top-right", "center", "bottom-left"],
      4: ["top-left", "top-right", "bottom-left", "bottom-right"],
      5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
      6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
    };

    const positionClasses: Record<string, string> = {
      "top-left": "top-2 left-2",
      "top-right": "top-2 right-2",
      "middle-left": "top-1/2 left-2 -translate-y-1/2",
      "middle-right": "top-1/2 right-2 -translate-y-1/2",
      "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "bottom-left": "bottom-2 left-2",
      "bottom-right": "bottom-2 right-2",
    };

    return (
      <div className="relative w-20 h-20 bg-card border-2 border-primary rounded-xl">
        {dotPositions[value].map((pos, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full bg-primary ${positionClasses[pos]}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-8 rounded-2xl glass-card"
            >
              <Trophy className="w-20 h-20 mx-auto mb-4 text-neon-yellow" />
              <h2 className="font-display text-3xl text-glow-cyan mb-2">
                {winner.name} Wins!
              </h2>
              <p className="text-muted-foreground mb-6">
                Congratulations on reaching 100!
              </p>
              <Button onClick={resetGame} variant="arcade" size="lg">
                Play Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <Card variant="arcade" className="p-4">
            <div className="aspect-square max-w-[600px] mx-auto">
              <div className="grid grid-cols-10 gap-1 h-full">
                {Array.from({ length: 100 }, (_, i) => {
                  const squareNum = 100 - i;
                  const row = Math.floor((squareNum - 1) / 10);
                  const displayNum = row % 2 === 0
                    ? squareNum
                    : Math.floor((squareNum - 1) / 10) * 10 + (10 - ((squareNum - 1) % 10));

                  const isSnakeHead = SNAKES[displayNum];
                  const isLadderBottom = LADDERS[displayNum];
                  const playersHere = players.filter((p) => p.position === displayNum);

                  return (
                    <motion.div
                      key={displayNum}
                      className={`
                        relative flex items-center justify-center rounded-md text-xs font-mono
                        ${displayNum === 100 ? "bg-neon-yellow/20 border-neon-yellow" : ""}
                        ${isSnakeHead ? "bg-neon-pink/20 border-neon-pink/50" : ""}
                        ${isLadderBottom ? "bg-neon-green/20 border-neon-green/50" : ""}
                        ${!isSnakeHead && !isLadderBottom && displayNum !== 100 ? "bg-muted/30" : ""}
                        border border-border/50
                      `}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-muted-foreground/70">{displayNum}</span>
                      
                      {/* Snake indicator */}
                      {isSnakeHead && (
                        <span className="absolute -top-1 -right-1 text-sm">🐍</span>
                      )}
                      
                      {/* Ladder indicator */}
                      {isLadderBottom && (
                        <span className="absolute -top-1 -right-1 text-sm">🪜</span>
                      )}

                      {/* Players on this square */}
                      <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                        {playersHere.map((p) => (
                          <motion.div
                            key={p.id}
                            layoutId={`player-${p.id}`}
                            className={`w-4 h-4 rounded-full ${
                              p.color === "cyan" ? "bg-neon-cyan shadow-glow-cyan" :
                              p.color === "pink" ? "bg-neon-pink shadow-glow-pink" :
                              p.color === "green" ? "bg-neon-green shadow-glow-green" :
                              "bg-neon-purple shadow-glow-purple"
                            }`}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          {/* Dice & Roll */}
          <Card variant="neon" className="p-6">
            <h3 className="font-display text-sm text-primary mb-4 flex items-center gap-2">
              <Dices className="w-4 h-4" />
              DICE
            </h3>
            
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={isRolling ? { rotate: 360 } : {}}
                transition={{ duration: 0.1, repeat: isRolling ? Infinity : 0 }}
              >
                {diceValue ? (
                  <DiceFace value={diceValue} />
                ) : (
                  <div className="w-20 h-20 bg-muted/50 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                    <Dices className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </motion.div>

              <Button
                onClick={rollDice}
                disabled={isRolling || !!winner}
                variant="arcade"
                size="lg"
                className="w-full"
              >
                {isRolling ? "Rolling..." : "Roll Dice"}
              </Button>
            </div>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center text-sm text-primary"
              >
                {message}
              </motion.p>
            )}
          </Card>

          {/* Players */}
          <Card variant="arcade" className="p-6">
            <h3 className="font-display text-sm text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              PLAYERS
            </h3>
            
            <div className="space-y-3">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentPlayer === index
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20"
                  }`}
                  animate={currentPlayer === index ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.5, repeat: currentPlayer === index ? Infinity : 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        player.color === "cyan" ? "bg-neon-cyan" :
                        player.color === "pink" ? "bg-neon-pink" :
                        player.color === "green" ? "bg-neon-green" :
                        "bg-neon-purple"
                      }`}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span className="font-mono text-primary">{player.position}</span>
                </motion.div>
              ))}
            </div>

            {currentPlayer !== null && !winner && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Zap className="inline w-4 h-4 text-primary mr-1" />
                {players[currentPlayer].name}'s turn
              </p>
            )}
          </Card>

          {/* Reset */}
          <Button
            onClick={resetGame}
            variant="outline"
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Game
          </Button>
        </div>
      </div>
    </div>
  );
}