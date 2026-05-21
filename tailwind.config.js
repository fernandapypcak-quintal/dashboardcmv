export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { olive:'#97A624', amber:'#D9B504', crimson:'#8C1414', black:'#0D0D0D' },
        surface: { base:'#FAFAF8', card:'#FFFFFF', muted:'#F4F4F0', border:'#E8E8E2' },
      },
      fontFamily: {
        sans: ['DM Sans','sans-serif'],
        mono: ['DM Mono','monospace'],
      },
    },
  },
  plugins: [],
}
