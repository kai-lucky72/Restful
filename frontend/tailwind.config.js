/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Fire-safety palette (accents, not full surfaces)
        fire: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 400: '#F87171',
          500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
        },
        amber: {
          50: '#FFFBEB', 100: '#FEF3C7', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706',
        },
        safe: {
          50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
        },
        graphite: {
          50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
          400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827', 950: '#030712',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px -6px rgba(0,0,0,0.12)',
        glass: '0 8px 40px -8px rgba(17,24,39,0.18), inset 0 1px 0 0 rgba(255,255,255,0.6)',
        'glass-dark': '0 8px 40px -8px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.12)',
        glow: '0 0 0 1px rgba(220,38,38,0.1), 0 10px 40px -10px rgba(220,38,38,0.45)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.95)' },
        },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        blob: 'blob 14s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
    },
  },
  plugins: [],
};
