/**
 * Game AI Module
 *
 * Provides AI opponents for all games with adjustable difficulty levels.
 * Each AI has distinct personalities and strategies.
 */

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIConfig {
  difficulty: AIDifficulty;
  personality?: string;
  thinkingDelay?: number;
}

// =============================================================================
// TIC-TAC-TOE AI
// =============================================================================

type TTTBoard = (string | null)[];
type TTTPlayer = 'X' | 'O';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

function checkTTTWinner(board: TTTBoard): TTTPlayer | 'draw' | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as TTTPlayer;
    }
  }
  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

function minimax(
  board: TTTBoard,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const result = checkTTTWinner(board);
  if (result === 'O') return 10 - depth;
  if (result === 'X') return depth - 10;
  if (result === 'draw') return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const evalScore = minimax(board, depth + 1, false, alpha, beta);
        board[i] = null;
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        const evalScore = minimax(board, depth + 1, true, alpha, beta);
        board[i] = null;
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
}

export function getTicTacToeAIMove(board: TTTBoard, config: AIConfig): number {
  const emptySquares = board.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);

  if (emptySquares.length === 0) return -1;

  switch (config.difficulty) {
    case 'easy': {
      // 70% random, 30% smart
      if (Math.random() < 0.7) {
        return emptySquares[Math.floor(Math.random() * emptySquares.length)];
      }
      // Fall through to medium
    }

    case 'medium': {
      // Block wins, take center, otherwise random
      // Check for winning move
      for (const idx of emptySquares) {
        const testBoard = [...board];
        testBoard[idx] = 'O';
        if (checkTTTWinner(testBoard) === 'O') return idx;
      }
      // Block opponent's winning move
      for (const idx of emptySquares) {
        const testBoard = [...board];
        testBoard[idx] = 'X';
        if (checkTTTWinner(testBoard) === 'X') return idx;
      }
      // Take center if available
      if (board[4] === null) return 4;
      // Take corner
      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
      }
      // Random
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    case 'hard':
    case 'expert': {
      // Full minimax - unbeatable
      let bestScore = -Infinity;
      let bestMove = emptySquares[0];

      for (const idx of emptySquares) {
        const testBoard = [...board];
        testBoard[idx] = 'O';
        const score = minimax(testBoard, 0, false, -Infinity, Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }

      // Expert occasionally makes perfect play, hard has small chance of mistake
      if (config.difficulty === 'hard' && Math.random() < 0.1) {
        return emptySquares[Math.floor(Math.random() * emptySquares.length)];
      }

      return bestMove;
    }

    default:
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }
}

// =============================================================================
// SNAKE AI (Competitive Mode)
// =============================================================================

export interface SnakePosition {
  x: number;
  y: number;
}

type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SnakeAIState {
  aiSnake: SnakePosition[];
  playerSnake: SnakePosition[];
  food: SnakePosition;
  gridSize: number;
}

function manhattanDistance(a: SnakePosition, b: SnakePosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isValidMove(
  head: SnakePosition,
  direction: SnakeDirection,
  obstacles: SnakePosition[],
  gridSize: number
): boolean {
  let newHead: SnakePosition;
  switch (direction) {
    case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
    case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
    case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
    case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
  }

  // Check bounds
  if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
    return false;
  }

  // Check collision with obstacles
  return !obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y);
}

function getOppositeDirection(dir: SnakeDirection): SnakeDirection {
  const opposites: Record<SnakeDirection, SnakeDirection> = {
    UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
  };
  return opposites[dir];
}

