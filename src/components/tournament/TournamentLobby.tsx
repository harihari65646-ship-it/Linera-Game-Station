/**
 * Tournament Lobby Component
 *
 * Displays available tournaments, allows creation and joining.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Users,
  Clock,
  Coins,
  Plus,
  ChevronRight,
  Gamepad2,
  Swords,
  Loader2,
} from "lucide-react";
import { lineraClient } from "@/lib/linera/client";
import { useLinera } from "@/contexts/LineraProvider";
import type { Tournament as BlockchainTournament } from "@/lib/linera/types";

type GameType = "snake" | "tictactoe" | "snakeladders" | "uno";

interface Tournament {
  id: string;
  name: string;
  gameType: GameType;
  creator: string;
  maxPlayers: number;
  currentPlayers: string[];
  entryFee: number;
  prizePool: number;
  status: "registration" | "in_progress" | "completed";
  startTime: number;
}

interface TournamentLobbyProps {}

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  snake: <Gamepad2 className="w-5 h-5 text-neon-green" />,
  tictactoe: <Swords className="w-5 h-5 text-neon-cyan" />,
  snakeladders: <Gamepad2 className="w-5 h-5 text-neon-yellow" />,
  uno: <Gamepad2 className="w-5 h-5 text-neon-pink" />,
};

const GAME_NAMES: Record<GameType, string> = {
  snake: "Snake",
  tictactoe: "Tic-Tac-Toe",
  snakeladders: "Snake & Ladders",
  uno: "UNO",
};

export function TournamentLobby({}: TournamentLobbyProps) {
  const { chainId, isConnected } = useLinera();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: "",
    gameType: "tictactoe" as GameType,
    maxPlayers: 8,
    entryFee: 0,
  });
  const [filter, setFilter] = useState<"all" | GameType>("all");

  /**
   * Map blockchain tournament status to UI status
   */
  const mapTournamentStatus = useCallback(
    (blockchainStatus: string): "registration" | "in_progress" | "completed" => {
      switch (blockchainStatus) {
        case "Registration":
          return "registration";
        case "InProgress":
          return "in_progress";
        case "Finished":
          return "completed";
        default:
          return "registration";
      }
    },
    []
  );

  /**
   * Fetch tournaments from blockchain
   */
  const fetchTournaments = useCallback(async () => {
    if (!isConnected) {
      console.warn('[TournamentLobby] Not connected to blockchain');
      return;
    }

    try {
      setIsLoading(true);

      const tournamentsData = await lineraClient.getTournaments();

      const mappedTournaments: Tournament[] = tournamentsData.map(
        (tournament: BlockchainTournament) => ({
          id: tournament.id,
          name: tournament.name,
          gameType: tournament.gameType as GameType,
          creator: tournament.id.slice(0, 10) + "...",
          maxPlayers: tournament.maxPlayers,
          currentPlayers: tournament.players,
          entryFee: 0,
          prizePool: 0,
          status: mapTournamentStatus(tournament.status),
          startTime: Date.now() + 3600000,
        })
      );

      setTournaments(mappedTournaments);
    } catch (error) {
      console.error('[TournamentLobby] Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, mapTournamentStatus]);

  /**
   * Poll for updates every 3 seconds
   */
  useEffect(() => {
    if (!isConnected) return;

    fetchTournaments();

    const interval = setInterval(() => {
      fetchTournaments();
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, fetchTournaments]);

  const filteredTournaments =
    filter === "all"
      ? tournaments
      : tournaments.filter((t) => t.gameType === filter);

  /**
   * Create a new tournament
   */
  const handleCreate = async () => {
    if (!newTournament.name.trim()) return;

    try {
      const tournamentId = await lineraClient.createTournament(
        newTournament.name,
        newTournament.gameType,
        newTournament.maxPlayers
      );

      if (tournamentId) {
        setShowCreateModal(false);
        setNewTournament({
          name: "",
          gameType: "tictactoe",
          maxPlayers: 8,
          entryFee: 0,
        });
        fetchTournaments();
      }
    } catch (error) {
      console.error('[TournamentLobby] Error creating tournament:', error);
    }
  };

  /**
   * Join a tournament
   */
  const handleJoinTournament = async (tournamentId: string) => {
    try {
      const success = await lineraClient.joinTournament(tournamentId);
      if (success) {
        fetchTournaments();
      }
    } catch (error) {
      console.error('[TournamentLobby] Error joining tournament:', error);
    }
  };

  /**
   * Start a tournament (creator only)
   */
  const handleStartTournament = async (tournamentId: string) => {
    try {
      const success = await lineraClient.startTournament(tournamentId);
      if (success) {
        fetchTournaments();
      }
    } catch (error) {
      console.error('[TournamentLobby] Error starting tournament:', error);
    }
  };

  const formatTimeUntil = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff < 0) return "Started";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-neon-yellow" />
          <div>
            <h2 className="font-pixel text-xl text-primary">Tournaments</h2>
            <p className="text-sm text-muted-foreground">
              Compete for glory and prizes
            </p>
          </div>
        </div>
        <Button
          variant="neon"
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Create Tournament
        </Button>
      </div>

      {/* Game Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "neon-purple" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Games
        </Button>
        {(Object.keys(GAME_NAMES) as GameType[]).map((game) => (
          <Button
            key={game}
            variant={filter === game ? "neon-purple" : "outline"}
            size="sm"
            onClick={() => setFilter(game)}
            className="gap-2"
          >
            {GAME_ICONS[game]}
            {GAME_NAMES[game]}
          </Button>
        ))}
      </div>

      {/* Not Connected State */}
      {!isConnected && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Connect wallet to view tournaments</p>
          <p className="text-sm">Connect to Linera blockchain to join competitions</p>
        </div>
      )}

      {/* Tournament List */}
      {isConnected && (
        <div className="space-y-4">
          {isLoading && tournaments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tournaments available</p>
            <p className="text-sm">Be the first to create one!</p>
          </div>
          ) : (
            filteredTournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    {GAME_ICONS[tournament.gameType]}
                  </div>
                  <div>
                    <h3 className="font-pixel text-lg text-primary">
                      {tournament.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tournament.currentPlayers.length}/{tournament.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeUntil(tournament.startTime)}
                      </span>
                      {tournament.prizePool > 0 && (
                        <span className="flex items-center gap-1 text-neon-yellow">
                          <Coins className="w-4 h-4" />
                          {tournament.prizePool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {tournament.status === "registration" && (
                    <>
                      {tournament.currentPlayers.includes(chainId || "") ? (
                        <span className="text-sm text-neon-green font-pixel">
                          Joined
                        </span>
                      ) : (
                        <Button
                          variant="neon-green"
                          size="sm"
                          onClick={() => handleJoinTournament(tournament.id)}
                          disabled={
                            tournament.currentPlayers.length >=
                            tournament.maxPlayers
                          }
                        >
                          {tournament.currentPlayers.length >=
                          tournament.maxPlayers
                            ? "Full"
                            : "Join"}
                        </Button>
                      )}
                    </>
                  )}
                  {tournament.status === "in_progress" && (
                    <span className="text-sm text-neon-yellow font-pixel animate-pulse">
                      In Progress
                    </span>
                  )}
                  {tournament.status === "completed" && (
                    <span className="text-sm text-muted-foreground">
                      Completed
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Player Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (tournament.currentPlayers.length /
                          tournament.maxPlayers) *
                        100
                      }%`,
                    }}
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                  />
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-pixel text-xl text-primary mb-6 text-center">
                Create Tournament
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Tournament Name
                  </label>
                  <Input
                    value={newTournament.name}
                    onChange={(e) =>
                      setNewTournament({ ...newTournament, name: e.target.value })
                    }
                    placeholder="My Awesome Tournament"
                    className="bg-muted"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Game Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(GAME_NAMES) as GameType[]).map((game) => (
                      <Button
                        key={game}
                        variant={
                          newTournament.gameType === game
                            ? "neon-purple"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setNewTournament({ ...newTournament, gameType: game })
                        }
                        className="gap-2"
                      >
                        {GAME_ICONS[game]}
                        {GAME_NAMES[game]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Max Players
                  </label>
                  <div className="flex gap-2">
                    {[4, 8, 16].map((num) => (
                      <Button
                        key={num}
                        variant={
                          newTournament.maxPlayers === num
                            ? "neon-cyan"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setNewTournament({ ...newTournament, maxPlayers: num })
                        }
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="neon-green"
                    onClick={handleCreate}
                    className="flex-1"
                    disabled={!newTournament.name}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
