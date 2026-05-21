/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          olive:   '#97A624',
          yellow:  '#D9CB04',
          amber:   '#D9B504',
          crimson: '#8C1414',
          black:   '#0D0D0D',
        },
        surface: {
          base:   '#FAFAF8',
          card:   '#FFFFFF',
          muted:  '#F4F4F0',
          border: '#E8E8E2',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
