/**
 * Tournaments Page
 *
 * Hub for tournament browsing, creation, and bracket viewing.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, History, Crown } from "lucide-react";
import { TournamentLobby } from "@/components/tournament/TournamentLobby";
import { TournamentBracket } from "@/components/tournament/TournamentBracket";

// Demo active tournament for bracket display
const DEMO_BRACKET_MATCHES = [
  // Round 1 (Quarterfinals)
  {
    id: "m1",
    player1: "CryptoGamer",
    player2: "NeonMaster",
    winner: "CryptoGamer",
    round: 1,
    status: "completed" as const,
  },
  {
    id: "m2",
    player1: "PixelPro",
    player2: "ChainChamp",
    winner: "ChainChamp",
    round: 1,
    status: "completed" as const,
  },
  {
    id: "m3",
    player1: "ArcadeKing",
    player2: "BlockBoss",
    winner: null,
    round: 1,
    status: "in_progress" as const,
  },
  {
    id: "m4",
    player1: "TokenTitan",
    player2: "GameGuru",
    winner: null,
    round: 1,
    status: "pending" as const,
  },
  // Round 2 (Semifinals)
  {
    id: "m5",
    player1: "CryptoGamer",
    player2: "ChainChamp",
    winner: null,
    round: 2,
    status: "pending" as const,
  },
  {
    id: "m6",
    player1: null,
    player2: null,
    winner: null,
    round: 2,
    status: "pending" as const,
  },
  // Round 3 (Finals)
  {
    id: "m7",
    player1: null,
    player2: null,
    winner: null,
    round: 3,
    status: "pending" as const,
  },
];

// Demo past tournaments
const PAST_TOURNAMENTS = [
  {
    id: "pt1",
    name: "Weekly Snake Championship #12",
    gameType: "snake",
    winner: "CryptoGamer",
    participants: 16,
    date: "Dec 15, 2024",
  },
  {
    id: "pt2",
    name: "TicTacToe Masters",
    gameType: "tictactoe",
    winner: "NeonMaster",
    participants: 8,
    date: "Dec 10, 2024",
  },
  {
    id: "pt3",
    name: "UNO Showdown",
    gameType: "uno",
    winner: "PixelPro",
    participants: 8,
    date: "Dec 5, 2024",
  },
];

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null
  );

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Trophy className="w-12 h-12 text-neon-yellow mx-auto mb-4" />
          <h1 className="font-pixel text-3xl md:text-4xl text-primary mb-2">
            Tournaments
          </h1>
          <p className="text-muted-foreground">
            Compete for glory and climb the ranks
          </p>
        </motion.div>

        {/* Tournament Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Active Tournaments", value: "3", color: "text-neon-green" },
            { label: "Players Online", value: "47", color: "text-neon-cyan" },
            { label: "Your Wins", value: "12", color: "text-neon-yellow" },
            { label: "Your Rank", value: "#42", color: "text-neon-pink" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <p className={`font-pixel text-2xl ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="browse" className="gap-2 font-pixel text-sm">
                <Trophy className="w-4 h-4" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2 font-pixel text-sm">
                <Calendar className="w-4 h-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 font-pixel text-sm">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Browse Tournaments Tab */}
            <TabsContent value="browse" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <TournamentLobby
                  onCreateTournament={(data) =>
                    console.log("Create tournament:", data)
                  }
                  onJoinTournament={(id) =>
                    console.log("Join tournament:", id)
                  }
                />
              </div>
            </TabsContent>

            {/* Active Tournament Tab */}
            <TabsContent value="active" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                {/* Current active tournament */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neon-yellow/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-neon-yellow" />
                    </div>
                    <div>
                      <h3 className="font-pixel text-lg text-primary">
                        TicTacToe Showdown
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        8 players • Round 1 in progress
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-neon-green/20 text-neon-green rounded-full text-xs font-pixel">
                    LIVE
                  </span>
                </div>

                <TournamentBracket
                  tournamentName="TicTacToe Showdown"
                  matches={DEMO_BRACKET_MATCHES}
                  onMatchClick={(matchId) =>
                    console.log("View match:", matchId)
                  }
                />
              </div>

              {/* Your upcoming matches */}
              <div className="bg-muted/30 rounded-xl p-4">
                <h3 className="font-pixel text-sm text-primary mb-3">
                  Your Upcoming Matches
                </h3>
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold">
                      R2
                    </div>
                    <div>
                      <p className="text-foreground">Semifinals</p>
                      <p className="text-xs text-muted-foreground">
                        vs TBD • Waiting for Round 1
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Starts when ready
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* Tournament History Tab */}
            <TabsContent value="history" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <h3 className="font-pixel text-lg text-primary">
                      Past Tournaments
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      View completed tournament results
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {PAST_TOURNAMENTS.map((tournament) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTournament(tournament.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neon-yellow/10 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-neon-yellow" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {tournament.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tournament.participants} players • {tournament.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-neon-yellow font-pixel">
                          Winner
                        </p>
                        <p className="text-foreground">{tournament.winner}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Your tournament stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-pixel text-neon-green">5</p>
                  <p className="text-xs text-muted-foreground">
                    Tournaments Won
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-pixel text-neon-cyan">24</p>
                  <p className="text-xs text-muted-foreground">
                    Matches Played
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-pixel text-neon-pink">67%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Selected Tournament Modal */}
        <AnimatePresence>
          {selectedTournament && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTournament(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-neon-yellow" />
                    <div>
                      <h3 className="font-pixel text-xl text-primary">
                        {PAST_TOURNAMENTS.find((t) => t.id === selectedTournament)
                          ?.name || "Tournament"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Completed Tournament
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTournament(null)}
                  >
                    Close
                  </Button>
                </div>

                <TournamentBracket
                  tournamentName=""
                  matches={DEMO_BRACKET_MATCHES.map((m) => ({
                    ...m,
                    status: "completed" as const,
                    winner:
                      m.round === 3
                        ? "CryptoGamer"
                        : m.winner || m.player1 || null,
                  }))}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
