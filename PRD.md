# Product Requirements Document (PRD)
## CryptoOS 98 — Retro Crypto Futures Trading Simulator
**Document Version:** 1.0.0  
**Status:** Approved for Engineering Architecture  
**Target Platform:** Web (Desktop First, Mobile Adaptive)  
**Author:** Autonomous Principal Software Architect & Product Systems Engineer  

---

## 1. Executive Summary & Vision

### 1.1 Product Overview
**CryptoOS 98** is a high-fidelity web application that fuses the nostalgic, tactical skeuomorphism of a late-1990s desktop operating system (Windows 95/98) with real-time, institutional-grade cryptocurrency perpetual futures trading mechanics.

Instead of generic paper trading dashboards with dry forms and flat modern designs, CryptoOS 98 places the user inside a vintage virtual PC environment complete with:
- Classic `#008080` teal desktop canvas and skeuomorphic 3D beveled windows.
- Draggable, focusable, minimizable window architecture (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`).
- High-contrast, dark CRT terminal interiors (`#121212`) illuminated by phosphor greens (`#00FF66`), warning ambers (`#FFAA00`), and liquidation reds (`#FF3333`).
- Zero-latency market data streams ingested directly from Binance Futures WebSockets.
- Authentic perpetual futures math: leverage ranging from 1x to 100x, isolated and cross margin modes, maintenance margin thresholds, and instant liquidation execution.
- Addictive gamification loops: a 10.00 USDT virtual starter pack, 7-day tiered daily login claims (2, 5, 8, 10, 15, 25, 50 USDT), rank badges, and retro PnL brag cards exportable to social media.

### 1.2 Core Value Proposition
1. **Adrenaline Without Bankruptcy:** Crypto traders routinely suffer catastrophic wipeouts on live perpetual exchanges due to extreme leverage and emotions. CryptoOS 98 replicates 100% of the authentic trading thrill, volatility, and UI density of Binance/Bybit with zero real financial risk.
2. **Tactile Nostalgia Meets High Finance:** The intersection of Windows 98 aesthetic appeal and crypto degen culture creates immediate visual delight, high engagement, and viral shareability.
3. **Mastery Sandbox:** Beginners and seasoned algorithmic degens can test high-leverage execution strategies, observe liquidation cascades in real time, and build confidence before deploying capital.

### 1.3 Target Audience
- **Crypto-Native Traders & Degens:** Active participants in perpetual swaps, memecoin scalping, and DeFi who value rapid execution, high contrast, and humor.
- **Retro Computing & Pixel Art Enthusiasts:** Developers, designers, and gamers drawn to late-90s OS nostalgia, CRT scanlines, and authentic bevel design systems.
- **Financial Learners & Paper Traders:** Newcomers seeking to understand how leverage, maintenance margin, and liquidation prices function mathematically in real-time market conditions.

---

## 2. User Personas & Psychological Gamification Hooks

### 2.1 User Personas

| Attribute | Persona 1: "Degen Dan" (The 100x Gambler) | Persona 2: "Calculated Cara" (The Pattern Scalper) | Persona 3: "Nostalgic Nate" (The Retro Builder) |
| :--- | :--- | :--- | :--- |
| **Age / Profile** | 22, Crypto Twitter native, Discord regular | 29, Quant hobbyist, Technical Analyst | 35, Full-stack engineer, 90s OS fan |
| **Primary Goal** | High leverage (50x-100x), quick 10x balance flips | Consistent win rate, precise support/resistance scalping | Appreciates desktop UI details, sound FX, and sharing PnL |
| **Pain Point** | Lost real funds on Bybit/Binance due to liquidation | Conventional simulators feel clunky, laggy, or unrealistic | Modern web apps look identical and lack distinct personality |
| **Key Metric** | Max ROE %, Share Flex Card generation count | Win rate %, Sharpe ratio, drawdown recovery | Session duration, window interaction count |

### 2.2 Psychological Gamification Mechanics

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE CRYPTOOS 98 RETENTION LOOP                       │
└────────────────────────────────────────────────────────────────────────┘
                 ┌──────────────────────────┐
                 │ 1. Onboarding / Faucet   │
                 │ 10.00 USDT Starter Pack  │
                 └─────────────┬────────────┘
                               │
                               ▼
                 ┌──────────────────────────┐
                 │ 2. High-Leverage Action  │
                 │ 20x-100x Perp Positions  │
                 └──────┬────────────┬──────┘
                        │            │
         Profit Spike   │            │ Liquidation / Wipeout
                        ▼            ▼
         ┌──────────────────┐    ┌──────────────────┐
         │ ShareFlexCard.exe│    │ System Crash SFX │
         │ Brag on X/Discord│    │ Faucet / Daily   │
         └────────┬─────────┘    └────────┬─────────┘
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ 3. 7-Day Daily Claim     │
                 │ 2, 5, 8, 10..50 USDT     │
                 │ XP & Rank Ascension      │
                 └──────────────────────────┘
```

1. **Loss Aversion Mitigation:** By framing the starting balance as a tangible 10.00 USDT starter pack, users treat it as scarce capital rather than infinite play money, fostering real emotional tension.
2. **High-Stakes Dopamine Cycle:** Enabling 50x-100x leverage on volatile pairs (BTC, ETH, SOL) means a 1% price movement produces a 50%-100% ROE swing, triggering the same neurological feedback loops as live trading.
3. **Escalating Daily Reward Streak:** A 7-day reward ladder (Day 1: 2 USDT, Day 2: 5 USDT, Day 3: 8 USDT, Day 4: 10 USDT, Day 5: 15 USDT, Day 6: 25 USDT, Day 7: 50 USDT + Mystery Box) forms strong 24-hour return habits.
4. **Social Proof & Bragging Engine:** The exportable `ShareFlexCard` transforms any profitable trade into an eye-catching pixel-art trophy designed specifically for Twitter/X timelines and Discord channels.
5. **Rank Progression:** Users climb from `Novice Liquidator` -> `Degenerate Trader` -> `Veteran Scalper` -> `Legendary Whale` based on trade volume and cumulative ROI.

---

## 3. Core Features & Detailed Acceptance Criteria

### 3.1 Feature 1: User Onboarding & Virtual Balance Initialization
- **Description:** First-time users are greeted by the authentic Windows 98 modal dialog `System Notice - Welcome New Trader!`.
- **Functionality:**
  - Automatically initializes local encrypted state with `10.00 USDT` virtual balance.
  - Displays quick trading rules: Long/Short mechanics, liquidation risk warning, and leaderboard climbing goal.
  - Checkbox: `[x] Do not show this tip on system startup`.
  - Action button: `[ START TRADING ]` (rendered with default retro dotted focus outline).
- **Acceptance Criteria:**
  - **AC-1.1:** On first visit (no existing session in LocalStorage), `WelcomeModal` opens centered on top of desktop icons with highest z-index.
  - **AC-1.2:** Wallet equity must initialize exactly to `10.00 USDT` available margin, `0.00 USDT` locked margin, `0` open positions.
  - **AC-1.3:** Clicking `[ START TRADING ]` closes the modal with a smooth window-close sound and focuses `TurboTrade.exe`.
  - **AC-1.4:** If the "Do not show" checkbox was checked, reloading the page will NOT pop the modal again.

### 3.2 Feature 2: 7-Day Tiered Daily Reward Retention Loop
- **Description:** A daily faucet system housed inside `DegenVault.exe` rewarding sequential login streaks.
- **Reward Schedule:**
  - **Day 1:** 2.00 USDT (Unlocked upon first login / Claimed)
  - **Day 2:** 5.00 USDT (Unlocked after 24h)
  - **Day 3:** 8.00 USDT (Unlocked after 48h)
  - **Day 4:** 10.00 USDT (Unlocked after 72h)
  - **Day 5:** 15.00 USDT (Unlocked after 96h)
  - **Day 6:** 25.00 USDT (Unlocked after 120h)
  - **Day 7:** 50.00 USDT + Mystery Degenerate Box (Unlocked after 144h)
- **Rules & Streak Reset:**
  - A claim becomes active exactly 24 hours after the previous claim timestamp.
  - A grace window of 36 hours is permitted. If the user fails to claim within 36 hours of the claim becoming available, the streak resets back to Day 1.
- **Acceptance Criteria:**
  - **AC-2.1:** The claim card reflects three visual states per day slot: `Claimed ✓` (dimmed inset), `Ready / Active` (pulsing amber outset border), and `Locked` (padlock icon with grayed text).
  - **AC-2.2:** When a reward is claimable, the button `[ CLAIM DAILY REWARD: +X.00 USDT ]` activates with animated gift icons.
  - **AC-2.3:** Clicking claim immediately adds the reward amount to `availableMargin` and `equity`, updates `lastClaimTimestamp`, and triggers a success chime.
  - **AC-2.4:** System tray in the taskbar immediately updates the `BAL: XX.XX USDT` badge without requiring a page refresh.

### 3.3 Feature 3: Real-Time Binance WebSocket Ingestion
- **Description:** Live market data pipeline connecting directly to public Binance Futures WebSocket streams with zero server backend required.
- **Supported Tickers:**
  - `BTCUSDT` (Primary default pair)
  - `ETHUSDT`
  - `SOLUSDT`
- **Subscribed Streams:**
  - Kline Stream: `<pair>@kline_1m` (OHLCV candles for interactive chart).
  - Ticker Stream: `<pair>@ticker` (24h high, low, volume, mark price, 24h percentage change).
  - Mark Price Stream: `<pair>@markPrice@1s` (high-frequency mark price for instant liquidation evaluation).
- **Acceptance Criteria:**
  - **AC-3.1:** WebSocket connects automatically on application startup to `wss://fstream.binance.com/stream`.
  - **AC-3.2:** System Tray displays `WS LIVE ●` with a pulsing green indicator and calculated ping latency (ms).
  - **AC-3.3:** If connection drops, the indicator switches to `WS RECONNECTING...` in amber, executing exponential backoff reconnects (1s, 2s, 4s, 8s, up to 30s max).
  - **AC-3.4:** Pair switching in `TurboTrade.exe` dynamically unsubscribes from the previous pair's streams and subscribes to the newly selected pair within <300ms.

### 3.4 Feature 4: Order Execution Engine
- **Description:** Order execution console supporting market and limit futures orders with dynamic leverage.
- **Specifications:**
  - **Order Types:** Market (executes immediately at current Mark Price) and Limit (executes when Mark Price crosses limit price).
  - **Directions:** `OPEN LONG (BUY)` (bullish green) and `OPEN SHORT (SELL)` (bearish red).
  - **Margin Modes:** `Isolated` (margin strictly capped to position cost) and `Cross` (entire available wallet balance acts as buffer).
  - **Leverage Slider:** Stepped retro slider supporting discrete steps: `1x`, `2x`, `5x`, `10x`, `20x`, `50x`, `100x`.
  - **High-Risk Indicator:** When leverage >= 20x, display flashing amber banner: `▲ Warning: 20x+ High Volatility Liquidation Risk`.
  - **Quick Size Buttons:** `25%`, `50%`, `75%`, `MAX` based on available account balance.
  - **Pre-Trade Calculation Box:**
    - Required Margin (Cost): $\text{Margin} = \frac{\text{Notional Value}}{\text{Leverage}}$
    - Estimated Liquidation Price ($P_{\text{liq}}$) computed dynamically before placing the order.
    - Max Position size (BTC / ETH / SOL).
    - Slippage tolerance (Fixed 0.05% for simulated market orders).
- **Acceptance Criteria:**
  - **AC-4.1:** Users cannot place orders exceeding their current `availableMargin` plus simulated trading fees.
  - **AC-4.2:** Minimum order cost is 1.00 USDT.
  - **AC-4.3:** Clicking `OPEN LONG` or `OPEN SHORT` plays a mechanical keyboard click SFX, deducts initial margin and opening fee from wallet, and appends the position to the `Open Positions` table.
  - **AC-4.4:** Limit orders are held in an `Open Orders` queue and execute automatically the instant the live Binance ticker crosses the limit threshold.

### 3.5 Feature 5: Liquidation Engine & Risk Protocol
- **Description:** High-frequency position monitoring loop running on every incoming mark price tick.
- **Specifications:**
  - **Maintenance Margin Rate ($MMR$):**
    - BTCUSDT: 0.50% (0.005)
    - ETHUSDT: 0.65% (0.0065)
    - SOLUSDT: 1.00% (0.010)
  - **Liquidation Condition (Isolated Long):** Mark Price $\le P_{\text{liq}}$
  - **Liquidation Condition (Isolated Short):** Mark Price $\ge P_{\text{liq}}$
  - **Liquidation Execution Protocol:**
    1. Immediately close position at Mark Price.
    2. Position margin is deducted; balance is wiped for that isolated tranche.
    3. Trigger dramatic CRT screen shake animation.
    4. Play vintage crash audio (CRT degauss / glass break sound).
    5. Spawn high-priority modal: `SYSTEM ALERT: POSITION LIQUIDATED ☠` detailing the liquidated pair, loss amount, and bankruptcy notice.
    6. If total account equity falls below 1.00 USDT, enable emergency faucet button `[ Virtual Faucet (+10 USDT) ]` in `DegenVault.exe`.
- **Acceptance Criteria:**
  - **AC-5.1:** Mark price updates evaluated every tick (<200ms latency).
  - **AC-5.2:** Liquidation is deterministic: calculated $P_{\text{liq}}$ in UI matches execution engine trigger price to within 0.01%.
  - **AC-5.3:** Liquidated position moves from `Open Positions` to `Trade History` marked with a red `LIQUIDATED` status badge.

### 3.6 Feature 6: Retro OS Desktop UI/UX System
- **Description:** Complete Windows 98 multi-window desktop manager running in 100vw x 100vh non-scrolling layout.
- **Window Catalog:**
  1. `Desktop Canvas & Taskbar`: Fixed 36px bottom bar with Start menu, active window tabs, live system tray.
  2. `TurboTrade.exe`: 3-panel futures terminal (pair selector, TradingView Lightweight Chart, order entry, positions table).
  3. `DegenVault.exe`: Wallet ledger, avatar, rank progression, 7-day reward tracker.
  4. `Leaderboard.exe`: Global rankings, Top 3 podium showcase, sortable trader grid.
  5. `WelcomeModal`: Centered system onboarding popup.
  6. `ShareFlexCard`: Social PnL image generator modal.
- **Desktop Mechanics:**
  - **Z-Index Layering:** Clicking any window elevates its z-index above all others, renders active titlebar blue gradient (`#000080` to `#1084D0`), and changes its taskbar tab to `.win-btn-pressed`. Inactive windows turn flat gray (`#808080`).
  - **Draggable Windows:** Mouse down on titlebar enables dragging constrained within desktop viewport boundaries.
  - **Window Controls:**
    - `[_]` Minimize: Hides window body, unpresses taskbar tab. Clicking taskbar tab restores window.
    - `[🗖]` Maximize / Restore: Toggles window between default floating coordinates and full desktop bounds (minus taskbar).
    - `[✕]` Close: Hides window and removes tab from taskbar.
- **Acceptance Criteria:**
  - **AC-6.1:** Dragging a window cannot push its titlebar above the top screen border ($Y < 0$) or below the taskbar ($Y > \text{height} - 36$).
  - **AC-6.2:** Desktop icons (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`) launch or focus their respective windows on single/double click.
  - **AC-6.3:** 0px border radius everywhere (`rounded: 0px`). Elevation rendered strictly with 3D optical bevel borders.

### 3.7 Feature 7: Virality & Social Flex Card (`ShareFlexCard`)
- **Description:** High-resolution retro pixel-art card generator allowing users to export their PnL to X (Twitter), Telegram, and Discord.
- **Card Elements:**
  - Contract pair, Long/Short indicator, Leverage multiplier (e.g., `BTC/USDT PERPETUAL LONG 20x`).
  - Large glowing phosphor green/red ROE % readout (`+67.1% ROI`).
  - Absolute Dollar Gain (`+$6.71 USDT`).
  - Entry Price vs Mark Price.
  - Trader Handle (`SatoshiDegen_98`), Rank Badge, and Avatar.
  - Simulated verification stamp (`★ 100% VIRTUAL GAINS CERTIFIED ★`, `TX: 0x98...c0ffee`).
  - 3 Themes: `Cyber CRT Green`, `CRT Bearish Red`, `Gold Whale Apex`.
- **Export Capabilities:**
  - `[ Copy Image 📋 ]`: Writes rendered PNG blob directly to clipboard using `navigator.clipboard.write`.
  - `[ Save .PNG 💾 ]`: Triggers direct file download `CryptoOS98_Trade_BTCUSDT.png`.
  - `[ 𝕏 Share on X ↗ ]`: Opens pre-filled tweet intent with custom ASCII card and hashtags (`#CryptoOS98 #BinanceFutures #DegenTrading`).
- **Acceptance Criteria:**
  - **AC-7.1:** Card renders cleanly at 2x resolution (1200x630 ideal social card ratio) via canvas rendering.
  - **AC-7.2:** Image copy works across modern browsers (Chrome, Firefox, Safari, Edge).

---

## 4. Non-Functional Requirements & Constraints

### 4.1 Performance & Latency
- **Client Render Speed:** First Contentful Paint (FCP) < 1.0s. Desktop interactive state < 1.5s.
- **Chart Refresh Rate:** Lightweight Chart updates on 1m candlestick updates at 60 FPS without UI jank.
- **Memory Footprint:** Continuous heap memory < 90MB over 4 hours of continuous WebSocket streaming.

### 4.2 Browser Compatibility
- Evergreen modern desktop browsers: Chrome 100+, Firefox 100+, Safari 15+, Edge 100+.
- Responsive degradation: Tablets (768px - 1024px) collapse to stacked retro tabbed layout. Viewports < 768px display an authentic 90s BIOS / MS-DOS message advising a desktop resolution of 1024x768 for optimal experience.

### 4.3 Data Integrity & Security
- All user state persisted locally in LocalStorage under namespace `CRYPTOOS_98_STATE_V1`.
- Anti-tamper checksum: Stored balances are signed with a client-side HMAC/XOR hash to prevent trivial DevTools console tampering for fake leaderboard rankings.
