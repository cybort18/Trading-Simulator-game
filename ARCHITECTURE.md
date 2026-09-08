# System Architecture & Technical Specifications
## CryptoOS 98 — Retro Crypto Futures Trading Simulator
**Document Version:** 1.0.0  
**Status:** Approved for Engineering Implementation  
**Architecture Paradigm:** Client-Side Desktop Virtualization & Event-Driven Reactive Trading Engine  
**Author:** Autonomous Principal Software Architect & Product Systems Engineer  

---

## 1. Technology Stack Selection & Rationale

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRYPTOOS 98 TECH STACK                          │
└────────────────────────────────────────────────────────────────────────┘
  UI Framework:       React 18 + Next.js 14 (App Router) or Vite + TypeScript
  Styling Engine:     Tailwind CSS v3 (Custom Skeuomorphic Retro 98 Extension)
  State Management:   Zustand 4.x (Decoupled Slices + LocalStorage Persistence)
  Market Data:        Native Browser WebSocket (Binance Public Futures Stream)
  Financial Charts:   TradingView Lightweight Charts (v4.1+) Retro Theme
  Image Synthesis:    HTML-to-Image / HTML5 Canvas 2D API (ShareFlexCard)
  Audio Feedback:     Web Audio API Synthesizer + Sound Font Chimes
```

### 1.1 Core Technologies
1. **Frontend Core:** **Next.js 14 / Vite with React 18 & TypeScript (Strict Mode)**
   - *Rationale:* Next.js/Vite ensures near-instant HMR development and zero-overhead production bundling. TypeScript strict typing (`noImplicitAny`, `strictNullChecks`) is mandatory to guarantee financial precision in trading math and state management.
2. **Styling & Retro Design Tokens:** **Tailwind CSS v3 with Custom Retro Theme**
   - *Rationale:* Tailwind provides fine-grained utility control over 3D beveled borders, strict 0px border-radii (`rounded: 0px`), custom color palettes (`#008080`, `#C0C0C0`, `#000080`), and scanline CRT grid backgrounds.
3. **State Architecture:** **Zustand (Multi-Store Domain Separation)**
   - *Rationale:* Zustand offers minimal boilerplate, zero-unnecessary-renders selector subscriptions, and seamless integration with persistent storage middleware. We isolate state into 4 independent domain stores: `WindowStore`, `TradingStore`, `WalletStore`, and `MarketDataStore`.
4. **Market Charting:** **TradingView Lightweight Charts (v4.1+)**
   - *Rationale:* At <45KB gzipped, Lightweight Charts provides high-performance Canvas rendering of 60 FPS candlestick charts, custom color overrides matching the CRT dark terminal (`#121212`), and low CPU utilization during high-frequency WebSocket updates.
5. **Graphics & Virality:** **HTML5 Canvas 2D / `html-to-image`**
   - *Rationale:* Renders high-DPI (2x scale) pixel-perfect snapshots of the `ShareFlexCard` modal directly on the client, generating raw PNG blobs for instant clipboard copy and file export without server dependencies.
6. **Audio Engine:** **Web Audio API Sound Synth**
   - *Rationale:* Generates 8-bit mechanical keyboard clicks, window open chimes, error beeps, and liquidation degauss sweeps procedurally with zero external asset latency.

---

## 2. System Architecture Diagrams

### 2.1 High-Level Architecture Topology

```
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER RUNTIME                            |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                         DESKTOP CANVAS (100vw x 100vh)                  |  |
|  |  +--------------------+ +--------------------+ +---------------------+  |  |
|  |  |   TurboTrade.exe   | |   DegenVault.exe   | |   Leaderboard.exe   |  |  |
|  |  | [Chart][Book][Exec]| | [Wallet][7D Claim] | | [Podium][Rank Grid] |  |  |
|  |  +---------+----------+ +---------+----------+ +----------+----------+  |  |
|  |            |                      |                       |             |  |
|  |  +---------v----------------------v-----------------------v----------+  |  |
|  |  |                    WINDOW MANAGER CONTROLLER                      |  |  |
|  |  |  (Z-Index Layer Stack, Drag/Drop Bounding Box, Focus & Taskbar)   |  |  |
|  |  +-------------------------------------------------------------------+  |  |
|  |  |                   RETRO TASKBAR & SYSTEM TRAY                     |  |  |
|  |  |  [Start Menu] [Active Window Tabs] [WS Status] [Balance] [Clock]  |  |  |
|  +--+-------------------------------------------------------------------+--+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                        ZUSTAND REACTIVE CORE                            |  |
|  |  +------------------+ +------------------+ +-------------------------+  |  |
|  |  | MarketDataStore  | |   TradingStore   | |       WalletStore       |  |  |
|  |  | - Live Tickers   | | - Open Positions | | - Equity & Margins      |  |  |
|  |  | - Kline Streams  | | - Order History  | | - 7-Day Claim Streak    |  |  |
|  |  | - Mark Prices    | | - Liquidation    | | - Anti-Tamper Checksum  |  |  |
|  |  +--------^---------+ +--------^---------+ +------------^------------+  |  |
|  +-----------|--------------------|------------------------|---------------+  |
|              |                    |                        |                  |
|  +-----------+--------------------+------------------------+---------------+  |
|  |                     CLIENT SERVICES & ENGINES                           |  |
|  |  +----------------------+ +-------------------+ +--------------------+  |  |
|  |  | Binance WS Service   | | Simulation Engine | | Storage Encryption |  |  |
|  |  | (Multiplex/Reconnect)| | (Liq / PnL / Fee) | | (HMAC-SHA256 Sig)  |  |  |
|  |  +----------^-----------+ +-------------------+ +---------+----------+  |  |
+----------------|---------------------------------------------|----------------+
                 |                                             |
                 | wss://fstream.binance.com                   | LocalStorage
                 v                                             v
     [Binance Futures Stream]                      [CRYPTOOS_98_STATE_V1]
```

