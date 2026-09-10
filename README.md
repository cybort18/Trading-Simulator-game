# CryptoOS 98

> **Windows 98 Nostalgia Meets High-Stakes Crypto Futures Trading.**  
> A zero-risk cryptocurrency perpetual futures simulator powered by live Binance market data streams and wrapped in an authentic late-1990s desktop operating system interface.

---

## Highlights & Features

- **Live Market Data Feeds:** Real-time multi-pair streaming (`BTC/USDT`, `ETH/USDT`, `SOL/USDT`) multiplexed via Binance WebSockets (`@ticker`, `@kline_1m`, `@markPrice@1s`) with tick batching and exponential-backoff fallback hydration.
- **Authentic Windows 98 Skeuomorphism:** Pixel-accurate bevels (`.win-outset`, `.win-inset`, `.win-inset-deep`), classic titlebars with optical navy gradients, movable window manager with high-refresh-rate `requestAnimationFrame` debouncing, and a functional 36px retro taskbar.
- **Institutional-Grade Simulation Math:** Real-time calculation of Notional Value, Initial Margin, Maintenance Margin, Unrealized/Realized PnL, ROE %, and exact Isolated & Cross Margin Liquidation Prices ($P_{\text{liq}}$) with non-linear slippage and taker/maker fee modeling.
- **Reactive Liquidation Engine:** Zero-delay scanner that monitors live price breaches and triggers authentic retro Critical Error crash dialogs, complete with emergency faucet relief.
- **Procedural Web Audio Engine:** Zero external audio dependencies—all sound effects (mechanical keyboard clicks, order execution chimes, leverage alerts, and CRT degauss glass crashes) are synthesized procedurally via the native Web Audio API.
- **Viral Social Flex Cards:** Export trade results directly to custom 600x380 CRT social cards (Cyber Green, Blood Red, Gold Whale) with direct clipboard copy, image download, and Twitter/X share intent.
- **Cryptographic Anti-Tamper Protection:** Synchronous SHA-256 state seal and envelope verification preventing local storage manipulation, guarded by an authentic Windows 98 Blue Screen of Death (BSOD) recovery system.

---

## Technical Architecture

CryptoOS 98 is engineered as a modular, high-performance client-side application built with modern web technologies:

```
src/
├── components/
│   ├── common/           # Pixel icons, button bevels, retro dialogs
│   ├── desktop/          # Desktop canvas, WindowFrame, Taskbar, StartMenu
│   ├── modals/           # WelcomeModal, LiquidationModal, BSODModal
│   ├── trading/          # TradingView Lightweight Charts & CRT wrappers
│   └── windows/          # TurboTrade, DegenVault, Leaderboard, FlexCard
├── services/
│   ├── BinanceWsService.ts      # WebSocket connection multiplexer & tick buffer
│   ├── LiquidationEngine.ts     # Real-time portfolio liquidation scanner
│   ├── FundingRateEngine.ts     # 8-hour funding rate settlement clock
│   ├── DailyClaimManager.ts     # 7-day retention streak and stipend manager
│   └── SoundFXService.ts        # Procedural Web Audio API sound synthesizer
├── stores/
│   ├── useMarketDataStore.ts    # Ticker, mark price, and kline telemetry
│   ├── useTradingStore.ts       # Positions, order execution, and trade ledger
│   ├── useWalletStore.ts        # Collateral equity, available margin, and faucet
│   └── useWindowStore.ts        # Window positions, z-indexes, and focus lifecycle
└── utils/
    ├── simulationMath.ts        # Pure, deterministic perpetual futures math
    ├── security.ts              # Anti-tamper state canonicalization and SHA-256
    └── safeStorage.ts           # Tamper-protected fallback storage adapter
```

---

## Core Financial & Simulation Logic

Perpetual futures contracts are calculated using pure deterministic formulas:

- **Notional Exposure ($V$):**
  $$V = \text{Initial Margin} \times \text{Leverage}$$
- **Contract Size ($Q$):**
  $$Q = \frac{V}{P_{\text{entry}}}$$
- **Unrealized PnL ($uPnL$):**
  $$\text{Long: } Q \times (P_{\text{mark}} - P_{\text{entry}}) \quad\vert\quad \text{Short: } Q \times (P_{\text{entry}} - P_{\text{mark}})$$
- **Isolated Liquidation Price ($P_{\text{liq}}$):**
  $$\text{Long: } \frac{P_{\text{entry}} \times Q - IM}{Q \times (1 - MMR - F_{\text{taker}})} \quad\vert\quad \text{Short: } \frac{P_{\text{entry}} \times Q + IM}{Q \times (1 + MMR + F_{\text{taker}})}$$
- **Cross Margin Portfolio Evaluation:**
  Evaluates aggregate equity against the total maintenance margin requirement across all active cross positions simultaneously.

---

## Tech Stack

| Domain | Technology |
|---|---|
| **UI Framework** | React 18, TypeScript (Strict Mode) |
| **Build & Tooling** | Vite 5 |
| **Styling & Skeuomorphism** | Tailwind CSS v3 (0px border-radius, optical bevel utilities) |
| **State Management** | Zustand 4 with custom anti-tamper persistence |
| **Chart Rendering** | TradingView Lightweight Charts (v5) inside CRT container |
| **Audio Engine** | Native Web Audio API (zero external audio files) |
| **Image Generation** | `html-to-image` for canvas flex card rendering |
| **Unit Testing** | Vitest 2.1 |

---

## Local Development & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/cybort18/Trading-Simulator-game.git
cd Trading-Simulator-game

# 2. Install dependencies
npm install

# 3. Run the automated test suite
npm run test

# 4. Start local development server
npm run dev
```

The application will be accessible at: `http://localhost:3000/`

### Production Build

To build the optimized production distribution:
```bash
npm run build
```
