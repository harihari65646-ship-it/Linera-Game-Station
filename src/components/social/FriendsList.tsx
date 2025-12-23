/**
 * Friends List Component
 *
 * Displays user's friends with online status, allows adding new friends,
 * and initiating game challenges.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Search,
  Circle,
  Gamepad2,
  MessageSquare,
  X,
  Check,
  Clock,
  Swords,
  Loader2,
} from "lucide-react";
import { lineraClient } from "@/lib/linera/client";
import { useLinera } from "@/contexts/LineraProvider";
import type { FriendEntry, FriendRequest as BlockchainFriendRequest } from "@/lib/linera/types";

type OnlineStatus = "online" | "in_game" | "offline";
type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface Friend {
  address: string;
  username: string;
  status: OnlineStatus;
  currentGame?: GameType;
  level: number;
  lastSeen?: number;
}

interface FriendRequest {
  from: string;
  username: string;
  timestamp: number;
}

interface FriendsListProps {
  onChallenge?: (address: string, gameType: GameType) => void;
  onOpenChat?: (address: string) => void;
  onSpectate?: (address: string) => void;
}

const GAME_NAMES: Record<GameType, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  snakeladders: "Snake & Ladders",
  uno: "UNO",
};

export function FriendsList({
  onChallenge,
  onOpenChat,
  onSpectate,
}: FriendsListProps) {
  const { chainId, isConnected } = useLinera();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendAddress, setNewFriendAddress] = useState("");
  const [showChallengeModal, setShowChallengeModal] = useState<string | null>(null);

  /**
   * Helper to format blockchain address to short display format
   */
  const formatAddress = useCallback((address: string): string => {
    if (!address || address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Helper to generate username from address
   */
  const getUsername = useCallback((address: string): string => {
    return `Player_${address.slice(-6)}`;
  }, []);

  /**
   * Fetch friends and friend requests from blockchain
   */
  const fetchFriendsData = useCallback(async () => {
    if (!isConnected || !chainId) {
      console.warn('[FriendsList] Not connected to blockchain');
      return;
    }

    try {
      setIsLoading(true);

      const [friendsData, requestsData] = await Promise.all([
        lineraClient.getFriends(chainId),
        lineraClient.getFriendRequests(chainId),
      ]);

      const mappedFriends: Friend[] = friendsData.map((friend: FriendEntry) => ({
        address: formatAddress(friend.address),
        username: getUsername(friend.address),
        status: 'offline' as OnlineStatus,
        level: Math.floor(Math.random() * 50) + 1,
        lastSeen: friend.addedAt,
      }));

      const mappedRequests: FriendRequest[] = requestsData.map((request: BlockchainFriendRequest) => ({
        from: request.from,
        username: getUsername(request.from),
        timestamp: request.createdAt,
      }));

      setFriends(mappedFriends);
      setPendingRequests(mappedRequests);
    } catch (error) {
      console.error('[FriendsList] Error fetching friends data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, chainId, formatAddress, getUsername]);

  /**
   * Poll for updates every 5 seconds
   */
  useEffect(() => {
    if (!isConnected) return;

    fetchFriendsData();

    const interval = setInterval(() => {
      fetchFriendsData();
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, fetchFriendsData]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter((f) => f.status !== "offline");
  const offlineFriends = filteredFriends.filter((f) => f.status === "offline");

  const getStatusColor = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return "text-neon-green";
      case "in_game":
        return "text-neon-yellow";
      case "offline":
        return "text-muted-foreground";
    }
  };

  const getStatusDot = (status: OnlineStatus) => {
    switch (status) {
      case "online":
        return "bg-neon-green";
      case "in_game":
        return "bg-neon-yellow animate-pulse";
      case "offline":
        return "bg-muted-foreground";
    }
  };

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  /**
   * Send friend request
   */
  const handleSendRequest = async () => {
    if (!newFriendAddress.trim()) return;

    try {
      const success = await lineraClient.sendFriendRequest(newFriendAddress.trim());
      if (success) {
        setNewFriendAddress("");
        setShowAddFriend(false);
        fetchFriendsData();
      }
    } catch (error) {
      console.error('[FriendsList] Error sending friend request:', error);
    }
  };

  /**
   * Accept friend request
   */
  const handleAcceptRequest = async (fromAddress: string) => {
    try {
      const success = await lineraClient.acceptFriendRequest(fromAddress);
      if (success) {
        fetchFriendsData();
      }
    } catch (error) {
      console.error('[FriendsList] Error accepting friend request:', error);
    }
  };

  /**
   * Reject friend request
   */
  const handleRejectRequest = async (fromAddress: string) => {
    try {
      const success = await lineraClient.rejectFriendRequest(fromAddress);
      if (success) {
        fetchFriendsData();
      }
    } catch (error) {
      console.error('[FriendsList] Error rejecting friend request:', error);
    }
  };

  /**
   * Remove friend
   */
  const handleRemoveFriend = async (friendAddress: string) => {
    try {
      const success = await lineraClient.removeFriend(friendAddress);
      if (success) {
        fetchFriendsData();
      }
    } catch (error) {
      console.error('[FriendsList] Error removing friend:', error);
    }
  };

  const FriendCard = ({ friend }: { friend: Friend }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Avatar with status indicator */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold">
            {friend.username.charAt(0).toUpperCase()}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusDot(
              friend.status
            )}`}
          />
        </div>

        {/* Info */}
        <div>
          <p className="font-medium text-foreground">{friend.username}</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Lv.{friend.level}</span>
            {friend.status === "in_game" && friend.currentGame && (
              <span className={`flex items-center gap-1 ${getStatusColor(friend.status)}`}>
                <Gamepad2 className="w-3 h-3" />
                Playing {GAME_NAMES[friend.currentGame]}
              </span>
            )}
            {friend.status === "offline" && (
              <span className="text-muted-foreground">
                Last seen {formatLastSeen(friend.lastSeen)}
              </span>
            )}
            {friend.status === "online" && (
              <span className={getStatusColor(friend.status)}>Online</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {friend.status === "in_game" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/20"
            onClick={() => onSpectate?.(friend.address)}
            title="Spectate"
          >
            <Circle className="w-4 h-4" />
          </Button>
        )}
        {friend.status === "online" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neon-pink hover:text-neon-pink hover:bg-neon-pink/20"
            onClick={() => setShowChallengeModal(friend.address)}
            title="Challenge"
          >
            <Swords className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-neon-purple hover:text-neon-purple hover:bg-neon-purple/20"
          onClick={() => onOpenChat?.(friend.address)}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-neon-purple" />
          <div>
            <h3 className="font-pixel text-lg text-primary">Friends</h3>
            <p className="text-xs text-muted-foreground">
              {onlineFriends.length} online
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddFriend(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search friends..."
          className="pl-9 bg-muted"
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Requests ({pendingRequests.length})
          </p>
          {pendingRequests.map((request) => (
            <motion.div
              key={request.from}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-purple/30 flex items-center justify-center text-neon-purple font-bold text-sm">
                  {request.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{request.username}</p>
                  <p className="text-xs text-muted-foreground">{request.from}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neon-green hover:bg-neon-green/20"
                  onClick={() => handleAcceptRequest(request.from)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/20"
                  onClick={() => handleRejectRequest(request.from)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && friends.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Not Connected State */}
      {!isConnected && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Connect wallet to view friends</p>
          <p className="text-sm">Connect to Linera blockchain to access social features</p>
        </div>
      )}

      {/* Friends List */}
      {isConnected && !isLoading && (
        <div className="space-y-4">
          {/* Online Friends */}
          {onlineFriends.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Online - {onlineFriends.length}
            </p>
            <div className="space-y-2">
              {onlineFriends.map((friend) => (
                <FriendCard key={friend.address} friend={friend} />
              ))}
            </div>
          </div>
        )}

        {/* Offline Friends */}
        {offlineFriends.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Offline - {offlineFriends.length}
            </p>
            <div className="space-y-2">
              {offlineFriends.map((friend) => (
                <FriendCard key={friend.address} friend={friend} />
              ))}
            </div>
          </div>
        )}

          {filteredFriends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No friends found</p>
              <p className="text-sm">Add friends to start playing together!</p>
            </div>
          )}
        </div>
      )}

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-pixel text-lg text-primary mb-4 text-center">
                Add Friend
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Wallet Address or Username
                  </label>
                  <Input
                    value={newFriendAddress}
                    onChange={(e) => setNewFriendAddress(e.target.value)}
                    placeholder="0x... or username"
                    className="bg-muted"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFriend(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="neon-purple"
                    onClick={handleSendRequest}
                    disabled={!newFriendAddress.trim()}
                    className="flex-1"
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowChallengeModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-pixel text-lg text-primary mb-4 text-center">
                Challenge to a Game
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(GAME_NAMES) as GameType[]).map((game) => (
                  <Button
                    key={game}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => {
                      onChallenge?.(showChallengeModal, game);
                      setShowChallengeModal(null);
                    }}
                  >
                    <Gamepad2 className="w-6 h-6" />
                    <span className="text-sm">{GAME_NAMES[game]}</span>
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowChallengeModal(null)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