### 2.2 Market Data Pipeline (ASCII Flow)

```
[Binance Futures WS Server]
           │
           │ (wss://fstream.binance.com/stream?streams=...)
           ▼
┌────────────────────────────────────────┐
│        BinanceWsClient Service         │
│  - Exponential Backoff Reconnection    │
│  - 15s Heartbeat Ping/Pong Monitor     │
│  - Stream Payload Parsing & Normalizer │
└──────────────────┬─────────────────────┘
                   │
         ┌─────────┴─────────┐
         │ Combined Payload  │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│  @ticker / mark │ │     @kline      │
│  Price Stream   │ │   Candle Stream │
└────────┬────────┘ └────────┬────────┘
         │                   │
         ▼                   ▼
┌────────────────────────────────────────┐
│           MarketDataStore              │
│  - markPrice: Record<Pair, number>     │
│  - ticker24h: Record<Pair, TickerData> │
│  - lastCandle: KlineCandle             │
└────────┬───────────────────────────────┘
         │
         ├───► High-Frequency Trigger ──► [Liquidation Scanner Loop]
         │                                (Checks open positions on every tick)
         ├───► Reactive Selector       ──► [TurboTrade Candlestick Viewport]
         │                                (Lightweight Charts incremental update)
         └───► System Tray Dispatcher  ──► [Taskbar WS & Ping Indicator]
```

### 2.3 Order Execution & Lifecycle Pipeline

```
[Trader Action: Click 'OPEN LONG 20x']
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│             Pre-Trade Validation                 │
│  - Check Available Margin >= Required Margin     │
│  - Validate Min Notional ($1.00 USDT)            │
│  - Validate Discrete Leverage (1x - 100x)        │
└─────────────────┬────────────────────────────────┘
                  │ [Valid]
                  ▼
┌──────────────────────────────────────────────────┐
│              Order Execution Engine              │
│  - Capture Current Binance Mark Price            │
│  - Deduct Initial Margin from Wallet             │
│  - Deduct Taker Trading Fee (0.05%)              │
│  - Calculate Precise Liquidation Price (P_liq)   │
│  - Play Mechanical Click Sound FX                │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│        Append to TradingStore.positions          │
│  - id: UUID                                      │
│  - pair: "BTCUSDT" | "ETHUSDT" | "SOLUSDT"       │
│  - direction: "LONG" | "SHORT"                   │
│  - entryPrice, markPrice, liqPrice               │
│  - size, margin, leverage                        │
└─────────────────┬────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
[Real-Time Tick PnL]   [Close Position / TP / SL]
- uPnL & ROE % update  - Realize Gain/Loss
- Update UI Table      - Refund Margin to Available
- Flex Card Ready      - Update DegenVault All-time ROI
```

### 2.4 Liquidation Engine Trigger Loop

```
[Binance WS: New Mark Price Tick Emitted]
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│       TradingStore.evaluateLiquidations()        │
│       Iterate over all active positions          │
└─────────────────┬────────────────────────────────┘
                  │
     ┌────────────┴────────────┐
     │ Check Liquidation Cond: │
     │ Long: MarkPrice <= P_liq│
     │ Short: MarkPrice >= P_liq
     └────────────┬────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    [Condition Met]   [Condition Not Met]
         │                 │
         │                 └──► Continue Tick Loop
         ▼
┌──────────────────────────────────────────────────┐
│          Forced Liquidation Protocol             │
│  1. Force-close position immediately at P_liq    │
│  2. Initial Margin is 100% liquidated            │
│  3. Play Crash / Degauss Glass Shatter Sound FX  │
│  4. Trigger 500ms CRT Screen Shake Animation     │
│  5. Move record to TradeHistory [LIQUIDATED]     │
│  6. Spawn 'SYSTEM ALERT: LIQUIDATED ☠' Modal     │
│  7. If Equity < 1.00 USDT -> Enable Faucet       │
└──────────────────────────────────────────────────┘
```