export function getSnakeAIMove(
  state: SnakeAIState,
  currentDirection: SnakeDirection,
  config: AIConfig
): SnakeDirection {
  const { aiSnake, playerSnake, food, gridSize } = state;
  const head = aiSnake[0];
  const obstacles = [...aiSnake.slice(1), ...playerSnake];

  const directions: SnakeDirection[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const opposite = getOppositeDirection(currentDirection);

  // Filter valid directions (not opposite, not into obstacle)
  const validDirections = directions.filter(dir =>
    dir !== opposite && isValidMove(head, dir, obstacles, gridSize)
  );

  if (validDirections.length === 0) {
    // No valid moves, game over for AI
    return currentDirection;
  }

  switch (config.difficulty) {
    case 'easy': {
      // 60% random valid move, 40% towards food
      if (Math.random() < 0.6) {
        return validDirections[Math.floor(Math.random() * validDirections.length)];
      }
      // Fall through
    }

    case 'medium': {
      // Simple pathfinding towards food
      let bestDir = validDirections[0];
      let bestDistance = Infinity;

      for (const dir of validDirections) {
        let newHead: SnakePosition;
        switch (dir) {
          case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
          case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
          case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
          case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
        }

        const dist = manhattanDistance(newHead, food);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestDir = dir;
        }
      }

      return bestDir;
    }

    case 'hard':
    case 'expert': {
      // A* pathfinding with look-ahead
      // For expert, also consider blocking player

      let bestDir = validDirections[0];
      let bestScore = -Infinity;

      for (const dir of validDirections) {
        let newHead: SnakePosition;
        switch (dir) {
          case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
          case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
          case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
          case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
        }

        // Score based on:
        // 1. Distance to food (closer = better)
        const foodDist = manhattanDistance(newHead, food);
        let score = 100 - foodDist;

        // 2. Space available (more = better) - avoid corners
        const newObstacles = [...obstacles, head];
        let spaceFactor = 0;
        for (const d of directions) {
          if (d !== getOppositeDirection(dir) && isValidMove(newHead, d, newObstacles, gridSize)) {
            spaceFactor += 10;
          }
        }
        score += spaceFactor;

        // 3. Expert: Block player's path to food
        if (config.difficulty === 'expert') {
          const playerHead = playerSnake[0];
          const playerFoodDist = manhattanDistance(playerHead, food);
          const aiFoodDist = manhattanDistance(newHead, food);

          if (aiFoodDist < playerFoodDist) {
            score += 20; // Bonus for being closer than player
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestDir = dir;
        }
      }

      return bestDir;
    }

    default:
      return validDirections[Math.floor(Math.random() * validDirections.length)];
  }
}

// =============================================================================
// UNO AI
// =============================================================================

export interface UnoCard {
  id: string;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild';
  value: string;
  type: 'number' | 'action' | 'wild';
}

interface UnoGameState {
  hand: UnoCard[];
  discardTop: UnoCard;
  currentColor: string;
  opponentCardCount: number;
  drawPileCount: number;
}

function canPlayCard(card: UnoCard, discardTop: UnoCard, currentColor: string): boolean {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === discardTop.value) return true;
  return false;
}

function scoreUnoCard(card: UnoCard, state: UnoGameState, config: AIConfig): number {
  let score = 0;

  // Action cards are valuable
  if (card.type === 'action') {
    score += 20;
    if (card.value === 'skip' || card.value === 'reverse') score += 10;
    if (card.value === '+2') score += 15;
  }

  // Wild cards are most valuable
  if (card.color === 'wild') {
    score += 30;
    if (card.value === '+4') score += 20;
  }

  // If opponent has few cards, prioritize action cards
  if (state.opponentCardCount <= 2) {
    if (card.type === 'action') score += 30;
    if (card.value === '+2' || card.value === '+4') score += 40;
  }

  // Easy AI doesn't consider strategy much
  if (config.difficulty === 'easy') {
    score = Math.random() * 50;
  }

  // Medium AI has some randomness
  if (config.difficulty === 'medium') {
    score += Math.random() * 20;
  }

  return score;
}

export function getUnoAIMove(state: UnoGameState, config: AIConfig): {
  action: 'play' | 'draw';
  card?: UnoCard;
  chosenColor?: string;
} {
  const { hand, discardTop, currentColor } = state;

  // Find playable cards
  const playableCards = hand.filter(card => canPlayCard(card, discardTop, currentColor));

  if (playableCards.length === 0) {
    return { action: 'draw' };
  }

  // Score each playable card
  const scoredCards = playableCards.map(card => ({
    card,
    score: scoreUnoCard(card, state, config)
  }));

  // Sort by score descending
  scoredCards.sort((a, b) => b.score - a.score);

  // Choose card based on difficulty
  let chosenCard: UnoCard;
  switch (config.difficulty) {
    case 'easy':
      // Random playable card
      chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      break;
    case 'medium':
      // Top 3 random
      chosenCard = scoredCards[Math.floor(Math.random() * Math.min(3, scoredCards.length))].card;
      break;
    case 'hard':
    case 'expert':
      // Best card
      chosenCard = scoredCards[0].card;
      break;
    default:
      chosenCard = playableCards[0];
  }

  // Choose color for wild cards
  let chosenColor: string | undefined;
  if (chosenCard.color === 'wild') {
    // Count colors in hand
    const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    hand.forEach(card => {
      if (card.color !== 'wild') {
        colorCounts[card.color]++;
      }
    });

    // Choose color with most cards
    chosenColor = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Easy AI picks random color
    if (config.difficulty === 'easy') {
      const colors = ['red', 'blue', 'green', 'yellow'];
      chosenColor = colors[Math.floor(Math.random() * colors.length)];
    }
  }

  return { action: 'play', card: chosenCard, chosenColor };
}

