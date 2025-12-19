import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Users, Trophy, Zap, Plus, Ban } from "lucide-react";

type CardColor = "red" | "blue" | "green" | "yellow" | "wild";
type CardValue = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

interface Player {
  id: number;
  name: string;
  cards: UnoCard[];
  isBot: boolean;
}

const COLORS: CardColor[] = ["red", "blue", "green", "yellow"];
const VALUES: CardValue[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "reverse", "draw2"];

const colorStyles: Record<CardColor, { bg: string; border: string; text: string }> = {
  red: { bg: "bg-red-500", border: "border-red-400", text: "text-red-500" },
  blue: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-500" },
  green: { bg: "bg-green-500", border: "border-green-400", text: "text-green-500" },
  yellow: { bg: "bg-yellow-500", border: "border-yellow-400", text: "text-yellow-500" },
  wild: { bg: "bg-gradient-to-br from-red-500 via-blue-500 to-green-500", border: "border-purple-400", text: "text-purple-500" },
};

function generateDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let id = 0;

  // Number cards (0-9) for each color
  COLORS.forEach((color) => {
    VALUES.forEach((value) => {
      deck.push({ id: `${id++}`, color, value });
      if (value !== "0") {
        deck.push({ id: `${id++}`, color, value });
      }
    });
  });

  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `${id++}`, color: "wild", value: "wild" });
    deck.push({ id: `${id++}`, color: "wild", value: "wild4" });
  }

  return deck;
}

