# CryptoOS 98 - Retro Crypto Futures Trading Simulator

> **Nostalgia Windows 98 meets High-Stakes Crypto Futures Trading.**  
> Simulator trading perpetual futures crypto dengan zero financial risk, live market feeds dari Binance, dan antarmuka desktop OS retro era 90-an.

---

## Fondasi Dokumentasi Engineering

Proyek ini dibangun di atas 5 dokumen arsitektur dan spesifikasi engineering lengkap:

1. **[`PRD.md`](./PRD.md) (Product Requirements Document):**  
   Visi produk, profil pengguna (*Degen Dan*, *Calculated Cara*, *Nostalgic Nate*), psikologi retensi, 10 USDT starter pack, 7-day daily login streak (2, 5, 8, 10..50 USDT), dan virality share card.
2. **[`ARCHITECTURE.md`](./ARCHITECTURE.md) (Technical Architecture):**  
   Arsitektur Vite + React 18 + TypeScript (Strict) + Zustand + Lightweight Charts, pipeline Binance WebSocket multiplexing, diagram alur order & likuidasi (ASCII), window z-index layer stack, serta anti-tamper checksum.
3. **[`SIMULATION_ENGINE.md`](./SIMULATION_ENGINE.md) (Trading & Mathematical Logic):**  
   Penurunan rumus eksak matematika keuangan: Initial Margin, Maintenance Margin, Unrealized/Realized PnL, ROE %, derivasi rumus harga likuidasi ($P_{\text{liq}}$ untuk isolated/cross long & short), simulated 8-hour funding rate, dan contoh hitungan numerik lengkap akun 10 USDT posisi 20x Long BTC.
4. **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (Design Tokens & 3D Bevel Guide):**  
   Panduan token desain diekstrak dari Stitch MCP: `#008080` (Teal), `#C0C0C0` (Silver), `#000080` to `#1084D0` (Titlebar Navy Gradient), `#121212` (CRT Black), `#00FF66` (Neon Green), `#FF3333` (CRT Red), spesifikasi optical bevel CSS (`.win-outset`, `.win-inset`, `.win-inset-deep`, `.win-btn`), dan anatomi window 98.
5. **[`TASK_ROADMAP.md`](./TASK_ROADMAP.md) (Atomic Implementation Roadmap):**  
   Checklist bertahap dari Phase 1 hingga Phase 5 dengan kriteria deliverable deterministik yang telah selesai 100%.

---

## Status Proyek: Phase 1 hingga Phase 5 Selesai (v1.0.0 Production Release)

