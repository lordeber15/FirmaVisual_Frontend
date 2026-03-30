/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eef1f8',
          100: '#d4dbed',
          200: '#a9b7db',
          300: '#7e93c9',
          400: '#536fb7',
          500: '#2A428A',
          600: '#23376E',
          700: '#1B2A55',
          800: '#141F3E',
          900: '#0D1428',
          DEFAULT: '#23376E',
        },
        accent: {
          50: '#fef7e8',
          100: '#fdecc5',
          200: '#fbd98b',
          300: '#F8C45C',
          400: '#F8AF3C',
          500: '#E09520',
          600: '#B87410',
          DEFAULT: '#F8AF3C',
        },
        secondary: {
          50: '#eef7fd',
          100: '#d4ecfa',
          200: '#a8d8f5',
          300: '#7bc4f0',
          400: '#53A2DA',
          500: '#3b8bc4',
          600: '#2a6d9e',
          DEFAULT: '#53A2DA',
        },
        success: {
          50: '#edf7ed',
          100: '#d1ead0',
          200: '#a3d5a1',
          300: '#6fbe6d',
          400: '#45A043',
          500: '#368235',
          600: '#286427',
          DEFAULT: '#45A043',
        },
        destructive: '#DC2626',
      },
      borderRadius: {
        xl: '0.625rem',
      },
      boxShadow: {
        'inst': '0 4px 6px -1px rgb(35 55 110 / 0.1)',
        'inst-lg': '0 10px 20px -5px rgb(35 55 110 / 0.15)',
      },
    },
  },
  plugins: [],
}
