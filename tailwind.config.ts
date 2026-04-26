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
      screens: { '2xl': '1320px' },
    },
    extend: {
      colors: {
        santafe: {
          orange: '#F39C3C',
          'orange-bright': '#FF8A1A',
          'orange-dark': '#C76F1A',
          'orange-deep': '#8C4D11',
          navy: '#1B2B3F',
          'navy-deep': '#0E1825',
          'navy-soft': '#2A3F5C',
          cream: '#FFF8EE',
          'cream-warm': '#F5E8CE',
          black: '#0A0A0A',
          paper: '#F2E5C8',
          ember: '#E84A1F',
        },
        background: '#FFF8EE',
        foreground: '#0A0A0A',
        primary: { DEFAULT: '#F39C3C', foreground: '#0A0A0A' },
        secondary: { DEFAULT: '#1B2B3F', foreground: '#FFF8EE' },
        muted: { DEFAULT: '#EDE3D2', foreground: '#5C5043' },
        destructive: { DEFAULT: '#B23A3A', foreground: '#FFF8EE' },
        border: '#E5D8C2',
        input: '#E5D8C2',
        ring: '#F39C3C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Anton', 'Impact', 'sans-serif'],
        slab: ['var(--font-slab)', 'Rockwell', 'serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.25rem' },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'marquee-slow': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(243,156,60,0.6)' },
          '70%': { boxShadow: '0 0 0 14px rgba(243,156,60,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(243,156,60,0)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 22%, 24%, 55%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        marquee: 'marquee 32s linear infinite',
        'marquee-slow': 'marquee-slow 60s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wobble: 'wobble 6s ease-in-out infinite',
        flicker: 'flicker 4s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
