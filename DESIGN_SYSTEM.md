# Design System & Retro Component Token Specification
## CryptoOS 98 — Retro Crypto Futures Trading Simulator
**Document Version:** 1.0.0  
**Design Paradigm:** Authentic Windows 98 Desktop Skeuomorphism x Cyber CRT Bloomberg Terminal  
**Design Tokens Source:** Extracted from Stitch MCP (`projects/7180526820682937883`)  
**Author:** Autonomous Principal Software Architect & Product Systems Engineer  

---

## 1. Design Philosophy & Aesthetic Identity

CryptoOS 98 bridges two iconic visual computing paradigms:
1. **The Tactical Skeuomorphism of Windows 98:** Tangible physical buttons, high-contrast directional 3D optical bevels (pure `#FFFFFF` top-left highlights, `#808080` and `#000000` cast shadows), neutral silver-gray backgrounds (`#C0C0C0`), and dense bitmap-style typography.
2. **The High-Density Cyber CRT Bloomberg Terminal:** Within the retro window frames sits a deep black (`#121212`) high-contrast financial cockpit illuminated by phosphor terminal greens (`#00FF66`), CRT liquidation reds (`#FF3333`), and margin warning ambers (`#FFAA00`).

### Strict Styling Rules
- **No Modern Soft Radii:** Every container, window, button, badge, and input must enforce `border-radius: 0px` (`rounded-none`).
- **No Blurred Drop Shadows:** Depth is produced exclusively via multi-layered solid optical border steps (`1px` to `3px`).
- **Tactile Click Feedback:** Active buttons must visually depress (`1px` inset translation down and right) on press.

---

## 2. Color Palette & Token Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CRYPTOOS 98 COLOR PALETTE                          │
└────────────────────────────────────────────────────────────────────────┘
  DESKTOP BACKGROUND:     #008080 (Classic 90s Teal Canvas)
  WINDOW BASE / CHROME:   #C0C0C0 (Silver Neutral Gray)
  SURFACE CONTAINER LOW:  #F4F3F3
  SURFACE CONTAINER HIGH: #E8E8E8
  TITLEBAR ACTIVE:        Linear Gradient: #000080 (Navy) -> #1084D0 (Cyan Blue)
  TITLEBAR INACTIVE:      #808080 (Monochrome Medium Gray)
  BEVEL HIGHLIGHT:        #FFFFFF (Pure White Top/Left Reflection)
  BEVEL SHADOW:           #808080 (Medium Gray Inner Shadow)
  BEVEL DARK SHADOW:      #000000 (Pure Black Outer Cast Shadow)
  TERMINAL CANVAS:        #121212 (Deep CRT Black)
  TERMINAL SURFACE:       #181818 (Secondary Table/Card Dark)
  CRT BULLISH / PROFIT:   #00FF66 (Neon Phosphor Terminal Green)
  CRT BEARISH / LOSS:     #FF3333 (High-Voltage CRT Red)
  CRT AMBER / WARNING:    #FFAA00 (Amber Warning & Gold Leaderboard)
  TERMINAL TEXT:          #E0E0E0 (Phosphor Monospace Off-White)
```

### 2.1 Complete Tailwind CSS Theme Extension Token Map
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'desktop-teal': '#008080',
        'win-base': '#C0C0C0',
        'win-pressed': '#B4B4B4',
        'titlebar-navy': '#000080',
        'titlebar-cyan': '#1084D0',
        'titlebar-inactive': '#808080',
        'bevel-highlight': '#FFFFFF',
        'bevel-shadow': '#808080',
        'bevel-dark': '#000000',
        'terminal-canvas': '#121212',
        'terminal-card': '#181818',
        'terminal-text': '#E0E0E0',
        'crt-bullish': '#00FF66',
        'crt-bearish': '#FF3333',
        'crt-amber': '#FFAA00',
        'crt-cyan': '#76D6D5',
        'surface-low': '#F4F3F3',
        'surface-high': '#E8E8E8',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
      },
      spacing: {
        'taskbar-height': '36px',
        'titlebar-height': '22px',
        'menubar-height': '20px',
      }
    }
  }
}
```

---

