# CryptoOS 98 - Retro Crypto Futures Trading Simulator

> **Windows 98 Nostalgia Meets High-Stakes Crypto Futures Trading.**  
> A zero-risk cryptocurrency perpetual futures simulator powered by live Binance market data streams and wrapped in an authentic late-1990s desktop operating system interface.

---

## Architectural Documentation Foundation

This project is built upon five foundational engineering specifications and design documents:

1. **[`PRD.md`](./PRD.md) (Product Requirements Document):**  
   Product vision, target personas (*Degen Dan*, *Calculated Cara*, *Nostalgic Nate*), retention psychology, 10.00 USDT virtual starter stipend, 7-day tiered daily claim ladder (2, 5, 8, 10..50 USDT), and social flex card virality.
2. **[`ARCHITECTURE.md`](./ARCHITECTURE.md) (Technical Architecture):**  
   Vite + React 18 + TypeScript (Strict Mode) + Zustand + Lightweight Charts, Binance WebSocket multiplexing pipeline, ASCII order and liquidation data flows, window z-index layer stack, and anti-tamper cryptographic storage.
3. **[`SIMULATION_ENGINE.md`](./SIMULATION_ENGINE.md) (Trading & Mathematical Logic):**  
   Exact mathematical financial derivations: Initial Margin, Maintenance Margin, Unrealized/Realized PnL, ROE %, liquidation price ($P_{\text{liq}}$ for isolated and cross margin in both long and short directions), simulated 8-hour funding rates, and complete numerical walkthroughs for a 10 USDT account trading BTC at 20x leverage.
4. **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (Design Tokens & 3D Bevel Guide):**  
   Design tokens extracted from Stitch MCP: `#008080` (Teal), `#C0C0C0` (Silver), `#000080` to `#1084D0` (Active Titlebar Navy Gradient), `#121212` (CRT Black), `#00FF66` (Phosphor Green), `#FF3333` (CRT Red), optical bevel CSS utilities (`.win-outset`, `.win-inset`, `.win-inset-deep`, `.win-btn`), and Windows 98 window anatomy.
5. **[`TASK_ROADMAP.md`](./TASK_ROADMAP.md) (Atomic Implementation Roadmap):**  
   Step-by-step phased execution checklist from Phase 1 through Phase 5 with deterministic acceptance criteria, 100% completed.

---

## Project Status: Phase 1 Through Phase 5 Complete (v1.0.0 Production Release)

