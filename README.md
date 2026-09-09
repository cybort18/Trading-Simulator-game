# CryptoOS 98 — Retro Crypto Futures Trading Simulator

> **Nostalgia Windows 98 meets High-Stakes Crypto Futures Trading.**  
> Simulator trading perpetual futures crypto dengan zero financial risk, live market feeds dari Binance, dan antarmuka desktop OS retro era 90-an.

---

## Fondasi Dokumentasi Engineering

Proyek ini dibangun di atas 5 dokumen arsitektur dan spesifikasi engineering lengkap:

1. **[`PRD.md`](./PRD.md) (Product Requirements Document):**  
   Visi produk, profil pengguna (*Degen Dan*, *Calculated Cara*, *Nostalgic Nate*), psikologi retensi, 10 USDT starter pack, 7-day daily login streak (2, 5, 8, 10..50 USDT), dan virality share card.
2. **[`ARCHITECTURE.md`](./ARCHITECTURE.md) (Technical Architecture):**  
   Arsitektur Next.js/Vite + React 18 + TypeScript (Strict) + Zustand + Lightweight Charts, pipeline Binance WebSocket multiplexing, diagram alur order & likuidasi (ASCII), window z-index layer stack, serta anti-tamper checksum.
3. **[`SIMULATION_ENGINE.md`](./SIMULATION_ENGINE.md) (Trading & Mathematical Logic):**  
   Penurunan rumus eksak matematika keuangan: Initial Margin, Maintenance Margin, Unrealized/Realized PnL, ROE %, derivasi rumus harga likuidasi ($P_{\text{liq}}$ untuk isolated/cross long & short), simulated 8-hour funding rate, dan contoh hitungan numerik lengkap akun 10 USDT posisi 20x Long BTC.
4. **[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (Design Tokens & 3D Bevel Guide):**  
   Panduan token desain diekstrak dari Stitch MCP: `#008080` (Teal), `#C0C0C0` (Silver), `#000080` to `#1084D0` (Titlebar Navy Gradient), `#121212` (CRT Black), `#00FF66` (Neon Green), `#FF3333` (CRT Red), spesifikasi optical bevel CSS (`.win-outset`, `.win-inset`, `.win-inset-deep`, `.win-btn`), dan anatomi window 98.
5. **[`TASK_ROADMAP.md`](./TASK_ROADMAP.md) (Atomic Implementation Roadmap):**  
   Checklist bertahap dari Phase 1 hingga Phase 5 dengan kriteria deliverable deterministik.

---

## Status Proyek Saat Ini: Phase 1, Phase 2, dan Phase 3 Selesai

- [x] **Phase 1: Environment Setup, Tailwind Retro Preset & Window Manager**
  - [x] Inisialisasi Vite + React 18 + TypeScript (`strict: true`) + path alias `@/*`.
  - [x] Konfigurasi Tailwind CSS skeuomorphic 98 & 3D optical bevel CSS utility classes.
  - [x] Desktop Canvas `#008080` dengan ikon desktop interaktif (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`, `Recycle Bin`).
  - [x] Retro Taskbar 36px di bagian bawah dengan tombol **Start** klasik, window task tabs aktif/inaktif, dan System Tray (WS live LED, quick balance, 24h clock).
  - [x] Draggable Window Manager (`WindowFrame.tsx`) dengan pembatas layar (boundary clamping), minimize/maximize/close, dan active navy titlebar gradient.
  - [x] State management multi-window reaktif berbasis Zustand (`useWindowStore.ts`).
  - [x] Shell aplikasi: `TurboTradeWindow`, `DegenVaultWindow`, `LeaderboardWindow`, `WelcomeModal`, dan `ShareFlexCardModal`.

- [x] **Phase 2: Real-Time Binance WebSocket Service & Chart Integration**
  - [x] Singleton `BinanceWsService.ts` multiplexing live stream Binance (`@ticker`, `@kline_1m`, `@markPrice@1s`).
  - [x] Reconnection exponential backoff, 15s heartbeat liveness check, dan fallback REST hydration.
  - [x] Reactive state store `useMarketDataStore.ts` tracking live prices, 24h ticker metrics, funding rate, dan telemetry latency.
  - [x] Integrasi TradingView `Lightweight Charts` (v5) di dalam CRT container `#121212` dengan candlestick merah/hijau retro.
  - [x] Dynamic pair switcher (`BTC/USDT`, `ETH/USDT`, `SOL/USDT`), monospace price banner dengan flash warna tick, countdown funding 8-jam, dan sinkronisasi status System Tray.
  - [x] Production build lolos uji 100% (`tsc && vite build`) dengan 0 error dan 0 warning.

- [x] **Phase 3: Trading & Liquidation Simulation Engine (Unit-Tested)**
  - [x] Math core library `simulationMath.ts` mengimplementasikan rumus eksak perpetual futures: Notional Value, Quantity, uPnL, ROE %, Maintenance Margin, Liquidation Price (isolated & cross margin), Slippage model, dan Fees.
  - [x] Test runner Vitest dengan 100% pass rate (36 unit tests) memvalidasi kalkulasi terhadap contoh numerik BTC 20x Long dari Section 6 `SIMULATION_ENGINE.md`.
  - [x] Zustand store `useWalletStore.ts` untuk manajemen ekuitas, margin terkunci, pemotongan fee, realized PnL, win/loss stats, dan faucet bailout.
  - [x] Zustand store `useTradingStore.ts` untuk eksekusi order (Market/Limit, Long/Short), lifecycle posisi, update PnL real-time batch, dan riwayat trading.
  - [x] High-frequency liquidation scanner `LiquidationEngine.ts` yang memantau tick harga real-time dan mengeksekusi force liquidation saat harga menyentuh threshold.
  - [x] Simulated 8-hour funding rate engine `FundingRateEngine.ts` dengan countdown presisi dan settlement fee transfer.
  - [x] Windows 98 Critical Error crash modal `LiquidationModal.tsx` dengan fitur emergency bailout faucet saat saldo kolaps di bawah 1.00 USDT.

---

## Tech Stack

- **UI Framework:** React 18, TypeScript (Strict Mode)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS v3 (Custom Skeuomorphic Retro Theme)
- **State Management:** Zustand 4
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

# 3. Jalankan development server
npm run dev
```

Buka browser dan akses: `http://localhost:3000/`

Untuk build versi production:
```bash
npm run build
```

---

## Roadmap Selanjutnya (Phase 2 - 5)

- **Phase 2:** Binance WebSocket multiplexed data stream ingestion & TradingView Lightweight Charts integration.
- **Phase 3:** Trading simulation math engine (unit-tested), real-time liquidation scanner, dan fee/funding rate calculation.
- **Phase 4:** Fitur lengkap window apps (Order execution form, depth orderbook, daily claim mechanics, PnL export generator).
- **Phase 5:** LocalStorage persistence dengan anti-tamper checksum, retro sound effects (Web Audio API), dan final polish.