- [x] **Phase 1: Environment Setup, Tailwind Retro Preset & Window Manager**
  - [x] Inisialisasi Vite + React 18 + TypeScript (`strict: true`) + path alias `@/*`.
  - [x] Konfigurasi Tailwind CSS skeuomorphic 98 & 3D optical bevel CSS utility classes.
  - [x] Desktop Canvas `#008080` dengan ikon desktop interaktif (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`, `Recycle Bin`).
  - [x] Retro Taskbar 36px di bagian bawah dengan tombol **Start** klasik, window task tabs aktif/inaktif, dan System Tray (WS live LED, quick balance, 24h clock, audio toggle).
  - [x] Draggable Window Manager (`WindowFrame.tsx`) dengan pembatas layar (boundary clamping), minimize/maximize/close, dan active navy titlebar gradient.
  - [x] State management multi-window reaktif berbasis Zustand (`useWindowStore.ts`).

- [x] **Phase 2: Real-Time Binance WebSocket Service & Chart Integration**
  - [x] Singleton `BinanceWsService.ts` multiplexing live stream Binance (`@ticker`, `@kline_1m`, `@markPrice@1s`).
  - [x] Reconnection exponential backoff, 15s heartbeat liveness check, dan fallback REST hydration.
  - [x] Reactive state store `useMarketDataStore.ts` tracking live prices, 24h ticker metrics, funding rate, dan telemetry latency.
  - [x] Integrasi TradingView `Lightweight Charts` (v5) di dalam CRT container `#121212` dengan candlestick merah/hijau retro.
  - [x] Dynamic pair switcher (`BTC/USDT`, `ETH/USDT`, `SOL/USDT`), monospace price banner dengan flash warna tick, countdown funding 8-jam, dan sinkronisasi status System Tray.

- [x] **Phase 3: Trading & Liquidation Simulation Engine (Unit-Tested)**
  - [x] Math core library `simulationMath.ts` mengimplementasikan rumus eksak perpetual futures: Notional Value, Quantity, uPnL, ROE %, Maintenance Margin, Liquidation Price (isolated & cross margin), Slippage model, dan Fees.
  - [x] Zustand store `useWalletStore.ts` untuk manajemen ekuitas, margin terkunci, pemotongan fee, realized PnL, win/loss stats, dan faucet bailout.
  - [x] Zustand store `useTradingStore.ts` untuk eksekusi order (Market/Limit, Long/Short), lifecycle posisi, update PnL real-time batch, dan riwayat trading.
  - [x] High-frequency liquidation scanner `LiquidationEngine.ts` yang memantau tick harga real-time dan mengeksekusi force liquidation saat harga menyentuh threshold.
  - [x] Simulated 8-hour funding rate engine `FundingRateEngine.ts` dengan countdown presisi dan settlement fee transfer.
  - [x] Windows 98 Critical Error crash modal `LiquidationModal.tsx` dengan fitur emergency bailout faucet saat saldo kolaps di bawah 1.00 USDT.

- [x] **Phase 4: Window Applications & Interactive Modals**
  - [x] `TurboTradeWindow.tsx`: Terminal futures lengkap dengan toggle Market/Limit, Cross/Isolated, leverage discrete slider (1x - 100x), quick size buttons (25%, 50%, 75%, MAX), pre-trade calculation box, serta tabel open positions dengan aksi `Close` dan `Share`.
  - [x] `DegenVaultWindow.tsx`: Profil trader retro (Novice Liquidator -> Legendary Whale), XP progression bar, financial ledger CRT readout, dan ladder claim harian 7 hari.
  - [x] `LeaderboardWindow.tsx`: Podium showcase Top 3, spreadsheet data grid sortable, kategori turnamen (All-Time ROI, 24H Gainers, Weekly Cup, Most Liquidated), dan sticky row `YOU`.
  - [x] `WelcomeModal.tsx`: Onboarding dialog Windows 98 dengan ringkasan modal virtual 10.00 USDT dan persistensi startup.
  - [x] `ShareFlexCardModal.tsx`: Generator card viral 600x380 dengan 3 tema CRT (Cyber Green, Blood Red, Gold Whale), copy PNG ke clipboard via `html-to-image`, download PNG, dan integrasi share Twitter/X.

- [x] **Phase 5: Persistence, Gamification, Audio FX & Polish**
  - [x] `DailyClaimManager.ts`: Engine claim harian 7 hari dengan cooldown unlock 24 jam dan grace period 36 jam.
  - [x] `security.ts` & `tamperProtectedStorage.ts`: Anti-tamper checksum cryptographic hashing (SHA-256) untuk state persistence `CRYPTOOS_98_STATE_V1`.
  - [x] `BSODModal.tsx`: Authentic Windows 98 Blue Screen of Death (BSOD) recovery shield yang memblokir dan mereset saldo yang dimanipulasi secara ilegal melalui console DevTools.
  - [x] `SoundFXService.ts`: Procedural Web Audio API synthesizer menghasilkan mechanical click, confirmation chime, rising arpeggio, warning beep, dan CRT degauss glass-crash tanpa dependensi file audio eksternal.
  - [x] `ResolutionGuard.tsx`: Layar deteksi resolusi BIOS/MS-DOS untuk perangkat mobile dan tablet dengan bypass opsi.
  - [x] 100% test coverage pada unit tests (70 passed) dan clean production build (`tsc && vite build`).

---

## Tech Stack

- **UI Framework:** React 18, TypeScript (Strict Mode)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS v3 (Custom Skeuomorphic Retro Theme, 0px border radius, 3D optical bevels)
- **State Management:** Zustand 4 dengan custom tamper-protected persistence
- **Charts:** TradingView Lightweight Charts v5
- **Audio:** Native Web Audio API (Zero external MP3/WAV assets)
- **Image Generation:** html-to-image
- **Testing:** Vitest 2.1
- **Icons & Effects:** Lucide Icons, Canvas Confetti
- **Typography:** MS Sans Serif, Tahoma, Courier Prime, Space Grotesk

---

## Cara Menjalankan Secara Lokal

Pastikan Anda telah menginstal **Node.js (v18+)** dan **npm**:

```bash
# 1. Clone repository
git clone https://github.com/cybort18/Trading-Simulator-game.git
cd Trading-Simulator-game

# 2. Install dependencies
npm install

# 3. Jalankan unit test suite
npm run test

# 4. Jalankan development server
npm run dev
```

Buka browser dan akses: `http://localhost:3000/`

Untuk memvalidasi build versi production:
```bash
npm run build
```
