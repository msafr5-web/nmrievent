/** Brand theme: deep purple base with orange/gold glow accents. */
module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#07030f', 900: '#0d0720', 800: '#150b2e', 700: '#1f1142', 600: '#2b1a59' },
        royal: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
        flame: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
        gold: { 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b' },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'system-ui', '-apple-system', 'Roboto', '"Noto Sans Arabic"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,115,22,.35), 0 10px 40px -10px rgba(249,115,22,.55)',
        'glow-purple': '0 0 0 1px rgba(139,92,246,.35), 0 10px 40px -10px rgba(139,92,246,.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#f97316 0%,#f59e0b 100%)',
        'hero-glow':
          'radial-gradient(60% 50% at 80% 0%,rgba(139,92,246,.35),transparent 70%),radial-gradient(50% 40% at 10% 20%,rgba(249,115,22,.22),transparent 70%)',
      },
    },
  },
  plugins: [],
};
