/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './App.tsx',
    './index.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep Indigo/Violet as Primary (More Premium than standard Blue)
        primary: {
          50: '#eff6ff', // Softest blue-white
          100: '#e0e7ff', // Very light indigo
          200: '#c7d2fe', // Light indigo
          300: '#a5b4fc', // Soft indigo
          400: '#818cf8', // Medium indigo
          500: '#6366f1', // Standard indigo
          600: '#4f46e5', // Deep indigo (Primary Action)
          700: '#4338ca', // Darker indigo
          800: '#3730a3', // Dark intense indigo
          900: '#312e81', // Very dark indigo
          950: '#1e1b4b', // Almost black indigo
        },
        // Refined Slate for Neutrals (Better for technical apps)
        neutral: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0', // Borders
          300: '#cbd5e1', // Disabled/Placeholder
          400: '#94a3b8', // Secondary Text
          500: '#64748b', // Primary Text Light
          600: '#475569', // Primary Text Dark
          700: '#334155', // Headings
          800: '#1e293b', // Dark backgrounds
          900: '#0f172a', // Very dark backgrounds
          950: '#020617', // Black
        },
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          700: '#a16207',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'], // For Headings
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        medium: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        glow: '0 0 20px rgba(99, 102, 241, 0.5)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        'gradient-glass':
          'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-fire': 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'gradient-forest': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        medium: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        glow: '0 0 20px rgba(99, 102, 241, 0.5)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Custom plugins
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          '@apply bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-700/30':
            {},
        },
        '.glass-hover': {
          '@apply hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300': {},
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
      });
    },
  ],
};
