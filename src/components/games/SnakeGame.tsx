import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw, Trophy, Pause } from "lucide-react";

const GRID_SIZE = 20;
const CELL_SIZE = 16;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface SnakeGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameEnd?: (score: number) => void;
}

export function SnakeGame({ onScoreUpdate, onGameEnd }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snake-highscore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef(direction);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState("idle");
  }, [generateFood]);

  const startGame = () => {
    if (gameState === "idle" || gameState === "gameover") {
      resetGame();
      setGameState("playing");
    } else if (gameState === "paused") {
      setGameState("playing");
    }
  };

  const pauseGame = () => {
    if (gameState === "playing") {
      setGameState("paused");
    }
  };

  const moveSnake = useCallback(() => {
    if (gameState !== "playing") return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const currentDirection = directionRef.current;
      
      let newHead: Position;
      switch (currentDirection) {
        case "UP":
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case "DOWN":
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case "LEFT":
          newHead = { x: head.x - 1, y: head.y };
          break;
        case "RIGHT":
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameState("gameover");
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snake-highscore", score.toString());
        }
        onGameEnd?.(score);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState("gameover");
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snake-highscore", score.toString());
        }
        onGameEnd?.(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          onScoreUpdate?.(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
        // Speed up slightly
        setSpeed(prev => Math.max(50, prev - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameState, food, score, highScore, generateFood, onScoreUpdate, onGameEnd]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing" && gameState !== "paused") {
        if (e.code === "Space" || e.code === "Enter") {
          startGame();
        }
        return;
      }

      if (e.code === "Space") {
        if (gameState === "playing") pauseGame();
        else if (gameState === "paused") startGame();
        return;
      }

      const currentDir = directionRef.current;
      let newDirection: Direction | null = null;

      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (currentDir !== "DOWN") newDirection = "UP";
          break;
        case "ArrowDown":
        case "KeyS":
          if (currentDir !== "UP") newDirection = "DOWN";
          break;
        case "ArrowLeft":
        case "KeyA":
          if (currentDir !== "RIGHT") newDirection = "LEFT";
          break;
        case "ArrowRight":
        case "KeyD":
          if (currentDir !== "LEFT") newDirection = "RIGHT";
          break;
      }

      if (newDirection) {
        directionRef.current = newDirection;
        setDirection(newDirection);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, speed, moveSnake]);

  const handleDirectionClick = (newDir: Direction) => {
    const currentDir = directionRef.current;
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT"
    };
    if (currentDir !== opposites[newDir]) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Score</p>
          <p className="font-pixel text-2xl text-neon-cyan">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> High Score
          </p>
          <p className="font-pixel text-2xl text-neon-yellow">{highScore}</p>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <div
          className="relative bg-background border-2 border-primary/30 rounded-lg overflow-hidden"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            boxShadow: "0 0 40px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--background) / 0.8)"
          }}
        >
          {/* Grid lines */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
            }}
          />

          {/* Snake */}
          {snake.map((segment, index) => (
            <motion.div
              key={`${segment.x}-${segment.y}-${index}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute rounded-sm ${
                index === 0 
                  ? "bg-neon-green shadow-[0_0_10px_hsl(var(--neon-green))]" 
                  : "bg-neon-green/70"
              }`}
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: segment.x * CELL_SIZE + 1,
                top: segment.y * CELL_SIZE + 1,
              }}
            />
          ))}

          {/* Food */}
          <motion.div
            key={`food-${food.x}-${food.y}`}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            transition={{ duration: 0.5, scale: { repeat: Infinity, duration: 1 } }}
            className="absolute bg-neon-pink rounded-full shadow-[0_0_15px_hsl(var(--neon-pink))]"
            style={{
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              left: food.x * CELL_SIZE + 2,
              top: food.y * CELL_SIZE + 2,
            }}
          />

          {/* Overlay States */}
          <AnimatePresence>
            {gameState === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <p className="font-pixel text-sm text-primary">Press SPACE or</p>
                <Button variant="neon" onClick={startGame} className="gap-2">
                  <Play className="w-4 h-4" /> Start Game
                </Button>
              </motion.div>
            )}

            {gameState === "paused" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <p className="font-pixel text-lg text-neon-yellow">PAUSED</p>
                <Button variant="neon" onClick={startGame} className="gap-2">
                  <Play className="w-4 h-4" /> Resume
                </Button>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <motion.p 
                  className="font-pixel text-lg text-neon-pink"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  GAME OVER
                </motion.p>
                <p className="font-pixel text-sm text-primary">Score: {score}</p>
                {score >= highScore && score > 0 && (
                  <motion.p 
                    className="font-pixel text-xs text-neon-yellow"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    NEW HIGH SCORE!
                  </motion.p>
                )}
                <Button variant="neon-green" onClick={resetGame} className="gap-2 mt-2">
                  <RotateCcw className="w-4 h-4" /> Play Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleDirectionClick("UP")}
          disabled={gameState !== "playing"}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
        <div />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleDirectionClick("LEFT")}
          disabled={gameState !== "playing"}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={gameState === "playing" ? pauseGame : startGame}
        >
          {gameState === "playing" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleDirectionClick("RIGHT")}
          disabled={gameState !== "playing"}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => handleDirectionClick("DOWN")}
          disabled={gameState !== "playing"}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
        <div />
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        <p className="hidden md:block">Use <span className="font-mono text-primary">WASD</span> or <span className="font-mono text-primary">Arrow Keys</span> to move</p>
        <p className="hidden md:block"><span className="font-mono text-primary">SPACE</span> to pause/resume</p>
      </div>
    </div>
  );
}