// =============================================================================
// SNAKE & LADDERS AI
// =============================================================================

// For Snake & Ladders, the AI is mainly for simulating dice rolls
// since it's a luck-based game. The AI can have "personalities" though.

export interface SnakeLaddersState {
  aiPosition: number;
  playerPosition: number;
  snakes: Map<number, number>; // head -> tail
  ladders: Map<number, number>; // bottom -> top
}

export function getSnakeLaddersAIComment(
  state: SnakeLaddersState,
  diceRoll: number,
  newPosition: number,
  config: AIConfig
): string {
  const { aiPosition, snakes, ladders } = state;

  const comments = {
    landed_on_snake: [
      "Oh no, a snake! Down I go...",
      "Sssssliding down!",
      "That's unfortunate...",
    ],
    landed_on_ladder: [
      "Climbing up! Lucky!",
      "Woohoo, a ladder!",
      "That's more like it!",
    ],
    close_to_win: [
      "Almost there!",
      "Victory is near!",
      "Just a few more steps...",
    ],
    good_roll: [
      "Nice roll!",
      "That works!",
      "Making progress!",
    ],
    bad_roll: [
      "Could be better...",
      "Not great...",
      "Hmm...",
    ],
  };

  // Check what happened
  if (snakes.has(newPosition)) {
    return comments.landed_on_snake[Math.floor(Math.random() * comments.landed_on_snake.length)];
  }

  if (ladders.has(aiPosition + diceRoll)) {
    return comments.landed_on_ladder[Math.floor(Math.random() * comments.landed_on_ladder.length)];
  }

  if (newPosition >= 90) {
    return comments.close_to_win[Math.floor(Math.random() * comments.close_to_win.length)];
  }

  if (diceRoll >= 5) {
    return comments.good_roll[Math.floor(Math.random() * comments.good_roll.length)];
  }

  return comments.bad_roll[Math.floor(Math.random() * comments.bad_roll.length)];
}

// =============================================================================
// AI NAMES & PERSONALITIES
// =============================================================================

export const AI_PERSONALITIES = {
  easy: [
    { name: 'Rookie Bot', avatar: 1, tagline: "I'm still learning!" },
    { name: 'Friendly Fred', avatar: 2, tagline: 'Having fun is what matters!' },
    { name: 'Chill Charlie', avatar: 3, tagline: 'Take it easy~' },
  ],
  medium: [
    { name: 'Balanced Betty', avatar: 4, tagline: 'A fair challenge awaits.' },
    { name: 'Steady Steve', avatar: 5, tagline: 'Consistent and reliable.' },
    { name: 'Smart Sam', avatar: 6, tagline: 'Thinking things through.' },
  ],
  hard: [
    { name: 'Tactical Tina', avatar: 7, tagline: 'Strategy is my game.' },
    { name: 'Pro Pete', avatar: 8, tagline: 'Prepare to be challenged.' },
    { name: 'Sharp Sharon', avatar: 9, tagline: 'Every move counts.' },
  ],
  expert: [
    { name: 'Master Max', avatar: 10, tagline: 'Perfection is the goal.' },
    { name: 'Champion Chloe', avatar: 11, tagline: 'Undefeated.' },
    { name: 'The Algorithm', avatar: 12, tagline: 'Resistance is futile.' },
  ],
};

export function getRandomAIPersonality(difficulty: AIDifficulty) {
  const personalities = AI_PERSONALITIES[difficulty];
  return personalities[Math.floor(Math.random() * personalities.length)];
}

// =============================================================================
// THINKING DELAY (for natural feel)
// =============================================================================

export function getThinkingDelay(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return 300 + Math.random() * 500;
    case 'medium': return 500 + Math.random() * 700;
    case 'hard': return 700 + Math.random() * 800;
    case 'expert': return 400 + Math.random() * 400; // Expert is faster, more confident
    default: return 500;
  }
}