## 3. Optical Bevel & Elevation Engine (CSS)

Optical bevels simulate directional sunlight hitting physical 3D plastic windows from the top-left at a 45-degree angle.

```css
/* ========================================================================= */
/* 1. OUTSET (Raised 3D Surface - Buttons, Windows, Unpressed Tabs)          */
/* ========================================================================= */
.win-outset {
  border-top: 2px solid #FFFFFF;
  border-left: 2px solid #FFFFFF;
  border-bottom: 2px solid #000000;
  border-right: 2px solid #000000;
  box-shadow: inset -1px -1px 0px #808080, inset 1px 1px 0px #DFDFDF;
  background-color: #C0C0C0;
}

/* ========================================================================= */
/* 2. INSET (Sunken 3D Surface - Text Inputs, Status Bars, Inset Panels)      */
/* ========================================================================= */
.win-inset {
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #FFFFFF;
  border-right: 2px solid #FFFFFF;
  box-shadow: inset 1px 1px 0px #000000, inset -1px -1px 0px #DFDFDF;
  background-color: #C0C0C0;
}

/* ========================================================================= */
/* 3. INSET DEEP (Terminal Viewport, Chart Cavities, Data Wells)             */
/* ========================================================================= */
.win-inset-deep {
  border-top: 2px solid #000000;
  border-left: 2px solid #000000;
  border-bottom: 2px solid #FFFFFF;
  border-right: 2px solid #FFFFFF;
  box-shadow: inset 1px 1px 0px #808080;
  background-color: #121212;
}

/* ========================================================================= */
/* 4. BUTTON STATES (Interactive Press Feedback)                             */
/* ========================================================================= */
.win-btn {
  border-top: 2px solid #FFFFFF;
  border-left: 2px solid #FFFFFF;
  border-bottom: 2px solid #000000;
  border-right: 2px solid #000000;
  box-shadow: inset -1px -1px 0px #808080, inset 1px 1px 0px #DFDFDF;
  background-color: #C0C0C0;
  user-select: none;
  cursor: pointer;
}

.win-btn:active, .win-btn-pressed {
  border-top: 2px solid #000000 !important;
  border-left: 2px solid #000000 !important;
  border-bottom: 2px solid #FFFFFF !important;
  border-right: 2px solid #FFFFFF !important;
  box-shadow: inset 1px 1px 0px #808080 !important;
  background-color: #B4B4B4 !important;
  transform: translate(1px, 1px);
}

/* Focused Button Dotted Outline */
.win-btn-focus {
  outline: 1px dotted #000000;
  outline-offset: -4px;
}

/* ========================================================================= */
/* 5. CRT SCANLINE GRID (Terminal Texture Overlay)                           */
/* ========================================================================= */
.crt-grid {
  background-image: 
    linear-gradient(rgba(18, 18, 18, 0.94) 50%, rgba(10, 10, 10, 0.94) 50%),
    linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03));
  background-size: 100% 2px, 3px 100%;
}
```

---

## 4. Typography Hierarchy

```
┌──────────────────┬──────────────────────┬─────────┬────────┬─────────────┐
│ Role             │ Font Family          │ Size    │ Weight │ Line Height │
├──────────────────┼──────────────────────┼─────────┼────────┼─────────────┤
│ Window Titlebar  │ MS Sans Serif/Tahoma │ 11px    │ 700    │ 14px        │
│ UI Body Standard │ MS Sans Serif/Tahoma │ 11px    │ 400    │ 14px        │
│ UI Body Large    │ MS Sans Serif/Tahoma │ 12px    │ 400    │ 16px        │
│ UI Body Small    │ MS Sans Serif/Tahoma │ 9px     │ 400    │ 12px        │
│ Numeric Ticker Lg│ Courier Prime/Mono   │ 22px    │ 700    │ 24px        │
│ Data Readout Md  │ Courier Prime/Mono   │ 12px    │ 400    │ 16px        │
│ Data Readout Sm  │ Courier Prime/Mono   │ 10px    │ 400    │ 13px        │
│ Status Recess    │ Courier Prime/Mono   │ 10px    │ 700    │ 12px        │
│ Display Banners  │ Space Grotesk        │ 16-20px │ 700    │ 20-24px     │
└──────────────────┴──────────────────────┴─────────┴────────┴─────────────┘
```

