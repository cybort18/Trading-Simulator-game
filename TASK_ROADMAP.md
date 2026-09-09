# Atomic Implementation Task Roadmap
## CryptoOS 98 — Retro Crypto Futures Trading Simulator
**Document Version:** 1.0.0  
**Status:** Approved for Engineering Execution  
**Methodology:** Phased Atomic Deliverables with Deterministic Acceptance Criteria  
**Author:** Autonomous Principal Software Architect & Product Systems Engineer  

---

## Overview & Execution Strategy
This roadmap outlines the complete sequence of engineering deliverables required to take CryptoOS 98 from raw architecture to a feature-complete, production-ready web application. Every task is specified as an atomic item `- [ ]` containing explicit deliverables and verification criteria.

---

## Phase 1: Environment Setup, Tailwind Retro Preset & Window Manager

- [x] **1.1 Initialize Project Skeleton & Dependencies**
  - Deliverable: Next.js 14 / Vite project scaffolded with TypeScript strict mode, Tailwind CSS, Lucide / Material Symbols icons, and Zustand.
  - Acceptance Criteria: `npm run dev` boots cleanly with zero console warnings; root viewport configured to fixed `100vw` x `100vh` non-scrolling layout.

- [x] **1.2 Configure Tailwind Skeuomorphic Retro 98 Extension**
  - Deliverable: `tailwind.config.js` and `globals.css` populated with all extracted tokens from `DESIGN_SYSTEM.md` (`#008080` teal, `#C0C0C0` silver, `#000080` to `#1084D0` gradients, `#121212` CRT black, `#00FF66` phosphor green, `#FF3333` CRT red).
  - Acceptance Criteria: Optical bevel classes (`.win-outset`, `.win-inset`, `.win-inset-deep`, `.win-btn`, `.win-btn-pressed`) and `.crt-grid` render exact 90s box-shadows and borders.

