import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the brand purple already used across the resident/security
        // mobile apps (#8506FF), so the admin web app feels like the same
        // product family instead of a bolted-on separate brand.
        brand: {
          50: '#f6ecff',
          100: '#ead4ff',
          200: '#d3a3ff',
          300: '#b968ff',
          400: '#a233ff',
          500: '#8506FF',
          600: '#7205db',
          700: '#5c04b0',
          800: '#460386',
          900: '#33025f',
        },
        ink: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b6b6c0',
          400: '#8b8b99',
          500: '#6b6b7a',
          600: '#54545f',
          700: '#43434c',
          800: '#2b2b31',
          900: '#17171b',
          950: '#0d0d10',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'splash-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'splash-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        'splash-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        'splash-in': 'splash-in 500ms ease-out both',
        'splash-pulse': 'splash-pulse 1.8s ease-in-out 500ms infinite',
        'splash-bar': 'splash-bar 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
