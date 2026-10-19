/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        chalk: '#F2F5F7',
        panel: '#FFFFFF',
        ink: { DEFAULT: '#12202B', soft: '#4A5B68', faint: '#8795A1' },
        line: '#D9E0E6',
        cobalt: { DEFAULT: '#2D54E8', dark: '#2142C0' },
        signal: '#E8590C',
        moss: '#1F8A63',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