function shuffleDeck(deck: UnoCard[]): UnoCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function UnoGame() {
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [direction, setDirection] = useState(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<CardColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [message, setMessage] = useState("");

  const startGame = useCallback(() => {
    const shuffledDeck = shuffleDeck(generateDeck());
    
    const newPlayers: Player[] = [
      { id: 1, name: "You", cards: [], isBot: false },
      { id: 2, name: "Bot 1", cards: [], isBot: true },
      { id: 3, name: "Bot 2", cards: [], isBot: true },
      { id: 4, name: "Bot 3", cards: [], isBot: true },
    ];

    // Deal 7 cards to each player
    let cardIndex = 0;
    newPlayers.forEach((player) => {
      player.cards = shuffledDeck.slice(cardIndex, cardIndex + 7);
      cardIndex += 7;
    });

    // Find first non-wild card for discard pile
    let firstCard = shuffledDeck[cardIndex];
    while (firstCard.color === "wild") {
      cardIndex++;
      firstCard = shuffledDeck[cardIndex];
    }
    cardIndex++;

    setPlayers(newPlayers);
    setDeck(shuffledDeck.slice(cardIndex));
    setDiscardPile([firstCard]);
    setCurrentPlayer(0);
    setDirection(1);
    setWinner(null);
    setGameStarted(true);
    setMessage("");
    setSelectedColor(null);
  }, []);

  const canPlayCard = (card: UnoCard, topCard: UnoCard): boolean => {
    if (card.color === "wild") return true;
    if (selectedColor && card.color === selectedColor) return true;
    if (card.color === topCard.color) return true;
    if (card.value === topCard.value) return true;
    return false;
  };

  const playCard = (cardIndex: number) => {
    if (currentPlayer !== 0 || !gameStarted || winner) return;

    const player = players[0];
    const card = player.cards[cardIndex];
    const topCard = discardPile[discardPile.length - 1];

    if (!canPlayCard(card, topCard)) {
      setMessage("Can't play this card!");
      return;
    }

    // Handle wild cards
    if (card.color === "wild") {
      setShowColorPicker(true);
      // Store the card to play after color selection
      (window as any).__pendingCard = { cardIndex, card };
      return;
    }

    executePlay(cardIndex, card);
  };

  const executePlay = (cardIndex: number, card: UnoCard, chosenColor?: CardColor) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[0] = {
        ...newPlayers[0],
        cards: newPlayers[0].cards.filter((_, i) => i !== cardIndex),
      };
      return newPlayers;
    });

    const playedCard = chosenColor ? { ...card, color: chosenColor } : card;
    setDiscardPile((prev) => [...prev, playedCard]);
    setSelectedColor(chosenColor || null);
    setMessage("");

    // Check for UNO
    if (players[0].cards.length === 2) {
      setMessage("UNO!");
    }

    // Check for win
    if (players[0].cards.length === 1) {
      setWinner(players[0]);
      return;
    }

    // Handle special cards
    let nextPlayer = currentPlayer;
    let newDirection = direction;

    if (card.value === "reverse") {
      newDirection = -direction;
      setDirection(newDirection);
    }

    if (card.value === "skip") {
      nextPlayer = (nextPlayer + 2 * newDirection + 4) % 4;
    } else {
      nextPlayer = (nextPlayer + newDirection + 4) % 4;
    }

    if (card.value === "draw2") {
      // Next player draws 2
      drawCards(nextPlayer, 2);
      nextPlayer = (nextPlayer + newDirection + 4) % 4;
    }

    if (card.value === "wild4") {
      // Next player draws 4
      drawCards((nextPlayer + newDirection + 4) % 4, 4);
    }

    setCurrentPlayer(nextPlayer);

    // Bot plays after delay
    if (nextPlayer !== 0) {
      setTimeout(() => botPlay(nextPlayer), 1000);
    }
  };

  const selectColor = (color: CardColor) => {
    setShowColorPicker(false);
    const pending = (window as any).__pendingCard;
    if (pending) {
      executePlay(pending.cardIndex, pending.card, color);
      delete (window as any).__pendingCard;
    }
  };

  const drawCards = (playerIndex: number, count: number) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      const drawnCards = deck.slice(0, count);
      setDeck((d) => d.slice(count));
      newPlayers[playerIndex] = {
        ...newPlayers[playerIndex],
        cards: [...newPlayers[playerIndex].cards, ...drawnCards],
      };
      return newPlayers;
    });
  };

  const drawCard = () => {
    if (currentPlayer !== 0 || !gameStarted || winner) return;
    
    const drawnCard = deck[0];
    setDeck((d) => d.slice(1));
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[0] = {
        ...newPlayers[0],
        cards: [...newPlayers[0].cards, drawnCard],
      };
      return newPlayers;
    });

    setMessage(`Drew: ${drawnCard.color} ${drawnCard.value}`);

    // Move to next player
    const nextPlayer = (currentPlayer + direction + 4) % 4;
    setCurrentPlayer(nextPlayer);

    if (nextPlayer !== 0) {
      setTimeout(() => botPlay(nextPlayer), 1000);
    }
  };

  const botPlay = (playerIndex: number) => {
    if (winner) return;

    const player = players[playerIndex];
    const topCard = discardPile[discardPile.length - 1];

    // Find playable card
    const playableIndex = player.cards.findIndex((card) => canPlayCard(card, topCard));

    if (playableIndex !== -1) {
      const card = player.cards[playableIndex];
      
      setPlayers((prev) => {
        const newPlayers = [...prev];
        newPlayers[playerIndex] = {
          ...newPlayers[playerIndex],
          cards: newPlayers[playerIndex].cards.filter((_, i) => i !== playableIndex),
        };
        return newPlayers;
      });

      let playedCard = card;
      if (card.color === "wild") {
        // Bot picks random color
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        playedCard = { ...card, color: randomColor };
        setSelectedColor(randomColor);
      } else {
        setSelectedColor(null);
      }

      setDiscardPile((prev) => [...prev, playedCard]);

      // Check for win
      if (player.cards.length === 1) {
        setWinner(player);
        return;
      }

      // Handle special cards & next player
      let nextPlayer = playerIndex;
      let newDirection = direction;

      if (card.value === "reverse") {
        newDirection = -direction;
        setDirection(newDirection);
      }

      if (card.value === "skip") {
        nextPlayer = (nextPlayer + 2 * newDirection + 4) % 4;
      } else {
        nextPlayer = (nextPlayer + newDirection + 4) % 4;
      }

      if (card.value === "draw2") {
        drawCards(nextPlayer, 2);
        nextPlayer = (nextPlayer + newDirection + 4) % 4;
      }

      if (card.value === "wild4") {
        drawCards((nextPlayer + newDirection + 4) % 4, 4);
      }

      setCurrentPlayer(nextPlayer);

      if (nextPlayer !== 0) {
        setTimeout(() => botPlay(nextPlayer), 1000);
      }
    } else {
      // Bot draws a card
      const drawnCard = deck[0];
      setDeck((d) => d.slice(1));
      setPlayers((prev) => {
        const newPlayers = [...prev];
        newPlayers[playerIndex] = {
          ...newPlayers[playerIndex],
          cards: [...newPlayers[playerIndex].cards, drawnCard],
        };
        return newPlayers;
      });

      const nextPlayer = (playerIndex + direction + 4) % 4;
      setCurrentPlayer(nextPlayer);

      if (nextPlayer !== 0) {
        setTimeout(() => botPlay(nextPlayer), 1000);
      }
    }
  };

  const UnoCardComponent = ({ card, onClick, isPlayable = true, size = "normal" }: { 
    card: UnoCard; 
    onClick?: () => void;
    isPlayable?: boolean;
    size?: "normal" | "small";
  }) => {
    const styles = colorStyles[card.color];
    const isNormal = size === "normal";
    
    return (
      <motion.div
        onClick={onClick}
        whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
        whileTap={isPlayable ? { scale: 0.95 } : {}}
        className={`
          relative rounded-xl cursor-pointer
          ${styles.bg} ${styles.border} border-2
          ${isNormal ? "w-16 h-24" : "w-10 h-14"}
          ${!isPlayable ? "opacity-50" : ""}
          shadow-lg
        `}
      >
        <div className="absolute inset-1 bg-background/90 rounded-lg flex items-center justify-center">
          <span className={`font-display font-bold ${isNormal ? "text-lg" : "text-xs"} ${styles.text}`}>
            {card.value === "skip" ? <Ban className={isNormal ? "w-6 h-6" : "w-4 h-4"} /> :
             card.value === "reverse" ? "⟲" :
             card.value === "draw2" ? "+2" :
             card.value === "wild" ? "W" :
             card.value === "wild4" ? "+4" :
             card.value}
          </span>
        </div>
      </motion.div>
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
                {winner.isBot ? "Better luck next time!" : "Congratulations!"}
              </p>
              <Button onClick={startGame} variant="arcade" size="lg">
                Play Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="p-6 rounded-2xl glass-card"
            >
              <h3 className="font-display text-xl text-center mb-4">Choose Color</h3>
              <div className="grid grid-cols-2 gap-4">
                {COLORS.map((color) => (
                  <Button
                    key={color}
                    onClick={() => selectColor(color)}
                    className={`w-20 h-20 ${colorStyles[color].bg} border-2 ${colorStyles[color].border}`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!gameStarted ? (
        <Card variant="neon" className="p-12 text-center">
          <h2 className="font-display text-3xl text-glow-cyan mb-4">UNO</h2>
          <p className="text-muted-foreground mb-8">
            Classic card game - be the first to empty your hand!
          </p>
          <Button onClick={startGame} variant="arcade" size="xl">
            Start Game
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Opponents */}
          <div className="grid grid-cols-3 gap-4">
            {players.slice(1).map((player, index) => (
              <Card
                key={player.id}
                variant={currentPlayer === index + 1 ? "neon" : "arcade"}
                className="p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-sm">{player.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {player.cards.length} cards
                  </span>
                </div>
                <div className="flex gap-1 overflow-hidden">
                  {player.cards.slice(0, 7).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-9 bg-gradient-to-br from-primary to-secondary rounded-md border border-border"
                    />
                  ))}
                  {player.cards.length > 7 && (
                    <span className="text-xs text-muted-foreground">+{player.cards.length - 7}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Play Area */}
          <Card variant="arcade" className="p-6">
            <div className="flex items-center justify-center gap-8">
              {/* Draw Pile */}
              <motion.div
                onClick={currentPlayer === 0 ? drawCard : undefined}
                whileHover={currentPlayer === 0 ? { scale: 1.05 } : {}}
                className={`
                  w-20 h-28 rounded-xl bg-gradient-to-br from-primary to-secondary
                  border-2 border-primary flex items-center justify-center cursor-pointer
                  ${currentPlayer === 0 ? "hover:shadow-glow-cyan" : "opacity-50"}
                `}
              >
                <Plus className="w-8 h-8 text-primary-foreground" />
              </motion.div>

              {/* Discard Pile */}
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {discardPile.slice(-3).map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ 
                        scale: 1, 
                        rotate: i * 5 - 5,
                        x: i * 2,
                        y: i * -2
                      }}
                      className="absolute top-0 left-0"
                      style={{ zIndex: i }}
                    >
                      <UnoCardComponent card={card} isPlayable={false} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {discardPile.length > 0 && (
                  <div className="w-20 h-28 opacity-0">
                    <UnoCardComponent card={discardPile[discardPile.length - 1]} isPlayable={false} />
                  </div>
                )}
              </div>

              {/* Current Color Indicator */}
              {selectedColor && (
                <div className={`w-10 h-10 rounded-full ${colorStyles[selectedColor].bg}`} />
              )}
            </div>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-4 text-primary font-display"
              >
                {message}
              </motion.p>
            )}
          </Card>

          {/* Your Hand */}
          <Card variant={currentPlayer === 0 ? "neon" : "arcade"} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                YOUR HAND
              </h3>
              {currentPlayer === 0 && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Your Turn
                </span>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
              {players[0]?.cards.map((card, index) => (
                <UnoCardComponent
                  key={card.id}
                  card={card}
                  onClick={() => playCard(index)}
                  isPlayable={currentPlayer === 0 && canPlayCard(card, discardPile[discardPile.length - 1])}
                />
              ))}
            </div>
          </Card>

          {/* Reset */}
          <Button
            onClick={startGame}
            variant="outline"
            className="w-full gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
        </div>
      )}
    </div>
  );
}