---

## 3. Real-Time WebSocket Architecture

### 3.1 Multiplexed Stream Configuration
Binance Futures WebSocket supports single-socket multiplexing via `/stream?streams=<stream1>/<stream2>/...`. This avoids the browser's 6-connection domain limit and drastically minimizes network resource overhead.

**Connection Endpoint:**  
`wss://fstream.binance.com/stream?streams=btcusdt@ticker/btcusdt@kline_1m/btcusdt@markPrice@1s/ethusdt@ticker/ethusdt@kline_1m/ethusdt@markPrice@1s/solusdt@ticker/solusdt@kline_1m/solusdt@markPrice@1s`

### 3.2 Resilience & Failover Algorithm
```typescript
interface WsConnectionState {
  status: 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  retryCount: number;
  lastHeartbeat: number;
  latencyMs: number;
}
```

1. **Heartbeat Liveness Check:** A client-side timer checks `Date.now() - lastHeartbeat` every 5,000ms. If no message has been received within 15,000ms, the socket is forcibly terminated (`socket.close()`) to initiate an immediate reconnect.
2. **Exponential Backoff with Jitter:**
   $$\text{Delay}(n) = \min\left(30000, 1000 \times 2^n\right) + \text{random}(0, 1000)$$
   Where $n$ is the consecutive reconnect attempt index.
3. **REST Polling Fallback:** If WebSocket reconnection fails consecutively 5 times (e.g. corporate proxy blocking WS), the engine falls back to REST polling every 2,000ms against `https://fapi.binance.com/fapi/v1/ticker/24hr` until WebSocket connectivity is restored.

---

## 4. Desktop Window Management Engine

### 4.1 Z-Index Layer Stack Model
Windows operate in a strict layered virtual hierarchy:
- Base Desktop Icons: `z-index: 10`
- Normal Inactive Windows: `z-index: 20` to `29`
- Focused Active Window: `z-index: 30`
- System Modal Dialogs (`WelcomeModal`, `ShareFlexCard`): `z-index: 40`
- Top Taskbar & Bottom Taskbar: `z-index: 50`
- Crash / Liquidation Alerts: `z-index: 60`

```typescript
interface WindowState {
  id: 'turbotrade' | 'degenvault' | 'leaderboard';
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  defaultBounds: { x: number; y: number; width: number; height: number };
  zIndex: number;
}
```

### 4.2 Focus & Drag-and-Drop Constraints
1. **Focus Propagation:** Clicking anywhere inside a window dispatches `focusWindow(id)`. The window's `zIndex` is reassigned to the highest current index + 1, while its titlebar switches to the active gradient (`linear-gradient(90deg, #000080, #1084D0)`).
2. **Desktop Viewport Clamping:**
   $$\text{clampedX} = \max\left(0, \min\left(X, \text{viewportWidth} - \text{width}\right)\right)$$
   $$\text{clampedY} = \max\left(28, \min\left(Y, \text{viewportHeight} - \text{taskbarHeight} - 24\right)\right)$$
   This strictly guarantees the titlebar can never be dragged off-screen or hidden behind the taskbars.

---

## 5. Local Persistence & Anti-Tamper Security

### 5.1 Storage Schema (`CRYPTOOS_98_STATE_V1`)
```json
{
  "version": 1,
  "user": {
    "handle": "SatoshiDegen_98",
    "avatar": "pixel_face_1",
    "rank": "Novice Liquidator",
    "createdAt": 1715000000000
  },
  "wallet": {
    "equity": 16.71,
    "availableMargin": 7.50,
    "lockedMargin": 2.50,
    "totalRealizedPnl": 6.71,
    "allTimeRoi": 67.1,
    "winCount": 5,
    "lossCount": 3
  },
  "rewards": {
    "currentStreak": 2,
    "lastClaimTimestamp": 1715086400000,
    "claimedDays": [1]
  },
  "positions": [],
  "history": [],
  "securityChecksum": "a8fbc71890123...sha256"
}
```

### 5.2 Anti-Tamper Checksum Verification
To discourage users from opening DevTools and directly altering their LocalStorage equity to claim #1 on the leaderboard, state is sealed with a deterministic SHA-256 / HMAC checksum:
$$\text{Checksum} = \text{SHA256}(\text{handle} + \text{equity} + \text{winCount} + \text{lastClaimTimestamp} + \text{SALT_KEY})$$

On application mount:
1. State is retrieved from `localStorage.getItem('CRYPTOOS_98_STATE_V1')`.
2. The checksum is recomputed.
3. If the stored checksum does not match the recomputed hash, the application logs a tampering alert, displays a retro BSOD (Blue Screen of Death) popup: `Fatal Exception 0E: System Tamper Detected. State corrupted. Restoring from safe default (10.00 USDT).`, and resets the balance to the 10.00 USDT starter pack.