- [x] **1.3 Create Desktop Canvas & Background Icon Grid**
  - Deliverable: React component `DesktopCanvas.tsx` with fixed `#008080` background, holding interactive desktop icons (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`, `Recycle Bin`).
  - Acceptance Criteria: Icons support single-click selection (dotted border) and double-click / click launch action with icon label drop shadows.

- [x] **1.4 Implement Retro Taskbar & Start Menu**
  - Deliverable: `Taskbar.tsx` component fixed at viewport bottom (`height: 36px`).
  - Acceptance Criteria: Includes 4-color pixel Start button, opened window tabs synchronized with `WindowStore`, and sunken system tray showing WS status LED, quick balance, and live 24-hour clock.

- [x] **1.5 Build Draggable Window Manager Framework (`WindowFrame.tsx`)**
  - Deliverable: Window component wrapper supporting titlebar drag, minimize to taskbar, maximize/restore, close, and dynamic z-index stacking.
  - Acceptance Criteria: Dragging constrained within desktop bounds ($Y \ge 0$, $Y \le \text{viewportHeight} - 36$); clicking any part of a window elevates it to top z-index and switches titlebar to active navy blue gradient.

- [x] **1.6 Create Zustand Window Store (`useWindowStore.ts`)**
  - Deliverable: Centralized state store managing window metadata: `{ id, title, icon, isOpen, isMinimized, isMaximized, position, size, zIndex }`.
  - Acceptance Criteria: Supports actions `openWindow`, `closeWindow`, `minimizeWindow`, `maximizeWindow`, and `focusWindow` with zero state race conditions.

---

## Phase 2: Real-Time Binance WebSocket Service & Chart Integration

- [x] **2.1 Build Binance Multiplexed WebSocket Client (`BinanceWsService.ts`)**
  - Deliverable: WebSocket singleton connecting to `wss://fstream.binance.com/stream` with subscriptions for BTC, ETH, and SOL `@ticker`, `@kline_1m`, and `@markPrice@1s`.
  - Acceptance Criteria: Handles incoming raw payloads, parses numeric strings to floating-point numbers, and dispatches to `MarketDataStore`.

- [x] **2.2 Implement Reconnection Backoff & Heartbeat Telemetry**
  - Deliverable: Automatic heartbeat detector pinging every 15s, paired with exponential backoff reconnect logic (1s, 2s, 4s, up to 30s) and fallback REST polling.
  - Acceptance Criteria: System Tray reflects connection status in real-time (`WS LIVE ●` in green vs `WS RECONNECTING...` in amber) and displays live latency (ms).

- [x] **2.3 Create Market Data Zustand Store (`useMarketDataStore.ts`)**
  - Deliverable: Reactive store tracking current selected pair, real-time mark prices, 24h ticker metrics, and latest candlestick updates.
  - Acceptance Criteria: Changing active pair unsubscribes previous streams and binds new pair data within <300ms.

- [x] **2.4 Integrate TradingView Lightweight Charts in `TurboTrade.exe`**
  - Deliverable: Interactive candlestick chart component inside `TurboTrade.exe` styled with retro CRT dark palette (`#121212` canvas, green candles `#00FF66`, red candles `#FF3333`, zero border radius).
  - Acceptance Criteria: Historical 1m klines pre-loaded via Binance REST API (`/fapi/v1/klines`), streaming live updates via WebSocket at 60 FPS.

- [x] **2.5 Build Market Selector & 24H Metric Card (Left Panel)**
  - Deliverable: Left panel component for `TurboTrade.exe` featuring pair selector buttons (BTC, ETH, SOL), large monospace price readout, 24h high/low, and simulated 8-hour funding rate countdown.
  - Acceptance Criteria: Live price flashes green/red on tick updates; 24h change badge updates dynamically.

---

## Phase 3: Trading & Liquidation Simulation Engine (Unit-Tested)

- [x] **3.1 Implement Math Core Library (`simulationMath.ts`)**
  - Deliverable: Pure functional implementations of formulas from `SIMULATION_ENGINE.md`:
    - `calculateNotionalValue(margin, leverage)`
    - `calculateQuantity(margin, leverage, price)`
    - `calculateUnrealizedPnl(entryPrice, markPrice, quantity, direction)`
    - `calculateRoe(unrealizedPnl, initialMargin)`
    - `calculateMaintenanceMargin(quantity, markPrice, mmr)`
    - `calculateLiquidationPrice(entryPrice, quantity, initialMargin, leverage, mmr, takerFee, direction, marginMode, totalEquity)`
  - Acceptance Criteria: 100% test coverage using Vitest/Jest matching worked numerical examples to within 4 decimal places.

- [x] **3.2 Build Order Execution Engine (`TradingEngine.ts`)**
  - Deliverable: Execution logic handling Market and Limit orders, Long and Short directions, Isolated and Cross margin modes.
  - Acceptance Criteria: Rejects orders exceeding `availableMargin`; deducts initial margin and 0.05% taker fee; appends new position to `TradingStore`.

- [x] **3.3 Implement High-Frequency Liquidation Scanner Loop**
  - Deliverable: Reactive tick evaluation callback triggering on every Binance mark price update.
  - Acceptance Criteria: Checks active positions against $P_{\text{liq}}$; executes forced closure the instant Mark Price breaches threshold; transfers position to history marked `LIQUIDATED`.

- [x] **3.4 Implement Simulated Funding Rate Engine**
  - Deliverable: Periodic timer simulating funding rate transfers every 8 hours (00:00, 08:00, 16:00 UTC).
  - Acceptance Criteria: Deducts/credits funding payment ($V \times R_{\text{fund}}$) from/to open positions and logs transaction to wallet ledger.

---

## Phase 4: Window Applications & Interactive Modals

- [ ] **4.1 Build `TurboTrade.exe` Complete Window**
  - Deliverable: Full 3-panel futures trading terminal (Left: Market & 24h Metrics, Center: Chart & Open Positions Table, Right: Order Entry Form & Leverage Slider).
  - Acceptance Criteria:
    - Leverage slider snaps between discrete values (`1x, 5x, 10x, 20x, 50x, 100x`) with warning banner at $\ge 20\text{x}$.
    - Quick size buttons (`25%`, `50%`, `75%`, `MAX`) compute dollar amounts accurately.
    - Pre-trade calculation box displays Margin Cost, Est. Liq Price, and Max Position size.
    - Open Positions table displays Pair, Type, Entry, Mark, Liq Price, Margin, ROE %, and a working `Close Position` button.

- [ ] **4.2 Build `DegenVault.exe` Profile & Wallet Window**
  - Deliverable: Retro wallet window containing:
    - Section 1: User Profile (pixel avatar, handle `SatoshiDegen_98`, rank badge `Novice Liquidator`, XP progression bar).
    - Section 2: Virtual Ledger (Total Equity, Available Margin, Margin in Position, All-time ROI %, Win Rate, Faucet button).
    - Section 3: 7-Day Daily Claim Streak Tracker.
  - Acceptance Criteria: Balance values update reactively upon position open/close/liquidation; Faucet button (+10 USDT) enables only when equity drops below 1.00 USDT.

- [ ] **4.3 Build `Leaderboard.exe` Global Ranking Window**
  - Deliverable: Competitive rankings terminal displaying:
    - Podium showcase for Top 3 traders (Gold, Silver, Bronze cards with retro badges).
    - Sortable spreadsheet data grid with raised bevel column headers (Rank, Handle, Tier, Win Rate, 7D ROI %, Net PnL).
    - Sticky bottom row highlighting the user's current rank (`YOU`).
  - Acceptance Criteria: Filter tabs switch between `All-Time ROI`, `24H Gainers`, `Weekly Cup`, and `Most Liquidated (Hall of Shame)`.

- [ ] **4.4 Build `WelcomeModal` System Onboarding Dialog**
  - Deliverable: Centered 90s system notice dialog popping on first visit.
  - Acceptance Criteria: Details 10.00 USDT starter pack and 3 quick rules; includes `[x] Do not show on startup` checkbox; clicking `[ START TRADING ]` closes modal and focuses `TurboTrade.exe`.

- [ ] **4.5 Build `ShareFlexCard` Social PnL Export Modal**
  - Deliverable: High-resolution retro card rendering modal with customizable theme selector (`Cyber CRT Green`, `CRT Bearish Red`, `Gold Whale`).
  - Acceptance Criteria:
    - Captures trade metrics (Pair, Direction, Leverage, ROE %, Net Gain in USDT, Entry vs Mark price).
    - `[ Copy Image 📋 ]` writes PNG blob to clipboard via HTML5 Canvas.
    - `[ Save .PNG 💾 ]` triggers file download.
    - `[ 𝕏 Share on X ↗ ]` opens pre-populated tweet draft with hashtags.

- [ ] **4.6 Build Liquidation Crash Alert Dialog (`LiquidationModal.tsx`)**
  - Deliverable: Emergency modal spawning upon forced liquidation with CRT screen shake animation.
  - Acceptance Criteria: Displays skull icon `☠`, loss amount, liquidated contract details, and quick restart options.

---

## Phase 5: Persistence, Gamification, Audio FX & Polish

- [ ] **5.1 Implement 7-Day Reward Claim Engine (`DailyClaimManager.ts`)**
  - Deliverable: Logic tracking consecutive daily claims with 24-hour unlock cooldown and 36-hour grace period.
  - Acceptance Criteria: Day 1 (2 USDT), Day 2 (5 USDT), Day 3 (8 USDT), Day 4 (10 USDT), Day 5 (15 USDT), Day 6 (25 USDT), Day 7 (50 USDT + Mystery Box); streak resets if interval exceeds 36 hours.

- [ ] **5.2 Integrate LocalStorage Persistence with Anti-Tamper Checksum**
  - Deliverable: Zustand `persist` middleware storing state in `CRYPTOOS_98_STATE_V1` sealed with HMAC-SHA256 checksum.
  - Acceptance Criteria: Page reload preserves balances, trade history, and streak; manual console tampering of balance triggers Blue Screen of Death (BSOD) reset dialog.

- [ ] **5.3 Build Retro Sound Synthesis Engine (`SoundFXService.ts`)**
  - Deliverable: Web Audio API sound generator producing:
    - Mechanical click on button press.
    - Cash register ding on claim reward.
    - Warning beep on high leverage slider ($> 20\text{x}$).
    - CRT degauss glass-crash on position liquidation.
  - Acceptance Criteria: Audio can be toggled on/off via speaker icon in System Tray.

- [ ] **5.4 Implement Responsive Fallback for Tablets and Mobile**
  - Deliverable: Adaptive layout collapsing floating windows into retro segmented tab strips on viewports < 1024px, and displaying an MS-DOS resolution warning on mobile viewports < 768px.
  - Acceptance Criteria: UI remains usable across desktop resolutions from 1024x768 to 4K Ultrawide.

- [ ] **5.5 End-to-End Verification & Production Build Validation**
  - Deliverable: Comprehensive manual and automated verification of all trading workflows, chart feeds, and modal interactions.
  - Acceptance Criteria: Production bundle builds cleanly (`npm run build`) with zero lint or type errors; Lighthouse score > 90.
