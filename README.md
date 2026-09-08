# 💾 CryptoOS 98 — Retro Crypto Futures Trading Simulator

> **Nostalgia Windows 98 meets High-Stakes Crypto Futures Trading.**  
> Simulator trading perpetual futures crypto dengan zero financial risk, live market feeds dari Binance, dan antarmuka desktop OS retro era 90-an.

---

## 📑 Fondasi Dokumentasi Engineering

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

## 🚀 Status Proyek Saat Ini: Phase 1 Selesai

- [x] **Phase 1: Environment Setup, Tailwind Retro Preset & Window Manager**
  - [x] Inisialisasi Vite + React 18 + TypeScript (`strict: true`) + path alias `@/*`.
  - [x] Konfigurasi Tailwind CSS skeuomorphic 98 & 3D optical bevel CSS utility classes.
  - [x] Desktop Canvas `#008080` dengan ikon desktop interaktif (`TurboTrade.exe`, `DegenVault.exe`, `Leaderboard.exe`, `Recycle Bin`).
  - [x] Retro Taskbar 36px di bagian bawah dengan tombol **Start** klasik, window task tabs aktif/inaktif, dan System Tray (WS live LED, quick balance, 24h clock).
  - [x] Draggable Window Manager (`WindowFrame.tsx`) dengan pembatas layar (boundary clamping), minimize/maximize/close, dan active navy titlebar gradient.
  - [x] State management multi-window reaktif berbasis Zustand (`useWindowStore.ts`).
  - [x] Shell aplikasi: `TurboTradeWindow`, `DegenVaultWindow`, `LeaderboardWindow`, `WelcomeModal`, dan `ShareFlexCardModal`.
  - [x] Production build lolos uji 100% (`tsc && vite build`) dengan 0 error dan 0 warning.

---

## 🛠️ Tech Stack

- **UI Framework:** React 18, TypeScript (Strict Mode)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS v3 (Custom Skeuomorphic Retro Theme)
- **State Management:** Zustand 4
- **Icons & Effects:** Lucide Icons, Canvas Confetti
- **Typography:** MS Sans Serif, Tahoma, Courier Prime, Space Grotesk

---

## 💻 Cara Menjalankan Secara Lokal

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

## 🗺️ Roadmap Selanjutnya (Phase 2 - 5)

- **Phase 2:** Binance WebSocket multiplexed data stream ingestion & TradingView Lightweight Charts integration.
- **Phase 3:** Trading simulation math engine (unit-tested), real-time liquidation scanner, dan fee/funding rate calculation.
- **Phase 4:** Fitur lengkap window apps (Order execution form, depth orderbook, daily claim mechanics, PnL export generator).
- **Phase 5:** LocalStorage persistence dengan anti-tamper checksum, retro sound effects (Web Audio API), dan final polish.
