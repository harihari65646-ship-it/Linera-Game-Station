import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lineraClient } from "@/lib/linera/client";
import { useLinera } from "@/contexts/LineraProvider";
import { Users, Plus, LogIn, Loader2 } from "lucide-react";
import type { MultiplayerGameRoom } from "@/lib/linera/types";

interface MultiplayerLobbyProps {
  gameType: 'TicTacToe' | 'SnakeLadders' | 'Uno';
  onJoinRoom: (roomId: string) => void;
}

export function MultiplayerLobby({ gameType, onJoinRoom }: MultiplayerLobbyProps) {
  const { address, isConnected } = useLinera();
  const [rooms, setRooms] = useState<MultiplayerGameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!isConnected) return;

      try {
        const gameTypeLower = gameType.toLowerCase();
        const activeRooms = await lineraClient.getMultiplayerRooms(gameTypeLower);

        const waitingRooms = activeRooms.filter(r => r.status === 'Waiting');
        setRooms(waitingRooms);
        setError(null);
      } catch (err) {
        console.error('[MultiplayerLobby] Failed to fetch rooms:', err);
        setError('Failed to load rooms');
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [isConnected, gameType]);

  const createRoom = async () => {
    if (!isConnected) {
      setError('Not connected to blockchain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const maxPlayers = gameType === 'TicTacToe' ? 2 : 4;
      const gameTypeLower = gameType.toLowerCase();
      const roomId = await lineraClient.createMultiplayerRoom(gameTypeLower, maxPlayers);

      if (roomId) {
        console.info('[MultiplayerLobby] Room created:', roomId);
        onJoinRoom(roomId);
      } else {
        setError('Failed to create room');
      }
    } catch (err) {
      console.error('[MultiplayerLobby] Error creating room:', err);
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!isConnected) {
      setError('Not connected to blockchain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await lineraClient.joinMultiplayerRoom(roomId);
      if (success) {
        console.info('[MultiplayerLobby] Joined room:', roomId);
        onJoinRoom(roomId);
      } else {
        setError('Failed to join room');
      }
    } catch (err) {
      console.error('[MultiplayerLobby] Error joining room:', err);
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-pixel text-lg text-primary flex items-center gap-2">
          <Users className="w-5 h-5" />
          Multiplayer Lobby
        </h3>
        <Button
          onClick={createRoom}
          disabled={loading || !isConnected}
          variant="neon"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create Room
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!isConnected && (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Connect your wallet to see available rooms</p>
        </div>
      )}

      {isConnected && (
        <div className="space-y-2">
          {rooms.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No rooms available</p>
              <p className="text-sm text-muted-foreground">Create one to start playing!</p>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.roomId}
                className="flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      Room by {truncateAddress(room.creator)}
                    </p>
                    {room.creator === address && (
                      <span className="text-xs px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded-full">
                        Your Room
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.players.length}/{room.maxPlayers} players
                    </span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {room.status}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => joinRoom(room.roomId)}
                  disabled={loading || room.players.includes(address || '')}
                  variant="neon-green"
                  className="gap-2 ml-4"
                >
                  {room.players.includes(address || '') ? (
                    'Joined'
                  ) : (
                    <>
                      <LogIn className="w-3 h-3" />
                      Join
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {isConnected && address && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Your address: {truncateAddress(address)}
          </p>
        </div>
      )}
    </Card>
  );
}