---

## 5. Component Anatomy Specifications

### 5.1 Window Component Anatomy

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Icon] Window Title Here - Active Session           [?] [_] [🗖] [✕] │ <── 22px Titlebar (Navy Gradient)
├────────────────────────────────────────────────────────────────────────┤
│ File   Edit   View   Terminal   Options   Help                         │ <── 20px Menu Strip
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                       WINDOW CONTENT VIEWPORT                          │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ [● WS: LIVE] [NODE-7729] [LATENCY: 14ms]              [BALANCE: 10.00] │ <── 20px Recessed Status Bar
└────────────────────────────────────────────────────────────────────────┘
  ▲
  └── 3px Outer Bevel Frame (.win-outset)
```

1. **Titlebar (22px):**
   - **Active:** Horizontal gradient from `#000080` (left) to `#1084D0` (right) with crisp white bold text.
   - **Inactive:** Flat `#808080` with dimmed silver-white text.
   - **Glyph Buttons:** 4 square raised buttons (14px x 14px): Help `[?]`, Minimize `[_]`, Maximize `[🗖]`, Close `[✕]`.
2. **Menu Bar (20px):**
   - Flat silver bar (`#C0C0C0`) with 11px text. Hovering items triggers the classic inverse selection (`bg-[#000080] text-white`).
3. **Window Content Viewport:**
   - Houses application sub-panels with 2px inset/outset divisions.
4. **Window Status Bar (20px):**
   - Recessed `.win-inset` segments displaying connection telemetry, memory usage, and open order counters.

### 5.2 Retro Taskbar Anatomy (Fixed 36px Bottom)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [田 Start] | [TurboTrade - BTC] [DegenVault] | [WS: LIVE ●][BAL:10][14:45]│
└────────────────────────────────────────────────────────────────────────┘
```
- **Start Button:** 24px height, `.win-outset`. Hosts classic 4-color pixel logo (Red, Green, Blue, Amber) + bold text "Start".
- **Taskbar Window Tabs:** 150px-180px width.
  - Active focused window: `.win-btn-pressed` (`#B4B4B4` background, sunken bevel, bold text).
  - Inactive window: `.win-btn` (`#C0C0C0` background, raised bevel, normal text).
- **System Tray:** Sunken `.win-inset` container displaying:
  - WebSocket telemetry: `WS LIVE ●` with pulsing green LED dot.
  - Quick Balance: `BAL: 10.00 USDT` in monospaced terminal text.
  - Audio toggle icon (16x16 pixel speaker).
  - Digital 24-hour clock: `14:45`.

### 5.3 Trading Action Controls (TurboTrade.exe)
- **Leverage Slider:**
  - Inset track: 16px height, `.win-inset-deep`, dark silver track.
  - Thumb: 12px x 20px, `.win-outset`, draggable with snap points at `1x, 5x, 10x, 20x, 50x, 100x`.
- **Primary Execution Buttons:**
  - `OPEN LONG (BUY)`:
    - Base: `#008531` background with `#00FF66` phosphor highlight.
    - Bevel: 2px outset border with bold uppercase white text.
    - Hover: Brightens to `#00A83E`.
  - `OPEN SHORT (SELL)`:
    - Base: `#BA1A1A` background with `#FF3333` CRT red highlight.
    - Bevel: 2px outset border with bold uppercase white text.
    - Hover: Brightens to `#D62020`.

### 5.4 Social Virality Flex Card (`ShareFlexCard`)
- **Dimensions:** 600px x 380px (scaled 2x to 1200x760 for high-DPI social exports).
- **Styling:**
  - Embedded inside a vintage dialog box.
  - Internal card features authentic CRT grid scanlines on a deep dark canvas (`#0A0E17`).
  - Giant phosphor green/red ROE readout (`+67.1% ROI`) with neon text-glow filter (`drop-shadow(0 0 8px #00FF66)`).
  - Pixel avatar, contract details, entry/mark price matrix, and certified virtual watermark stamp.