- [x] **Phase 1: Environment Setup, Tailwind Retro Preset & Window Manager**
  - [x] Initialized Vite + React 18 + TypeScript (`strict: true`) with path alias `@/*`.
  - [x] Configured Tailwind CSS skeuomorphic 98 theme and 3D optical bevel CSS utility classes.
  - [x] Implemented `#008080` Desktop Canvas with interactive desktop icons (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`, `Recycle Bin`).
  - [x] Built fixed 36px Retro Taskbar with classic 4-color **Start** button, active/inactive window task tabs, and System Tray (WS live LED, balance readout, 24h clock, audio mute toggle).
  - [x] Built draggable Window Manager (`WindowFrame.tsx`) with boundary clamping, minimize/maximize/close controls, and active navy gradient titlebars.
  - [x] Implemented centralized reactive multi-window state management via Zustand (`useWindowStore.ts`).

- [x] **Phase 2: Real-Time Binance WebSocket Service & Chart Integration**
  - [x] Implemented singleton `BinanceWsService.ts` multiplexing Binance live feeds (`@ticker`, `@kline_1m`, `@markPrice@1s`).
  - [x] Built exponential backoff reconnection, 15-second heartbeat liveness checks, and fallback REST hydration.
  - [x] Created reactive state store `useMarketDataStore.ts` tracking live prices, 24h ticker metrics, funding rates, and telemetry latency.
  - [x] Integrated TradingView `Lightweight Charts` (v5) inside CRT container `#121212` with retro red/green candlesticks.
  - [x] Added dynamic pair switcher (`BTC/USDT`, `ETH/USDT`, `SOL/USDT`), monospace price banner with flashing tick colors, 8-hour funding countdown, and System Tray status synchronization.

- [x] **Phase 3: Trading & Liquidation Simulation Engine (Unit-Tested)**
  - [x] Developed mathematical core library `simulationMath.ts` implementing exact perpetual futures formulas: Notional Value, Quantity, uPnL, ROE %, Maintenance Margin, Liquidation Price (isolated and cross margin), slippage model, and fees.
  - [x] Created Zustand store `useWalletStore.ts` managing equity, locked margin, fee deduction, realized PnL, win/loss metrics, and emergency faucet bailouts.
  - [x] Created Zustand store `useTradingStore.ts` for order execution (Market/Limit, Long/Short), position lifecycle management, batch PnL recalculations, and trade history.
  - [x] Built high-frequency liquidation scanner `LiquidationEngine.ts` evaluating ticks in real-time and executing forced liquidations when thresholds are breached.
  - [x] Built simulated 8-hour funding rate engine `FundingRateEngine.ts` with precision countdown timers and settlement balance transfers.
  - [x] Created Windows 98 Critical Error crash dialog `LiquidationModal.tsx` featuring emergency bailout faucet access when balance collapses below 1.00 USDT.

- [x] **Phase 4: Window Applications & Interactive Modals**
  - [x] `TurboTradeWindow.tsx`: Full futures terminal featuring Market/Limit order modes, Cross/Isolated margin, discrete leverage slider (1x - 100x), quick size buttons (25%, 50%, 75%, MAX), dynamic pre-trade calculation box, and open positions table with working `Close` and `Share` actions.
  - [x] `DegenVaultWindow.tsx`: Retro trader profile (`Novice Liquidator` -> `Legendary Whale`), XP progression bar, financial ledger CRT readout, and 7-day daily claim ladder.
  - [x] `LeaderboardWindow.tsx`: Top 3 podium showcase, sortable spreadsheet data grid, tournament category filters (All-Time ROI, 24H Gainers, Weekly Cup, Most Liquidated), and pinned sticky row for `YOU`.
  - [x] `WelcomeModal.tsx`: Centered Windows 98 onboarding dialog detailing the 10.00 USDT starter stipend and startup preference persistence.
  - [x] `ShareFlexCardModal.tsx`: Viral 600x380 PnL card generator with 3 CRT themes (Cyber Green, Blood Red, Gold Whale), clipboard PNG copy via `html-to-image`, PNG download, and Twitter/X share intent.

- [x] **Phase 5: Persistence, Gamification, Audio FX & Polish**
  - [x] `DailyClaimManager.ts`: 7-day daily claim engine with 24-hour unlock cooldown and 36-hour grace period streak resets.
  - [x] `security.ts` & `tamperProtectedStorage.ts`: Anti-tamper cryptographic hashing (SHA-256) and envelope verification sealing `CRYPTOOS_98_STATE_V1`.
  - [x] `BSODModal.tsx`: Authentic Windows 98 Blue Screen of Death (BSOD) recovery shield that intercepts and neutralizes fraudulent balances manipulated via DevTools.
  - [x] `SoundFXService.ts`: Procedural Web Audio API synthesizer generating mechanical clicks, confirmation chimes, rising arpeggios, warning beeps, and CRT degauss glass-crash effects without external audio files.
  - [x] `ResolutionGuard.tsx`: Authentic BIOS / MS-DOS hardware detection screen for mobile and tablet viewports with user bypass capability.
  - [x] 100% test pass rate across all unit test suites (70 passed) and clean production build (`tsc && vite build`).

---

## Tech Stack

- **UI Framework:** React 18, TypeScript (Strict Mode)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS v3 (Custom Skeuomorphic Retro Theme, 0px border radius, 3D optical bevels)
- **State Management:** Zustand 4 with custom tamper-protected persistence
- **Charts:** TradingView Lightweight Charts v5
- **Audio:** Native Web Audio API (Zero external MP3/WAV assets)
- **Image Generation:** html-to-image
- **Testing:** Vitest 2.1
- **Icons & Effects:** Lucide Icons, Canvas Confetti
- **Typography:** MS Sans Serif, Tahoma, Courier Prime, Space Grotesk

---

## Local Development & Setup

Ensure that **Node.js (v18+)** and **npm** are installed:

```bash
# 1. Clone repository
git clone https://github.com/cybort18/Trading-Simulator-game.git
cd Trading-Simulator-game

# 2. Install dependencies
npm install

# 3. Run unit test suite
npm run test

# 4. Launch development server
npm run dev
```

Open your browser and navigate to: `http://localhost:3000/`

To produce a production bundle:
```bash
npm run build
```
