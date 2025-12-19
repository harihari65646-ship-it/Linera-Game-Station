# 🎮 Linera Game Station

**The Fastest Game Station in Web3** - Built on Linera blockchain

## 🎯 Features
- **4 Games**: Snake, Tic-Tac-Toe, Snake & Ladders, UNO
- **On-Chain Leaderboards**: Provably fair rankings
- **Real-Time Multiplayer**: Sub-0.5s finality

## 🚀 Quick Start (Demo Mode)
```bash
npm install && npm run dev
```

## 🔗 Production Deployment (Real Blockchain)

### 1. Deploy Smart Contracts
```bash
cd contracts/game-station
cargo build --release --target wasm32-unknown-unknown
linera project publish-and-create --faucet https://faucet.testnet-conway.linera.net
# Save the returned Application ID!
```

### 2. Install Linera Client
```bash
npm install @linera/client
```

### 3. Configure Environment
Create `.env`:
```env
VITE_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net
VITE_LINERA_APP_ID=your_application_id_here
```

### 4. Run
```bash
npm run dev
```

## 📁 Structure
```
├── contracts/game-station/  # Linera Rust contracts
├── src/lib/linera/          # SDK integration
├── src/hooks/               # React hooks
└── src/pages/               # App pages
```

## 📖 Resources
- [Linera Docs](https://linera.dev)
- [Frontend Guide](https://linera.dev/developers/frontend/setup.html)

---
*"Where Nostalgia Meets Web3 Speed"*
