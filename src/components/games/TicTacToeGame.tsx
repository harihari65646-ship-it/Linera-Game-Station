import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Users, Bot } from "lucide-react";

type Player = "X" | "O" | null;
type Board = Player[];
type GameMode = "pvp" | "ai";

interface TicTacToeGameProps {
  onGameEnd?: (winner: Player) => void;
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export function TicTacToeGame({ onGameEnd }: TicTacToeGameProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("pvp");
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);

  const checkWinner = useCallback((squares: Board): { winner: Player; line: number[] } | null => {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line };
      }
    }
    return null;
  }, []);

  const minimax = useCallback((squares: Board, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(squares);
    if (result?.winner === "O") return 10 - depth;
    if (result?.winner === "X") return depth - 10;
    if (squares.every(s => s !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "O";
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "X";
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const getBestMove = useCallback((squares: Board): number => {
    let bestScore = -Infinity;
    let bestMove = 0;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = "O";
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }, [minimax]);

  const makeMove = useCallback((index: number, player: "X" | "O") => {
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setScores(prev => ({
        ...prev,
        [result.winner!]: prev[result.winner!] + 1
      }));
      onGameEnd?.(result.winner);
      return true;
    }

    if (newBoard.every(s => s !== null)) {
      setWinner("draw");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      onGameEnd?.(null);
      return true;
    }

    return false;
  }, [board, checkWinner, onGameEnd]);

  const handleClick = useCallback((index: number) => {
    if (board[index] || winner || isAiThinking) return;

    const gameEnded = makeMove(index, currentPlayer);
    
    if (!gameEnded) {
      if (gameMode === "ai" && currentPlayer === "X") {
        setCurrentPlayer("O");
        setIsAiThinking(true);
        
        setTimeout(() => {
          const newBoard = [...board];
          newBoard[index] = "X";
          const aiMove = getBestMove(newBoard);
          
          const finalBoard = [...newBoard];
          finalBoard[aiMove] = "O";
          setBoard(finalBoard);
          
          const result = checkWinner(finalBoard);
          if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
            setScores(prev => ({
              ...prev,
              [result.winner!]: prev[result.winner!] + 1
            }));
            onGameEnd?.(result.winner);
          } else if (finalBoard.every(s => s !== null)) {
            setWinner("draw");
            setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
            onGameEnd?.(null);
          } else {
            setCurrentPlayer("X");
          }
          setIsAiThinking(false);
        }, 500);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    }
  }, [board, winner, currentPlayer, gameMode, isAiThinking, makeMove, getBestMove, checkWinner, onGameEnd]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  const switchMode = (mode: GameMode) => {
    setGameMode(mode);
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  const getCellStyle = (index: number) => {
    const isWinning = winningLine?.includes(index);
    const value = board[index];
    
    if (isWinning) {
      return value === "X" 
        ? "text-neon-cyan shadow-[0_0_30px_hsl(var(--neon-cyan))]" 
        : "text-neon-pink shadow-[0_0_30px_hsl(var(--neon-pink))]";
    }
    
    return value === "X" ? "text-neon-cyan" : "text-neon-pink";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={gameMode === "pvp" ? "neon" : "outline"}
          size="sm"
          onClick={() => switchMode("pvp")}
          className="gap-2"
        >
          <Users className="w-4 h-4" /> PvP
        </Button>
        <Button
          variant={gameMode === "ai" ? "neon-purple" : "outline"}
          size="sm"
          onClick={() => switchMode("ai")}
          className="gap-2"
        >
          <Bot className="w-4 h-4" /> vs AI
        </Button>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {gameMode === "ai" ? "You" : "Player X"}
          </p>
          <p className="font-pixel text-2xl text-neon-cyan">{scores.X}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Draws</p>
          <p className="font-pixel text-xl text-muted-foreground">{scores.draws}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {gameMode === "ai" ? "AI" : "Player O"}
          </p>
          <p className="font-pixel text-2xl text-neon-pink">{scores.O}</p>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="h-8 flex items-center justify-center">
        {!winner && (
          <motion.p 
            key={currentPlayer}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-pixel text-sm ${currentPlayer === "X" ? "text-neon-cyan" : "text-neon-pink"}`}
          >
            {isAiThinking ? "AI is thinking..." : `${gameMode === "ai" && currentPlayer === "X" ? "Your" : currentPlayer + "'s"} turn`}
          </motion.p>
        )}
      </div>

      {/* Game Board */}
      <div className="relative">
        <div 
          className="grid grid-cols-3 gap-2 p-4 bg-card rounded-xl border border-border"
          style={{
            boxShadow: "0 0 40px hsl(var(--primary) / 0.1), inset 0 0 20px hsl(var(--background) / 0.5)"
          }}
        >
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: cell || winner ? 1 : 1.05 }}
              whileTap={{ scale: cell || winner ? 1 : 0.95 }}
              onClick={() => handleClick(index)}
              disabled={!!cell || !!winner || isAiThinking}
              className={`
                w-20 h-20 md:w-24 md:h-24 
                flex items-center justify-center 
                bg-muted/30 rounded-lg border border-border/50
                transition-all duration-200
                ${!cell && !winner && !isAiThinking ? "hover:border-primary/50 hover:bg-muted/50 cursor-pointer" : "cursor-default"}
                ${getCellStyle(index)}
              `}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="font-pixel text-4xl md:text-5xl"
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Winner Overlay */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
            >
              {winner === "draw" ? (
                <motion.p 
                  className="font-pixel text-xl text-neon-yellow"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  IT'S A DRAW!
                </motion.p>
              ) : (
                <>
                  <Trophy className={`w-12 h-12 ${winner === "X" ? "text-neon-cyan" : "text-neon-pink"}`} />
                  <motion.p 
                    className={`font-pixel text-xl ${winner === "X" ? "text-neon-cyan" : "text-neon-pink"}`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {gameMode === "ai" 
                      ? (winner === "X" ? "YOU WIN!" : "AI WINS!")
                      : `${winner} WINS!`
                    }
                  </motion.p>
                </>
              )}
              <Button variant="neon-green" onClick={resetGame} className="gap-2 mt-2">
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset Button */}
      {!winner && (
        <Button variant="ghost" onClick={resetGame} className="gap-2 text-muted-foreground">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      )}
    </div>
  );
}
