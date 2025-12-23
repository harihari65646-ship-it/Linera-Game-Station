/**
 * Tournament Bracket Component
 *
 * Displays a visual bracket for single-elimination tournaments.
 */

import { motion } from "framer-motion";
import { Trophy, User, Crown } from "lucide-react";

interface TournamentMatch {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  round: number;
  status: "pending" | "in_progress" | "completed";
}

interface TournamentBracketProps {
  tournamentName: string;
  matches: TournamentMatch[];
  currentUserAddress?: string;
  onMatchClick?: (matchId: string) => void;
}

// Demo bracket for display
const DEMO_MATCHES: TournamentMatch[] = [
  // Round 1 (Quarterfinals)
  { id: "m1", player1: "Alice", player2: "Bob", winner: "Alice", round: 1, status: "completed" },
  { id: "m2", player1: "Charlie", player2: "Diana", winner: "Charlie", round: 1, status: "completed" },
  { id: "m3", player1: "Eve", player2: "Frank", winner: "Frank", round: 1, status: "completed" },
  { id: "m4", player1: "Grace", player2: "Henry", winner: null, round: 1, status: "in_progress" },
  // Round 2 (Semifinals)
  { id: "m5", player1: "Alice", player2: "Charlie", winner: null, round: 2, status: "pending" },
  { id: "m6", player1: "Frank", player2: null, winner: null, round: 2, status: "pending" },
  // Round 3 (Finals)
  { id: "m7", player1: null, player2: null, winner: null, round: 3, status: "pending" },
];

export function TournamentBracket({
  tournamentName,
  matches = DEMO_MATCHES,
  currentUserAddress,
  onMatchClick,
}: TournamentBracketProps) {
  // Group matches by round
  const rounds = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  const roundNames = ["", "Quarterfinals", "Semifinals", "Finals", "Champion"];
  const maxRound = Math.max(...Object.keys(rounds).map(Number));

  const getPlayerStyle = (match: TournamentMatch, player: string | null, isPlayer1: boolean) => {
    if (!player) return "text-muted-foreground/50 italic";
    if (match.winner === player) return "text-neon-green font-bold";
    if (match.winner && match.winner !== player) return "text-muted-foreground line-through";
    if (match.status === "in_progress") return "text-neon-yellow animate-pulse";
    return "text-foreground";
  };

  const getBorderStyle = (match: TournamentMatch) => {
    if (match.status === "completed") return "border-neon-green/50";
    if (match.status === "in_progress") return "border-neon-yellow animate-pulse";
    return "border-border";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-neon-yellow" />
        <div>
          <h2 className="font-pixel text-xl text-primary">{tournamentName}</h2>
          <p className="text-sm text-muted-foreground">Tournament Bracket</p>
        </div>
      </div>

      {/* Bracket Visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([round, roundMatches]) => (
              <div key={round} className="flex flex-col">
                {/* Round Label */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    {roundNames[Number(round)] || `Round ${round}`}
                  </p>
                </div>

                {/* Matches */}
                <div
                  className="flex flex-col justify-around flex-1 gap-4"
                  style={{
                    minHeight: `${Math.pow(2, maxRound - Number(round) + 1) * 60}px`,
                  }}
                >
                  {roundMatches.map((match, idx) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`
                        bg-card border rounded-lg p-3 w-48 cursor-pointer
                        hover:bg-muted/50 transition-colors
                        ${getBorderStyle(match)}
                      `}
                      onClick={() => onMatchClick?.(match.id)}
                    >
                      {/* Player 1 */}
                      <div
                        className={`flex items-center gap-2 py-1 ${getPlayerStyle(
                          match,
                          match.player1,
                          true
                        )}`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm truncate">
                          {match.player1 || "TBD"}
                        </span>
                        {match.winner === match.player1 && (
                          <Crown className="w-4 h-4 text-neon-yellow ml-auto" />
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="border-t border-border my-1" />

                      {/* Player 2 */}
                      <div
                        className={`flex items-center gap-2 py-1 ${getPlayerStyle(
                          match,
                          match.player2,
                          false
                        )}`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm truncate">
                          {match.player2 || "TBD"}
                        </span>
                        {match.winner === match.player2 && (
                          <Crown className="w-4 h-4 text-neon-yellow ml-auto" />
                        )}
                      </div>

                      {/* Match Status */}
                      {match.status === "in_progress" && (
                        <div className="text-center mt-2">
                          <span className="text-xs text-neon-yellow font-pixel">
                            LIVE
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

          {/* Champion Display */}
          <div className="flex flex-col">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Champion
              </p>
            </div>
            <div className="flex-1 flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-neon-yellow/20 to-neon-pink/20 border border-neon-yellow/50 rounded-lg p-6 w-48 text-center"
              >
                <Trophy className="w-12 h-12 text-neon-yellow mx-auto mb-3" />
                {rounds[maxRound]?.[0]?.winner ? (
                  <p className="font-pixel text-lg text-neon-yellow">
                    {rounds[maxRound][0].winner}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">TBD</p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-green" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-yellow animate-pulse" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
