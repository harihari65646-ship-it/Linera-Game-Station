import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Users, Bot, Zap, Brain, Crown, Wifi, WifiOff } from "lucide-react";
import {
  getTicTacToeAIMove,
  getRandomAIPersonality,
  getThinkingDelay,
  type AIDifficulty,
} from "@/lib/game-ai";
import { useLinera } from "@/contexts/LineraProvider";
import { lineraClient } from "@/lib/linera/client";

type Player = "X" | "O" | null;
type Board = Player[];
type GameMode = "pvp" | "ai" | "multiplayer";

interface TicTacToeGameProps {
  onGameEnd?: (winner: Player) => void;
  roomId?: string;
}

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export function TicTacToeGame({ onGameEnd, roomId }: TicTacToeGameProps) {
  const { application, isConnected, address } = useLinera();

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(roomId ? "multiplayer" : "pvp");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");
  const [aiPersonality, setAiPersonality] = useState(() => getRandomAIPersonality("medium"));
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);

  const [playerIndex, setPlayerIndex] = useState<number>(-1);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [roomStatus, setRoomStatus] = useState<string>("");
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // FIX: Force multiplayer mode when roomId is present
  // This handles the case where component mounts before roomId is in URL
  useEffect(() => {
    if (roomId && gameMode !== "multiplayer") {
      console.log('[TicTacToe] Switching to multiplayer mode, roomId:', roomId);
      setGameMode("multiplayer");
    }
  }, [roomId, gameMode]);

  const checkWinner = useCallback((squares: Board): { winner: Player; line: number[] } | null => {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line };
      }
    }
    return null;
  }, []);

  // Submit result to blockchain
  const submitToBlockchain = useCallback(async (winner: Player) => {
    if (!application || !isConnected) return;

    // Only submit in AI mode (player vs AI)
    if (gameMode !== "ai") return;

    // Determine if the player won (X is the player in AI mode)
    const playerWon = winner === "X";

    try {
      console.log('[TicTacToeGame] Submitting result to blockchain:', { winner, playerWon });
      await application.query(
        '{ "query": "mutation { submitTictactoeResult(won: ' + playerWon + ') }" }'
      );
      console.log('[TicTacToeGame] Result submitted successfully');
    } catch (error) {
      console.error('[TicTacToeGame] Failed to submit result:', error);
    }
  }, [application, isConnected, gameMode]);

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

      // ✅ SUBMIT TO BLOCKCHAIN
      submitToBlockchain(result.winner);

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
  }, [board, checkWinner, onGameEnd, submitToBlockchain]);

  // ===========================================================================
  // MULTIPLAYER LOGIC (defined before handleClick to avoid forward reference)
  // ===========================================================================

  const syncRoomState = useCallback(async () => {
    if (!roomId || !address) return;

    try {
      const room = await lineraClient.getRoom(roomId);
      if (!room) {
        setMultiplayerError("Room not found");
        return;
      }

      setMultiplayerError(null);
      const roomStatusUpper = room.status?.toUpperCase() || '';
      setRoomStatus(roomStatusUpper);

      // Use Linera Address32 format for player matching (64 hex chars)
      // The contract stores players as Address32(keccak256(publicKey))
      const myLineraOwner = lineraClient.lineraOwnerAddress?.toLowerCase() ||
                             lineraClient.getMyOwnerHex().replace('0x', '').toLowerCase();
      const myEvmAddress = lineraClient.owner?.replace('0x', '').toLowerCase();

      // Find my position in the players array (match against Address32 format)
      const myPlayerIndex = room.players.findIndex(p => {
        // Extract hex from Address32(hex) format
        const playerHex = p.replace('Address32(', '').replace(')', '').toLowerCase();
        // Primary match: use Linera Address32 (64 chars)
        if (myLineraOwner && playerHex === myLineraOwner) return true;
        // Fallback: try EVM address (40 chars) - won't match but good for debugging
        if (myEvmAddress && playerHex === myEvmAddress) return true;
        return false;
      });
      setPlayerIndex(myPlayerIndex);

      console.log('[TicTacToe] Room sync:', {
        roomId,
        rawStatus: room.status,
        statusUpper: roomStatusUpper,
        players: room.players,
        myLineraOwner: myLineraOwner + ` (${myLineraOwner?.length || 0} chars)`,
        myEvmAddress: myEvmAddress + ` (${myEvmAddress?.length || 0} chars)`,
        myPlayerIndex,
        currentState: room.currentState
      });
      // Extra debug: show exact player format for matching verification
      if (room.players.length > 0) {
        console.log('[TicTacToe] Player 0 raw:', room.players[0]);
        const cleaned = room.players[0].replace('Address32(', '').replace(')', '').toLowerCase();
        console.log('[TicTacToe] Player 0 cleaned:', cleaned, `(${cleaned.length} chars)`);
        console.log('[TicTacToe] Matches myLineraOwner?', cleaned === myLineraOwner);
      }

      // Parse game state from currentState (not gameState)
      let newBoard: Board = Array(9).fill(null);
      let moveCount = 0;

      try {
        // Contract stores currentState - can be line-based or JSON format
        const stateStr = room.currentState || (room as any).gameState || '';
        console.log('[TicTacToe] Raw currentState:', stateStr);

        if (stateStr && stateStr !== '') {
          // Check for line-based format: "---\n-X-\n---" or "X--\n-O-\n---"
          if (stateStr.includes('\n') || (stateStr.length === 9 && !stateStr.startsWith('{'))) {
            // Line-based format from contract
            const rows = stateStr.includes('\n') ? stateStr.split('\n') : [stateStr.slice(0, 3), stateStr.slice(3, 6), stateStr.slice(6, 9)];
            const tempBoard: Board = [];
            rows.forEach((row: string) => {
              for (const char of row) {
                if (char === 'X') tempBoard.push('X');
                else if (char === 'O') tempBoard.push('O');
                else if (char === '-' || char === ' ') tempBoard.push(null);
              }
            });
            if (tempBoard.length === 9) {
              newBoard = tempBoard;
              moveCount = newBoard.filter(c => c !== null).length;
              console.log('[TicTacToe] Parsed line-based state:', newBoard);
            }
          } else {
            // Try JSON as fallback
            const gameState = JSON.parse(stateStr);
            if (gameState && Array.isArray(gameState.cells)) {
              newBoard = gameState.cells.map((cell: string | null) =>
                cell === "X" || cell === "O" ? cell : null
              ) as Board;
              moveCount = newBoard.filter(c => c !== null).length;
            } else if (Array.isArray(gameState)) {
              newBoard = gameState.map((cell: any) =>
                cell === "X" || cell === "O" ? cell : null
              ) as Board;
              moveCount = newBoard.filter(c => c !== null).length;
            }
            console.log('[TicTacToe] Parsed JSON state:', newBoard);
          }
        }
      } catch (parseError) {
        console.error('[TicTacToe] Failed to parse game state:', parseError, room.currentState);
      }

      setBoard(newBoard);

      // Determine whose turn based on move count (X goes first)
      // Even moves = X's turn (0, 2, 4...), Odd moves = O's turn (1, 3, 5...)
      const isXTurn = moveCount % 2 === 0;
      const mySymbol = myPlayerIndex === 0 ? "X" : "O";
      const shouldBeMyTurn = (isXTurn && mySymbol === "X") || (!isXTurn && mySymbol === "O");

      // FIX: Handle Linera cross-chain sync delay
      // When Player 2 joins, the message may not have propagated yet
      // So we need more permissive logic:
      // FIX: Contract enum serializes as PascalCase ("InProgress"), not "IN_PROGRESS"
      // After .toUpperCase(), "InProgress" becomes "INPROGRESS" (no underscore)
      const isGameInProgress = roomStatusUpper === 'INPROGRESS' || roomStatusUpper === 'PLAYING';
      const roomIsFull = room.players.length >= (room.maxPlayers || 2);

      // Allow play if:
      // 1. Game is in progress, OR
      // 2. Room shows 2+ players (cross-chain sync complete), OR
      // 3. I'm Player X (creator, index 0) and it's my turn - can start without waiting for sync
      const isRoomCreator = myPlayerIndex === 0;
      const canStartAsCreator = isRoomCreator && shouldBeMyTurn;
      const canPlay = isGameInProgress || roomIsFull || canStartAsCreator;

      setIsMyTurn(canPlay && shouldBeMyTurn && myPlayerIndex >= 0);
      setCurrentPlayer(isXTurn ? "X" : "O");

      console.log('[TicTacToe] Turn info:', {
        moveCount,
        isXTurn,
        mySymbol,
        shouldBeMyTurn,
        isGameInProgress,
        roomIsFull,
        isRoomCreator,
        canStartAsCreator,
        canPlay,
        myPlayerIndex,
        isMyTurn: canPlay && shouldBeMyTurn && myPlayerIndex >= 0
      });

      // Check for winner
      const result = checkWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
      } else if (newBoard.every(c => c !== null)) {
        setWinner("draw");
      }

      // Handle finished game
      if (roomStatusUpper === 'FINISHED' && room.winner) {
        const winnerIndex = room.players.findIndex(p =>
          p === room.winner || p.includes(room.winner || '')
        );
        if (winnerIndex === 0) {
          setWinner("X");
        } else if (winnerIndex === 1) {
          setWinner("O");
        }
      }

    } catch (error) {
      console.error('[TicTacToe] Error syncing room state:', error);
      setMultiplayerError("Connection error");
    }
  }, [roomId, address, checkWinner]);

  const handleMultiplayerClick = useCallback(async (index: number) => {
    if (!roomId || !isMyTurn || isSubmittingMove || board[index] || winner) return;

    setIsSubmittingMove(true);
    setMultiplayerError(null);

    try {
      // Convert index to "col,row" format for contract
      // Contract uses board[y][x] where x=col, y=row
      // So we send "x,y" = "col,row"
      const row = Math.floor(index / 3);
      const col = index % 3;
      const moveData = `${col},${row}`;

      console.log('[TicTacToe] Submitting move:', { index, moveData, roomId });

      const success = await lineraClient.makeGameMove(roomId, moveData);
      if (!success) {
        setMultiplayerError("Failed to submit move");
      } else {
        await syncRoomState();
      }
    } catch (error) {
      console.error('[TicTacToe] Error submitting move:', error);
      setMultiplayerError("Move submission failed");
    } finally {
      setIsSubmittingMove(false);
    }
  }, [roomId, isMyTurn, isSubmittingMove, board, winner, syncRoomState]);

  const handleClick = useCallback((index: number) => {
    if (gameMode === "multiplayer") {
      handleMultiplayerClick(index);
      return;
    }

    if (board[index] || winner || isAiThinking) return;

    const gameEnded = makeMove(index, currentPlayer);

    if (!gameEnded) {
      if (gameMode === "ai" && currentPlayer === "X") {
        setCurrentPlayer("O");
        setIsAiThinking(true);

        // Use the new AI module with difficulty-based thinking delay
        const thinkingTime = getThinkingDelay(aiDifficulty);

        setTimeout(() => {
          const newBoard = [...board];
          newBoard[index] = "X";

          // Use the new AI module instead of local minimax
          const aiMove = getTicTacToeAIMove(newBoard, { difficulty: aiDifficulty });

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

            // ✅ SUBMIT TO BLOCKCHAIN
            submitToBlockchain(result.winner);

            onGameEnd?.(result.winner);
          } else if (finalBoard.every(s => s !== null)) {
            setWinner("draw");
            setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
            onGameEnd?.(null);
          } else {
            setCurrentPlayer("X");
          }
          setIsAiThinking(false);
        }, thinkingTime);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    }
  }, [board, winner, currentPlayer, gameMode, isAiThinking, aiDifficulty, makeMove, checkWinner, onGameEnd, handleMultiplayerClick, submitToBlockchain]);

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
    if (mode === "ai") {
      setShowDifficultySelect(true);
    }
    resetGame();
  };

  const selectDifficulty = (difficulty: AIDifficulty) => {
    setAiDifficulty(difficulty);
    setAiPersonality(getRandomAIPersonality(difficulty));
    setShowDifficultySelect(false);
    resetGame();
  };

  const getDifficultyIcon = (difficulty: AIDifficulty) => {
    switch (difficulty) {
      case 'easy': return <Bot className="w-4 h-4" />;
      case 'medium': return <Zap className="w-4 h-4" />;
      case 'hard': return <Brain className="w-4 h-4" />;
      case 'expert': return <Crown className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: AIDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'expert': return 'text-red-400';
    }
  };

  useEffect(() => {
    if (gameMode === "multiplayer" && roomId && isConnected) {
      syncRoomState();

      pollIntervalRef.current = setInterval(() => {
        syncRoomState();
      }, 1000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [gameMode, roomId, isConnected, syncRoomState]);

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
      {/* Difficulty Selector Modal */}
      <AnimatePresence>
        {showDifficultySelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowDifficultySelect(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-pixel text-lg text-primary mb-4 text-center">Select Difficulty</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['easy', 'medium', 'hard', 'expert'] as AIDifficulty[]).map((diff) => (
                  <Button
                    key={diff}
                    variant="outline"
                    onClick={() => selectDifficulty(diff)}
                    className={`flex flex-col items-center gap-2 h-auto py-4 ${getDifficultyColor(diff)}`}
                  >
                    {getDifficultyIcon(diff)}
                    <span className="capitalize font-pixel text-sm">{diff}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selector - hide in multiplayer mode */}
      {gameMode !== "multiplayer" && (
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
          {gameMode === "ai" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDifficultySelect(true)}
              className={`gap-1 ${getDifficultyColor(aiDifficulty)}`}
            >
              {getDifficultyIcon(aiDifficulty)}
              <span className="capitalize text-xs">{aiDifficulty}</span>
            </Button>
          )}
        </div>
      )}

      {/* AI Personality Display */}
      {gameMode === "ai" && (
        <div className="text-center">
          <p className={`text-sm font-pixel ${getDifficultyColor(aiDifficulty)}`}>
            {aiPersonality.name}
          </p>
          <p className="text-xs text-muted-foreground italic">"{aiPersonality.tagline}"</p>
        </div>
      )}

      {/* Score Display - hide in multiplayer mode */}
      {gameMode !== "multiplayer" && (
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
      )}

      {/* Turn Indicator */}
      <div className="h-8 flex items-center justify-center">
        {!winner && gameMode === "multiplayer" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            {multiplayerError ? (
              <p className="font-pixel text-sm text-red-400 flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                {multiplayerError}
              </p>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-neon-green" />
                <p className={`font-pixel text-sm ${isMyTurn ? "text-neon-cyan" : "text-muted-foreground"}`}>
                  {isSubmittingMove ? "Submitting move..." : isMyTurn ? "Your turn" : "Waiting for opponent"}
                </p>
              </>
            )}
          </motion.div>
        )}
        {!winner && gameMode !== "multiplayer" && (
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
              disabled={
                !!cell ||
                !!winner ||
                isAiThinking ||
                (gameMode === "multiplayer" && (!isMyTurn || isSubmittingMove))
              }
              className={`
                w-20 h-20 md:w-24 md:h-24
                flex items-center justify-center
                bg-muted/30 rounded-lg border border-border/50
                transition-all duration-200
                ${!cell && !winner && !isAiThinking && (gameMode !== "multiplayer" || isMyTurn) && !isSubmittingMove
                  ? "hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                  : "cursor-default"}
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
