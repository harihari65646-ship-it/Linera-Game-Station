/**
 * Social Page
 *
 * Hub for all social features - friends, spectating, and challenges.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Eye, Swords, MessageSquare, Loader2 } from "lucide-react";
import { FriendsList } from "@/components/social/FriendsList";
import { SpectateList } from "@/components/social/SpectatorView";
import { ChatPanel, ChatButton } from "@/components/social/ChatPanel";
import { ChallengeManager } from "@/components/social/ChallengeNotification";
import { lineraClient } from "@/lib/linera/client";
import { useLinera } from "@/contexts/LineraProvider";
import type { Challenge as BlockchainChallenge } from "@/lib/linera/types";

type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface Challenge {
  id: string;
  from: string;
  fromUsername: string;
  gameType: GameType;
  expiresAt: number;
}

export default function SocialPage() {
  const { chainId, isConnected } = useLinera();

  const [activeTab, setActiveTab] = useState("friends");
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [incomingChallenges, setIncomingChallenges] = useState<Challenge[]>([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState<Challenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);

  /**
   * Helper to generate username from address
   */
  const getUsername = useCallback((address: string): string => {
    return `Player_${address.slice(-6)}`;
  }, []);

  /**
   * Fetch challenges from blockchain
   */
  const fetchChallenges = useCallback(async () => {
    if (!isConnected || !chainId) {
      console.warn('[SocialPage] Not connected to blockchain');
      return;
    }

    try {
      setIsLoadingChallenges(true);

      const challengesData = await lineraClient.getChallenges(chainId);

      const mappedChallenges: Challenge[] = challengesData
        .filter((c: BlockchainChallenge) => c.status === "Pending")
        .map((challenge: BlockchainChallenge) => ({
          id: challenge.id,
          from: challenge.challenger,
          fromUsername: getUsername(challenge.challenger),
          gameType: challenge.gameType.toLowerCase() as GameType,
          expiresAt: challenge.expiresAt,
        }));

      setChallenges(mappedChallenges);

      const incoming = mappedChallenges.filter(
        (c: Challenge) => c.from !== chainId
      );
      const outgoing = mappedChallenges.filter(
        (c: Challenge) => c.from === chainId
      );

      setIncomingChallenges(incoming);
      setOutgoingChallenges(outgoing);
    } catch (error) {
      console.error('[SocialPage] Error fetching challenges:', error);
    } finally {
      setIsLoadingChallenges(false);
    }
  }, [isConnected, chainId, getUsername]);

  /**
   * Poll for challenge updates every 5 seconds
   */
  useEffect(() => {
    if (!isConnected) return;

    fetchChallenges();

    const interval = setInterval(() => {
      fetchChallenges();
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, fetchChallenges]);

  /**
   * Accept a challenge
   */
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const roomId = await lineraClient.acceptChallenge(challengeId);
      if (roomId) {
        console.log('[SocialPage] Challenge accepted, room created:', roomId);
        fetchChallenges();
      }
    } catch (error) {
      console.error('[SocialPage] Error accepting challenge:', error);
    }
  };

  /**
   * Decline a challenge
   */
  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const success = await lineraClient.declineChallenge(challengeId);
      if (success) {
        fetchChallenges();
      }
    } catch (error) {
      console.error('[SocialPage] Error declining challenge:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      {/* Challenge notifications */}
      <ChallengeManager
        challenges={incomingChallenges}
        onAccept={handleAcceptChallenge}
        onDecline={handleDeclineChallenge}
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-pixel text-3xl md:text-4xl text-primary mb-2">
            Social Hub
          </h1>
          <p className="text-muted-foreground">
            Connect with friends, watch live games, and challenge players
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="friends" className="gap-2 font-pixel text-sm">
                <Users className="w-4 h-4" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="spectate" className="gap-2 font-pixel text-sm">
                <Eye className="w-4 h-4" />
                Watch
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-2 font-pixel text-sm">
                <Swords className="w-4 h-4" />
                Challenges
              </TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <FriendsList
                  onSendRequest={(address) =>
                    console.log("Send friend request to:", address)
                  }
                  onAcceptRequest={(address) =>
                    console.log("Accept request from:", address)
                  }
                  onRejectRequest={(address) =>
                    console.log("Reject request from:", address)
                  }
                  onChallenge={(address, game) =>
                    console.log("Challenge:", address, "to", game)
                  }
                  onOpenChat={(address) => {
                    console.log("Open chat with:", address);
                    setShowChat(true);
                    setChatMinimized(false);
                  }}
                  onSpectate={(address) =>
                    console.log("Spectate game of:", address)
                  }
                />
              </div>
            </TabsContent>

            {/* Spectate Tab */}
            <TabsContent value="spectate" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <SpectateList
                  onSpectate={(roomId) =>
                    console.log("Start spectating room:", roomId)
                  }
                />
              </div>

              {/* Spectating Tips */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-pixel text-sm text-primary mb-2">
                  Spectator Mode Tips
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    <Eye className="inline w-3 h-3 mr-1" />
                    Watch live games without affecting gameplay
                  </li>
                  <li>
                    <MessageSquare className="inline w-3 h-3 mr-1" />
                    Use spectator chat to discuss with other viewers
                  </li>
                  <li>
                    <Swords className="inline w-3 h-3 mr-1" />
                    Challenge the winner after the match ends
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Swords className="w-6 h-6 text-neon-pink" />
                  <div>
                    <h3 className="font-pixel text-lg text-primary">
                      Game Challenges
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pending and recent challenges
                    </p>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingChallenges && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}

                {/* Not Connected State */}
                {!isConnected && !isLoadingChallenges && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Connect wallet to view challenges</p>
                    <p className="text-sm">
                      Connect to Linera blockchain to access challenges
                    </p>
                  </div>
                )}

                {/* Incoming Challenges */}
                {isConnected && !isLoadingChallenges && (
                  <div className="space-y-4">
                    <h4 className="text-sm text-muted-foreground uppercase tracking-wider">
                      Incoming ({incomingChallenges.length})
                    </h4>
                    {incomingChallenges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No pending challenges</p>
                        <p className="text-sm">
                          Challenge a friend from the Friends tab!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {incomingChallenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex items-center justify-between p-3 bg-neon-pink/10 border border-neon-pink/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Swords className="w-5 h-5 text-neon-pink" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {challenge.fromUsername}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {challenge.gameType}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="neon-green"
                                size="sm"
                                onClick={() => handleAcceptChallenge(challenge.id)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeclineChallenge(challenge.id)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Outgoing Challenges */}
                {isConnected && !isLoadingChallenges && (
                  <div className="space-y-4 mt-8">
                    <h4 className="text-sm text-muted-foreground uppercase tracking-wider">
                      Outgoing ({outgoingChallenges.length})
                    </h4>
                    {outgoingChallenges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No active challenges</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {outgoingChallenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Swords className="w-5 h-5 text-neon-cyan" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {challenge.fromUsername}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {challenge.gameType} - Pending
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Challenge History */}
                <div className="space-y-4 mt-8">
                  <h4 className="text-sm text-muted-foreground uppercase tracking-wider">
                    Recent History
                  </h4>
                  <div className="space-y-2">
                    {[
                      {
                        opponent: "CryptoGamer",
                        game: "Tic-Tac-Toe",
                        result: "won",
                        time: "2h ago",
                      },
                      {
                        opponent: "NeonMaster",
                        game: "Snake",
                        result: "lost",
                        time: "5h ago",
                      },
                      {
                        opponent: "PixelPro",
                        game: "UNO",
                        result: "won",
                        time: "1d ago",
                      },
                    ].map((challenge, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              challenge.result === "won"
                                ? "bg-neon-green/20 text-neon-green"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {challenge.result === "won" ? "W" : "L"}
                          </div>
                          <div>
                            <p className="text-foreground">
                              vs {challenge.opponent}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {challenge.game}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {challenge.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized(!chatMinimized)}
          onClose={() => setShowChat(false)}
          onSendMessage={(msg) => console.log("Send message:", msg)}
          onSendEmote={(emote) => console.log("Send emote:", emote)}
        />
      )}

      {/* Chat Button (when chat is closed) */}
      {!showChat && (
        <ChatButton unreadCount={0} onClick={() => setShowChat(true)} />
      )}
    </div>
  );
}
