# Multiplayer Components - Quick Start Guide

## Overview

This directory contains components for multiplayer game functionality powered by the Linera blockchain.

## Components

### MultiplayerLobby

A lobby component for creating and joining multiplayer game rooms.

#### Usage

```tsx
import { MultiplayerLobby } from "@/components/multiplayer";

function MyGameLobby() {
  const handleJoinRoom = (roomId: string) => {
    console.log("Joined room:", roomId);
    // Navigate to game or set state
  };

  return (
    <MultiplayerLobby
      gameType="TicTacToe"  // or "SnakeLadders" or "Uno"
      onJoinRoom={handleJoinRoom}
    />
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `gameType` | `'TicTacToe' \| 'SnakeLadders' \| 'Uno'` | Type of game for room filtering |
| `onJoinRoom` | `(roomId: string) => void` | Callback when room is joined/created |

#### Features

- Auto-refreshing room list (every 3 seconds)
- Create new rooms
- Join existing rooms
- Shows player count
- Highlights your own rooms
- Connection status indicators
- Error handling

## Integration with Game Components

### TicTacToe Example

```tsx
import { useState } from "react";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";
import { MultiplayerLobby } from "@/components/multiplayer";
import { Button } from "@/components/ui/button";

function TicTacToePage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mode, setMode] = useState<'local' | 'multiplayer'>('local');

  // Multiplayer mode
  if (mode === 'multiplayer') {
    if (!roomId) {
      return (
        <div>
          <Button onClick={() => setMode('local')}>Back to Local</Button>
          <MultiplayerLobby
            gameType="TicTacToe"
            onJoinRoom={setRoomId}
          />
        </div>
      );
    }

    return (
      <div>
        <Button onClick={() => { setRoomId(null); setMode('local'); }}>
          Leave Room
        </Button>
        <TicTacToeGame roomId={roomId} />
      </div>
    );
  }

  // Local mode
  return (
    <div>
      <Button onClick={() => setMode('multiplayer')}>Play Online</Button>
      <TicTacToeGame />
    </div>
  );
}
```

### SnakeLadders Example

```tsx
import { useState } from "react";
import { SnakeLaddersGame } from "@/components/games/SnakeLaddersGame";
import { MultiplayerLobby } from "@/components/multiplayer";

function SnakeLaddersPage() {
  const [roomId, setRoomId] = useState<string | null>(null);

  if (!roomId) {
    return (
      <MultiplayerLobby
        gameType="SnakeLadders"
        onJoinRoom={setRoomId}
      />
    );
  }

  return (
    <div>
      <button onClick={() => setRoomId(null)}>Back to Lobby</button>
      <SnakeLaddersGame roomId={roomId} />
    </div>
  );
}
```

## How It Works

### 1. Room Creation
```typescript
const roomId = await lineraClient.createMultiplayerRoom(gameType, maxPlayers);
```

### 2. Room Joining
```typescript
const success = await lineraClient.joinMultiplayerRoom(roomId);
```

### 3. Game State Sync (Automatic)

When a game component receives a `roomId` prop, it:
1. Polls room state every 1 second via `lineraClient.getRoom(roomId)`
2. Parses the `gameState` JSON field
3. Updates local UI to match blockchain state
4. Determines whose turn it is from `room.currentTurn`

### 4. Move Submission
```typescript
// TicTacToe
await lineraClient.makeGameMove(roomId, cellIndex.toString());

// SnakeLadders
await lineraClient.makeGameMove(roomId, "roll");
```

## Room State Structure

```typescript
interface MultiplayerGameRoom {
  roomId: string;
  gameType: string;           // "tictactoe", "snakeladders", etc.
  creator: string;            // Blockchain address
  players: string[];          // Array of player addresses
  maxPlayers: number;         // 2 for TicTacToe, 4 for others
  status: 'Waiting' | 'Playing' | 'Finished' | 'Abandoned';
  currentTurn: number;        // Index into players array
  gameState: string;          // JSON string (format depends on game)
  winner: string | null;      // Winner's address (if finished)
  lastMoveAt: number;         // Timestamp
}
```

## Game State Formats

### TicTacToe
```json
{
  "cells": ["X", null, "O", "X", null, null, null, "O", null]
}
```

### SnakeLadders
```json
{
  "positions": [0, 15, 42, 8],
  "lastDiceRoll": 6
}
```

## Requirements

- Must be wrapped in `<LineraProvider>`
- User must be connected to blockchain
- Valid Linera application ID configured

## Error Handling

All components handle:
- Connection failures
- Room not found
- Invalid game state
- Network timeouts
- Permission errors

Errors are displayed inline with user-friendly messages.

## Styling

Components use the app's design system:
- `@/components/ui/button`
- `@/components/ui/card`
- Tailwind CSS classes
- Neon theme colors

## Best Practices

1. **Cleanup**: Game components automatically stop polling when unmounted
2. **Error Display**: Always show error messages to users
3. **Loading States**: Disable buttons during async operations
4. **Turn Validation**: UI prevents invalid moves
5. **Connection Status**: Show online/offline indicators

## Troubleshooting

### Room list is empty
- Check blockchain connection
- Verify game type string matches (lowercase)
- Ensure other players have created rooms

### Can't join room
- Room might be full
- Network issues
- Already in the room

### Moves not syncing
- Check console for error messages
- Verify polling is active
- Check blockchain connection

### Turn indicator wrong
- Verify `room.currentTurn` calculation
- Check player index in `room.players` array
- Ensure address matches

## Advanced Usage

### Custom Styling

```tsx
<MultiplayerLobby
  gameType="TicTacToe"
  onJoinRoom={handleJoin}
  // Wrap in custom container for styling
/>
```

### Conditional Rendering

```tsx
{isConnected ? (
  <MultiplayerLobby gameType="TicTacToe" onJoinRoom={handleJoin} />
) : (
  <p>Please connect your wallet</p>
)}
```

### With Routing

```tsx
import { useNavigate } from "react-router-dom";

function Lobby() {
  const navigate = useNavigate();

  return (
    <MultiplayerLobby
      gameType="TicTacToe"
      onJoinRoom={(roomId) => navigate(`/game/${roomId}`)}
    />
  );
}
```

## Additional Resources

- Linera Client API: `src/lib/linera/client.ts`
- Type Definitions: `src/lib/linera/types.ts`
- Game Components: `src/components/games/`
- Full Documentation: `MULTIPLAYER_UPDATE.md`
