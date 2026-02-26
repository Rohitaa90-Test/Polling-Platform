/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#7765DA',
          DEFAULT: '#5767D0',
          dark: '#4F0DCE',
        },
        surface: '#F2F2F2',
        charcoal: '#373737',
        muted: '#6E6E6E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

