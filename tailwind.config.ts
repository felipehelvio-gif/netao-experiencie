import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Santa Fé palette
        santafe: {
          orange: '#F39C3C',
          'orange-bright': '#FF8A1A',
          'orange-dark': '#C76F1A',
          navy: '#1B2B3F',
          'navy-deep': '#0F1A28',
          cream: '#FFF8EE',
          black: '#0A0A0A',
        },
        // shadcn-ish tokens (mapped to santafe)
        background: '#FFF8EE',
        foreground: '#0A0A0A',
        primary: {
          DEFAULT: '#F39C3C',
          foreground: '#0A0A0A',
        },
        secondary: {
          DEFAULT: '#1B2B3F',
          foreground: '#FFF8EE',
        },
        muted: {
          DEFAULT: '#EDE3D2',
          foreground: '#5C5043',
        },
        destructive: {
          DEFAULT: '#B23A3A',
          foreground: '#FFF8EE',
        },
        border: '#E5D8C2',
        input: '#E5D8C2',
        ring: '#F39C3C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Anton', 'Impact', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
