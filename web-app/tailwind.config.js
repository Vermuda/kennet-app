/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 見出し用: エレガントで編集的
        serif: ['Playfair Display', 'Merriweather', 'Georgia', 'serif'],
        // 本文用: 読みやすいモノスペース
        mono: ['JetBrains Mono', 'Source Code Pro', 'Monaco', 'Courier New', 'monospace'],
        // UI要素用: モダンなサンセリフ
        sans: ['Space Grotesk', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [],
}

