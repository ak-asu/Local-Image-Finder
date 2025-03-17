/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use class for dark mode toggle
  theme: {
    extend: {
      colors: {
        // Add your custom colors here for the app theme
        primary: {
          light: '#646cff',
          DEFAULT: '#535bf2',
          dark: '#4349c9',
        },
        secondary: {
          light: '#f8f9fa',
          DEFAULT: '#e9ecef',
          dark: '#dee2e6',
        },
        dark: {
          light: '#343a40',
          DEFAULT: '#212529',
          dark: '#121212',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}