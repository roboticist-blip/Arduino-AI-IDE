/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0a0e14',
          secondary: '#0d1117',
          tertiary: '#161b22',
          panel: '#1a2030',
          hover: '#21293a',
          border: '#1e2a3a',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00ff88',
          orange: '#ff7c00',
          red: '#ff4757',
          yellow: '#ffd43b',
          purple: '#a855f7',
          blue: '#3b82f6',
        },
        text: {
          primary: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
          accent: '#00d4ff',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'typing': 'typing 1.2s steps(40) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00d4ff33' },
          '100%': { boxShadow: '0 0 20px #00d4ff66, 0 0 40px #00d4ff22' },
        },
        typing: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#00d4ff' },
        }
      }
    },
  },
  plugins: [],
}
