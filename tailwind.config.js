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
        // Ubuntu Orange as Primary (Action Color)
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#E95420', // ubuntu.orange
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Ubuntu Aubergine as Secondary (Brand/Header Color)
        secondary: {
          50: '#fdf4f9',
          100: '#fbe8f3',
          200: '#f8d0e7',
          300: '#f2a8d1',
          400: '#e871b0',
          500: '#d53f8c',
          600: '#b83280',
          700: '#772953', // ubuntu.midAubergine
          800: '#5e2750', // ubuntu.darkAubergine
          900: '#300a24', // ubuntu.aubergine
          950: '#1a0513',
        },
        // Ubuntu Warm/Cool Greys for Neutrals
        neutral: {
          0: '#ffffff',
          50: '#F7F7F7', // ubuntu light bg
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#AEA79F', // ubuntu.warmGrey
          500: '#6b7280',
          600: '#555555', // ubuntu mid text
          700: '#333333', // ubuntu.coolGrey (Primary text)
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Ubuntu Semantic Colors
        success: {
          50: '#f0fdf4',
          500: '#0E8420', // Ubuntu Green
          600: '#0E8420',
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          700: '#a16207',
        },
        error: {
          50: '#fff1f2',
          500: '#C7162B', // Ubuntu Red
          600: '#C7162B',
          700: '#be123c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
        // New Inspection Color Palette
        inspection: {
          50: '#EBF4F6',
          100: '#E1F0F3',
          200: '#C5DFE5',
          300: '#A9CDD7',
          400: '#7AB2B2',
          500: '#088395',
          600: '#077686',
          700: '#09637E',
          800: '#064F65',
          900: '#043B4B',
          950: '#02212B',
        },
        // Ubuntu Desktop Theme Colors
        ubuntu: {
          aubergine: '#300a24',
          darkAubergine: '#5e2750',
          midAubergine: '#772953',
          orange: '#E95420',
          warmGrey: '#AEA79F',
          coolGrey: '#333333',
        },
      },
      fontFamily: {
        sans: ['Ubuntu', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Ubuntu', 'Outfit', 'sans-serif'], // For Headings
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
