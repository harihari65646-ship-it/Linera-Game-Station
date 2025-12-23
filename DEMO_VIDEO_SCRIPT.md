# 🎬 LINERA GAME STATION - Demo Video Script
## WaveHack Buildathon Submission

**Duration:** 4-5 minutes  
**Tone:** Confident, technical but accessible, enthusiastic

---

## 🎯 OPENING (0:00 - 0:30)

### [Screen: Landing page with neon arcade UI]

**SCRIPT:**

> "What if blockchain games felt instant? No waiting. No lag. Just pure, real-time gaming.
>
> I'm going to show you **Linera Game Station** - a multiplayer gaming arcade built on Linera microchains.
>
> Traditional blockchains take 12+ seconds per move. That kills gaming. But Linera's microchain architecture gives us **sub-second finality**. That changes everything."

---

## 📊 PROOF OF BLOCKCHAIN (0:30 - 1:15)

### [Screen: Show the Blockchain Activity Indicator in bottom-right]

**SCRIPT:**

> "First, let me prove this is REAL blockchain, not a demo.
>
> See this panel? It's showing **live GraphQL queries** hitting my local Linera node. Every query goes to the blockchain. Every response comes from the blockchain.
>
> *(Point to elements)*
> - Here's the **Chain ID** - that's my Linera microchain
> - Here's the **App ID** - my deployed smart contract  
> - This counter shows **real-time queries** - watch it increase
>
> And in the navbar - 'Local Linera' badge with pulsing indicator. This proves we're connected to a real Linera network."

### [Screen: Open browser DevTools Network tab]

**SCRIPT:**

> "If you open DevTools, you can see every request going to `localhost:9002` - that's the Linera GraphQL service. These aren't mocked. This is real blockchain."

---

## 🏗️ ARCHITECTURE (1:15 - 2:15)

### [Screen: Show architecture diagram or explain verbally]

**SCRIPT:**

> "Let me explain what makes this special architecturally.
>
> **The Problem:** Traditional blockchains have ONE chain. Everyone competes for block space. Games become slow and expensive.
>
> **Linera's Solution:** Microchains. Every user gets their own lightweight chain. Chains run in parallel. No congestion. No gas wars.
>
> **How we use it:**
> 
> 1. **Main Chain** - Stores global state: leaderboards, player profiles, room registry
> 2. **User Chains** - Each player has their own chain for personal data
> 3. **Room Chains** - Each game room can have its own microchain for isolated game state
>
> This is documented in my contract: `game-station`. It handles:
> - Snake score submissions
> - Tic-Tac-Toe moves
> - Room creation with cross-chain messaging
> - Real-time player matching
>
> The contract is written in **Rust** using the Linera SDK. It compiles to WASM and runs on-chain."

---

## 🎮 GAME DEMO (2:15 - 3:30)

### [Screen: Navigate to Tic-Tac-Toe game]

**SCRIPT:**

> "Now let's play some games!
>
> *(Click on Tic-Tac-Toe)*
>
> This is a classic game, but what's special is the blockchain integration.
>
> *(Play a few moves against AI)*
>
> Every move updates the game state. The contract tracks wins, losses, and maintains your statistics on-chain.
>
> *(Show the multiplayer lobby)*
>
> Here's the multiplayer lobby. These rooms are stored ON-CHAIN via GraphQL queries. When I create a room, it calls the `createRoom` mutation on my smart contract.
>
> The room list refreshes automatically - no polling needed. Linera's architecture enables real-time updates."

### [Screen: Quick Snake game demo]

**SCRIPT:**

> "And here's Snake - a fast-paced game that would be IMPOSSIBLE on slow blockchains. Try playing Snake when each move takes 12 seconds to confirm!
>
> *(Play briefly)*
>
> On Linera, the game feels instant because finality IS instant."

---

## 💡 INNOVATION (3:30 - 4:00)

### [Screen: Back to landing page or architecture view]

**SCRIPT:**

> "What's innovative here?
>
> **First:** This proves real-time gaming works on blockchain. We're not waiting for blocks. We're playing.
>
> **Second:** The microchain architecture means this scales linearly. 1,000 players? 1,000 parallel chains. No slowdown.
>
> **Third:** We're using the Linera Web SDK with GraphQL subscriptions for real-time updates. The frontend talks directly to the blockchain - no centralized backend needed.
>
> This is what Web3 gaming SHOULD feel like."

---

## 🗺️ ROADMAP (4:00 - 4:30)

### [Screen: Can show README or just talk]

**SCRIPT:**

> "Where are we going next?
>
> **Wave 5 Goals:**
> - Deploy to Conway Testnet with full wallet integration
> - Add token wagering for competitive matches
> - Implement tournaments with bracket systems
>
> **Future Vision:**
> - AI-powered matchmaking across chains
> - Cross-chain tournaments
> - NFT rewards and achievements
>
> Linera's speed makes ALL of this possible. We're building the fastest arcade on any blockchain."

---

## 🎬 CLOSING (4:30 - 5:00)

### [Screen: Landing page with blockchain indicator visible]

**SCRIPT:**

> "To recap what you just saw:
>
> ✅ Real Linera blockchain connection - not mocked
> ✅ Smart contracts in Rust using Linera SDK
> ✅ Microchain architecture for parallel scalability
> ✅ Real-time GraphQL queries and updates
> ✅ Professional, responsive gaming UI
>
> This is **Linera Game Station**. 
> 
> Real-time. On-chain. Ready to play.
>
> Check out the GitHub repo for setup instructions. Thanks for watching!"

---

## 📝 RECORDING TIPS

### Before Recording:
1. Clear browser cache
2. Make sure `linera net up` is running in WSL
3. Make sure `linera service --port 9002` is running
4. Make sure frontend is running (`npm run dev`)
5. Check blockchain activity indicator is showing queries

### During Recording:
- Speak slowly and clearly
- Let animations complete before moving
- Pause on important UI elements
- Keep DevTools visible when proving blockchain connection
- Be confident and enthusiastic!

### Key Points to Hit:
1. **NOT a mock** - show real blockchain proof
2. **Uses Linera SDK** - mention Rust, WASM, contract compilation
3. **Microchains** - explain why this architecture matters
4. **Real-time** - emphasize sub-second finality
5. **Playable** - actually play the games!

---

## 🎯 JUDGE-WINNING POINTS TO EMPHASIZE

| Category | What to Show | Judge Weight |
|----------|--------------|--------------|
| Working Demo | Games work, blockchain connected | 30% |
| Linera Integration | GraphQL queries, microchains, SDK | 30% |
| Creativity/UX | Neon arcade theme, smooth UI | 20% |
| Scalability | Explain parallel chains | 10% |
| Vision | Roadmap for testnet, wagering | 10% |

---

**Good luck! 🚀🎮**
