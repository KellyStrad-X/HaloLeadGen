/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        halo: {
          ice: '#00D4FF',
          dark: '#1A1A1A',
          'dark-light': '#2D2D2D',
          medium: '#4A4A4A',
          light: '#E0E0E0',
        },
      },
    },
  },
  plugins: [],
}
