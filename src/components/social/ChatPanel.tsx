/**
 * Chat Panel Component
 *
 * In-game messaging system with support for game rooms and direct messages.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  X,
  Smile,
  Minimize2,
  Maximize2,
  Users,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "message" | "system" | "emote";
}

interface ChatPanelProps {
  roomId?: string;
  roomName?: string;
  messages?: ChatMessage[];
  onSendMessage?: (content: string) => void;
  onSendEmote?: (emote: string) => void;
  onClose?: () => void;
  currentUserAddress?: string;
  participants?: { address: string; name: string }[];
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

// Quick emotes
const QUICK_EMOTES = ["gg", "glhf", "nice!", "wow", "lol", "oof"];

// Demo messages
const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "system",
    senderName: "System",
    content: "Game room created. Waiting for players...",
    timestamp: Date.now() - 300000,
    type: "system",
  },
  {
    id: "2",
    sender: "0x1234...5678",
    senderName: "CryptoGamer",
    content: "Hey! Ready to play?",
    timestamp: Date.now() - 240000,
    type: "message",
  },
  {
    id: "3",
    sender: "0xabcd...ef01",
    senderName: "NeonMaster",
    content: "Let's go! glhf",
    timestamp: Date.now() - 180000,
    type: "message",
  },
  {
    id: "4",
    sender: "system",
    senderName: "System",
    content: "Game starting in 3 seconds...",
    timestamp: Date.now() - 120000,
    type: "system",
  },
  {
    id: "5",
    sender: "0x1234...5678",
    senderName: "CryptoGamer",
    content: "gg",
    timestamp: Date.now() - 60000,
    type: "emote",
  },
];

export function ChatPanel({
  roomId = "demo-room",
  roomName = "Game Room",
  messages = DEMO_MESSAGES,
  onSendMessage,
  onSendEmote,
  onClose,
  currentUserAddress = "0xabcd...ef01",
  participants = [
    { address: "0x1234...5678", name: "CryptoGamer" },
    { address: "0xabcd...ef01", name: "NeonMaster" },
  ],
  isMinimized = false,
  onToggleMinimize,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [showEmotes, setShowEmotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage?.(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmote = (emote: string) => {
    onSendEmote?.(emote);
    setShowEmotes(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageStyle = (message: ChatMessage) => {
    if (message.type === "system") {
      return "bg-muted/30 text-muted-foreground text-center italic";
    }
    if (message.type === "emote") {
      return "bg-neon-purple/20 text-neon-purple font-pixel";
    }
    if (message.sender === currentUserAddress) {
      return "bg-neon-cyan/20 text-foreground ml-8";
    }
    return "bg-muted/50 text-foreground mr-8";
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <Button
          variant="neon-purple"
          onClick={onToggleMinimize}
          className="gap-2 shadow-lg"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
          {messages.length > 0 && (
            <span className="bg-neon-pink text-white text-xs px-1.5 rounded-full">
              {messages.length}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-80 h-96 bg-card border border-border rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neon-purple" />
          <span className="font-pixel text-sm text-primary">{roomName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleMinimize}
            title="Minimize"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
            title="Close"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 text-xs text-muted-foreground">
        <Users className="w-3 h-3" />
        {participants.map((p, i) => (
          <span key={p.address}>
            {p.name}
            {i < participants.length - 1 && ", "}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2 rounded-lg text-sm ${getMessageStyle(message)}`}
          >
            {message.type !== "system" && (
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-medium text-xs ${
                    message.sender === currentUserAddress
                      ? "text-neon-cyan"
                      : "text-neon-pink"
                  }`}
                >
                  {message.senderName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}
            <p className={message.type === "emote" ? "text-center text-lg" : ""}>
              {message.content}
            </p>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emotes */}
      <AnimatePresence>
        {showEmotes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 py-2 border-t border-border bg-muted/30"
          >
            <div className="flex flex-wrap gap-1">
              {QUICK_EMOTES.map((emote) => (
                <Button
                  key={emote}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleEmote(emote)}
                >
                  {emote}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 shrink-0 ${
              showEmotes ? "text-neon-purple" : ""
            }`}
            onClick={() => setShowEmotes(!showEmotes)}
          >
            <Smile className="w-4 h-4" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-background h-9"
          />
          <Button
            variant="neon-purple"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Floating chat button for pages that support it
export function ChatButton({
  unreadCount = 0,
  onClick,
}: {
  unreadCount?: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-lg hover:shadow-neon-purple/50 transition-shadow"
    >
      <MessageSquare className="w-6 h-6 text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-neon-yellow text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </motion.button>
  );
}
