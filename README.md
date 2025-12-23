# 🎮 Linera Game Station

## The Fastest Web3 Arcade - Built on Linera Microchains

[![Linera](https://img.shields.io/badge/Linera-SDK%200.15.x-cyan?style=for-the-badge)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-Contract-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **Real-time multiplayer arcade games on blockchain. Sub-second finality. No lag. Just play.**

---

## 📺 Demo Video

🎬 **[Watch the Demo Video](YOUR_VIDEO_LINK_HERE)**

---

## 🚀 Quick Start

### One-Command Docker Setup

```bash
docker compose up --build
```

Then open: http://localhost:5174

### Manual Setup (Development)

**Prerequisites:**
- Node.js 18+
- Rust (with wasm32 target)
- WSL2 (Windows) or Linux/macOS

**Step 1: Start Linera Network**
```bash
# In WSL/Linux terminal
linera net up
```

**Step 2: Start Linera Service**
```bash
# Export wallet environment (use paths from linera net up output)
export LINERA_WALLET=/tmp/.tmp*/wallet_0.json
export LINERA_KEYSTORE=/tmp/.tmp*/keystore_0.json
export LINERA_STORAGE='rocksdb:/tmp/.tmp*/client_0.db'

linera service --port 9002
```

**Step 3: Deploy Contracts**
```bash
cd contracts/game-station
cargo build --release --target wasm32-unknown-unknown
linera project publish-and-create
```

**Step 4: Start Frontend**
```bash
npm install
npm run dev
```

**Step 5: Configure Environment**

Create `.env.local`:
```env
VITE_LINERA_APP_ID=<your-app-id>
VITE_LINERA_CHAIN_ID=<your-chain-id>
VITE_LINERA_GRAPHQL_URL=http://localhost:9002/chains/<chain-id>/applications/<app-id>
VITE_LINERA_SERVICE_URL=http://localhost:9002
VITE_LINERA_FAUCET_URL=http://localhost:8080
```

---

## 🎯 What Is This?

**Linera Game Station** is a real-time multiplayer arcade platform built on Linera microchains.

### The Problem

Traditional blockchains are **too slow for gaming**:
- Ethereum: 12+ seconds per block
- Even "fast" L2s: 1-2 seconds

Try playing Tic-Tac-Toe when each move takes 12 seconds. It's unplayable.

### Our Solution

Linera's **microchain architecture** enables:
- ⚡ **Sub-second finality** - moves feel instant
- 🔄 **Parallel chains** - no congestion
- 📈 **Linear scalability** - 1000 players = 1000 chains

We built an arcade that proves **real-time blockchain gaming works**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LINERA GAME STATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   FRONTEND   │    │   LINERA     │    │   GAME       │  │
│  │   (React)    │◄──►│   SERVICE    │◄──►│   STATION    │  │
│  │              │    │   GraphQL    │    │   CONTRACT   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LINERA MICROCHAINS                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Main    │  │ User    │  │ Room    │   ...        │   │
│  │  │ Chain   │  │ Chains  │  │ Chains  │              │   │
│  │  │(global) │  │(players)│  │ (games) │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Smart Contract** | Rust + Linera SDK | Game logic, state management, cross-chain messages |
| **GraphQL Service** | Linera Service | API layer for frontend queries/mutations |
| **Frontend** | React + TypeScript + Vite | Game UI, wallet connect, real-time updates |

### Microchain Design

1. **Main Chain**: Global leaderboards, player registry, room index
2. **User Chains**: Individual player stats, achievements, history
3. **Room Chains**: Per-game isolated state for multiplayer matches

---

## 🎮 Games

### 🐍 Snake
Classic snake game with blockchain-verified high scores.

### ❌⭕ Tic-Tac-Toe
Play against AI or challenge friends in real-time multiplayer.

### 🎲 Snakes & Ladders
Turn-based multiplayer with on-chain dice rolls.

### 🃏 UNO (Coming Soon)
Card game with real-time synchronization across chains.

---

## 💻 Smart Contract

**Location:** `contracts/game-station/`

### Key Features

```rust
// Contract operations
pub enum Operation {
    SubmitSnakeScore { score: u32, game_mode: GameMode },
    SubmitTictactoeResult { won: bool, game_mode: GameMode },
    CreateRoom { game_type: GameType, max_players: i32 },
    JoinRoom { room_id: String },
    MakeMove { room_id: String, move_data: String },
    // ... more operations
}
```

### GraphQL Schema

**Queries:**
```graphql
query {
  activeRooms { id gameType status players }
  userProfile(address: String!) { username wins losses }
  leaderboard(gameType: GameType!, limit: Int) { address score }
  globalStats { totalGames totalPlayers }
}
```

**Mutations:**
```graphql
mutation {
  createRoom(gameType: TIC_TAC_TOE, maxPlayers: 2, entryFee: 0, gameMode: MULTIPLAYER) {
    roomId
  }
  submitSnakeScore(score: 100, gameMode: SOLO) {
    success
    message
  }
}
```

### Linera SDK Usage

- ✅ `linera-sdk` dependency
- ✅ Contract + Service traits
- ✅ Cross-chain messaging via `send_message()`
- ✅ Event streaming via `runtime.emit()`
- ✅ GraphQL schema with async-graphql

---

## 🔴 Live Blockchain Proof

The app includes a **Blockchain Activity Indicator** (bottom-right corner) showing:

| Metric | Description |
|--------|-------------|
| Chain Count | Number of microchains in network |
| Chain ID | Your connected microchain |
| App ID | Deployed smart contract address |
| Query Counter | Real-time GraphQL requests |
| Recent Queries | Live log of blockchain operations |

This proves the frontend is connected to a **real Linera node**, not mocked data.

---



---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Rust, Linera SDK 0.15.x, async-graphql |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| State Management | React Context, TanStack Query |
| Blockchain | Linera Microchains |

---



### Future Vision
- Cross-chain tournaments with microchain isolation
- AI agents for automated matchmaking
- Prediction markets for esports betting
- SDK for third-party games

---

## 👥 Team

| Name | Role | Contact |
|------|------|---------|
| **Your Name** | Full-stack Developer | Discord: `yourname` |

**Wallet Address:** `0x...`

---

## 📄 Changelog

### Wave 5 Submission
- ✅ Complete game-station contract with full GraphQL API
- ✅ React frontend with 4 arcade games
- ✅ Local Linera network integration
- ✅ Real-time blockchain activity indicator
- ✅ Microchain architecture documentation
- ✅ Docker Compose support

---



---

## 📝 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- Linera team for the revolutionary microchain architecture

---

**Built with ⚡ on Linera Microchains**
