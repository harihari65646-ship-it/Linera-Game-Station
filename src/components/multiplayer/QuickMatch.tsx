/**
 * QuickMatch Component
 *
 * Implements auto-matchmaking for games:
 * 1. Searches for waiting rooms in the selected game type
 * 2. Joins an existing waiting room if found
 * 3. Creates a new room and waits if no rooms available
 * 4. Navigates to game when match is ready
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Users, Zap, X } from 'lucide-react';
import { lineraClient } from '@/lib/linera/client';
import { toast } from 'sonner';

interface QuickMatchProps {
  gameType: string;
  maxPlayers?: number;
  onCancel?: () => void;
}

export function QuickMatch({ gameType, maxPlayers = 2, onCancel }: QuickMatchProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'searching' | 'creating' | 'waiting' | 'matched'>('searching');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // FIX #1: Prevent React StrictMode from running matchmaking twice
  const hasStartedRef = useRef(false);

  // FIX #2: Track when navigating to game (vs user canceling)
  // This prevents leaving the room when navigating to the game screen
  const navigatingToGameRef = useRef(false);

  /**
   * Start the matchmaking process
   */
  const startMatchmaking = useCallback(async () => {
    try {
      setStatus('searching');
      setError(null);

      console.log('[QuickMatch] Searching for available rooms...', gameType);

      // Step 1: Get all waiting rooms for this game type
      const rooms = await lineraClient.getMultiplayerRooms(gameType);
      console.log('[QuickMatch] Found rooms:', rooms);

      // Step 2: Find a room that's waiting for players
      // Note: GraphQL returns status as "WAITING" (uppercase)
      const availableRoom = rooms.find(room => {
        const status = room.status?.toUpperCase();
        return status === 'WAITING' && room.players.length < maxPlayers;
      });

      if (availableRoom) {
        // Join existing room (use roomId or id - contract returns 'id')
        const roomIdToJoin = availableRoom.roomId || (availableRoom as any).id;
        console.log('[QuickMatch] Joining existing room:', roomIdToJoin);
        setStatus('creating');

        const success = await lineraClient.joinMultiplayerRoom(roomIdToJoin);

        if (success) {
          console.log('[QuickMatch] Join mutation submitted, verifying...');

          // FIX: Verify the join actually worked by checking if we're in the players list
          // Cross-chain messages can fail silently if the room's chain is inactive (stale room)
          let joinVerified = false;
          // Use Linera Address32 format (64 hex chars) for matching
          const myLineraOwner = lineraClient.lineraOwnerAddress?.toLowerCase() ||
                                 lineraClient.getMyOwnerHex().replace('0x', '').toLowerCase();

          console.log('[QuickMatch] My Linera Owner for matching:', myLineraOwner);

          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
            const room = await lineraClient.getRoom(roomIdToJoin);

            if (room && myLineraOwner) {
              const myIndex = room.players.findIndex(p => {
                const cleaned = p.replace('Address32(', '').replace(')', '').toLowerCase();
                // Exact match with Linera Address32 format
                return cleaned === myLineraOwner;
              });

              if (myIndex >= 0) {
                joinVerified = true;
                console.log('[QuickMatch] Join verified! Player index:', myIndex);
                setRoomId(roomIdToJoin);
                setPlayerCount(room.players.length);

                // Check if room is now full
                if (room.players.length >= maxPlayers) {
                  setStatus('matched');
                  toast.success('Match found! Starting game...');
                  navigatingToGameRef.current = true;
                  setTimeout(() => {
                    navigate(`/games/${gameType}?roomId=${roomIdToJoin}`);
                  }, 1000);
                } else {
                  setStatus('waiting');
                }
                break;
              }
            }
            console.log(`[QuickMatch] Verifying join... attempt ${attempt + 1}/5`);
          }

          if (!joinVerified) {
            // Join didn't work - this is a stale/abandoned room
            console.log('[QuickMatch] Join not verified - room is stale. Creating new room instead...');
            toast.info('Room was inactive. Creating new room...');

            try {
              await lineraClient.leaveMultiplayerRoom(roomIdToJoin);
            } catch (e) {
              console.warn('[QuickMatch] Failed to leave stale room:', e);
            }

            // Fall through to create new room (don't return, continue to else block logic)
            // We'll handle this by creating a new room below
            const newRoomId = await lineraClient.createMultiplayerRoom(gameType, maxPlayers);
            if (newRoomId) {
              console.log('[QuickMatch] New room created:', newRoomId);
              setRoomId(newRoomId);
              setPlayerCount(1);
              setStatus('waiting');
              toast.success('Room created! Waiting for opponent...');
            } else {
              throw new Error('Failed to create room after stale room');
            }
          }
        } else {
          throw new Error('Failed to join room');
        }
      } else {
        // No available rooms - create new one
        console.log('[QuickMatch] No available rooms, creating new room...');
        setStatus('creating');

        const newRoomId = await lineraClient.createMultiplayerRoom(gameType, maxPlayers);

        if (newRoomId) {
          console.log('[QuickMatch] Room created:', newRoomId);
          setRoomId(newRoomId);
          setPlayerCount(1);
          setStatus('waiting');
          toast.success('Room created! Waiting for opponent...');
        } else {
          throw new Error('Failed to create room');
        }
      }
    } catch (err) {
      console.error('[QuickMatch] Matchmaking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Matchmaking failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [gameType, maxPlayers, navigate]);

  /**
   * Poll for room updates when waiting
   */
  useEffect(() => {
    if (status !== 'waiting' || !roomId) return;

    const pollInterval = setInterval(async () => {
      try {
        const room = await lineraClient.getRoom(roomId);

        if (!room) {
          setError('Room not found');
          return;
        }

        setPlayerCount(room.players.length);

        // Check if room is full and ready to play
        if (room.players.length >= maxPlayers) {
          setStatus('matched');
          toast.success('Match ready! Starting game...');

          // FIX #3: Mark that we're navigating to game (don't leave room)
          navigatingToGameRef.current = true;

          // Navigate to game
          setTimeout(() => {
            navigate(`/games/${gameType}?roomId=${roomId}`);
          }, 1000);
        }
      } catch (err) {
        console.error('[QuickMatch] Poll error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [status, roomId, gameType, maxPlayers, navigate]);

  /**
   * Start matchmaking on mount
   * FIX #2: Guard against React StrictMode double-mount
   */
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startMatchmaking();
  }, [startMatchmaking]);

  /**
   * Handle cancel
   * FIX #4: Only leave room if NOT navigating to game
   */
  const handleCancel = async () => {
    // Don't leave room if we're navigating to game
    if (roomId && !navigatingToGameRef.current) {
      try {
        console.log('[QuickMatch] User canceled - leaving room:', roomId);
        await lineraClient.leaveMultiplayerRoom(roomId);
      } catch (err) {
        console.error('[QuickMatch] Failed to leave room:', err);
      }
    }
    onCancel?.();
  };

  /**
   * FIX #5: Cleanup effect - leave room on unmount ONLY if not navigating to game
   * Handles cases like modal close, page navigation away, etc.
   */
  useEffect(() => {
    return () => {
      // Only leave room if we're NOT navigating to the game
      if (roomId && !navigatingToGameRef.current) {
        console.log('[QuickMatch] Component unmounting (not navigating to game) - leaving room:', roomId);
        lineraClient.leaveMultiplayerRoom(roomId).catch(err => {
          console.error('[QuickMatch] Failed to leave room on unmount:', err);
        });
      } else if (roomId && navigatingToGameRef.current) {
        console.log('[QuickMatch] Component unmounting (navigating to game) - staying in room:', roomId);
      }
    };
  }, [roomId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="w-full max-w-md mx-4 p-8 text-center relative">
        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="absolute top-4 right-4"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Status Icon */}
        <div className="mb-6">
          {status === 'matched' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto bg-neon-green/20 rounded-full flex items-center justify-center"
            >
              <Zap className="w-10 h-10 text-neon-green" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center"
            >
              <Loader2 className="w-10 h-10 text-primary" />
            </motion.div>
          )}
        </div>

        {/* Status Text */}
        <div className="space-y-2 mb-6">
          <h2 className="font-pixel text-xl text-foreground">
            {status === 'searching' && 'Searching for Match...'}
            {status === 'creating' && 'Creating Room...'}
            {status === 'waiting' && 'Waiting for Opponent...'}
            {status === 'matched' && 'Match Found!'}
          </h2>

          <p className="text-sm text-muted-foreground">
            {status === 'searching' && 'Looking for available games'}
            {status === 'creating' && 'Setting up your game room'}
            {status === 'waiting' && `Players: ${playerCount}/${maxPlayers}`}
            {status === 'matched' && 'Starting game...'}
          </p>
        </div>

        {/* Room Code (when waiting) */}
        {status === 'waiting' && roomId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-muted/30 rounded-lg border border-border"
          >
            <p className="text-xs text-muted-foreground mb-1">Room Code</p>
            <p className="font-mono text-sm text-foreground">{roomId.slice(0, 16)}...</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                toast.success('Room code copied!');
              }}
              className="mt-2 text-xs"
            >
              Copy Code
            </Button>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Player Icons */}
        <div className="flex justify-center gap-4 mb-6">
          {Array.from({ length: maxPlayers }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                i < playerCount
                  ? 'bg-primary/20 border-primary'
                  : 'bg-muted/20 border-border'
              }`}
            >
              <Users className={`w-6 h-6 ${i < playerCount ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full"
          disabled={status === 'matched'}
        >
          Cancel
        </Button>
      </Card>
    </motion.div>
  );
}
