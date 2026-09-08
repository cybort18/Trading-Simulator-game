/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
        xl: '0px',
        '2xl': '0px',
        full: '0px',
      },
      spacing: {
        'taskbar-height': '36px',
        'titlebar-height': '22px',
        'menubar-height': '20px',
      },
      fontFamily: {
        ui: ['"MS Sans Serif"', 'Tahoma', '"Segoe UI"', 'sans-serif'],
        mono: ['"Courier Prime"', 'Consolas', '"Courier New"', 'monospace'],
        headline: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
