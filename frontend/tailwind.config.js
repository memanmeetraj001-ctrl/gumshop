/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0A0C0F',
          surface: '#14171F',
          card: '#1A1E29',
          border: '#2A303F',
          accent: 'var(--color-accent, #EF4444)',
          red: '#EF4444',
          silver: '#8E95A5',
          gold: '#F59E0B',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}