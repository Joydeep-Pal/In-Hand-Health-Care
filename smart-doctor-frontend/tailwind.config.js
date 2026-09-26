/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette — calm clinical teal, warm neutral paper, one alert coral.
        paper: '#F7F7F5',
        ink: '#1E2A2E',
        slate: {
          soft: '#5B6A6D',
        },
        teal: {
          50: '#EAF4F3',
          100: '#CFE6E3',
          400: '#2F8F86',
          500: '#1F6E66',
          600: '#175650',
        },
        alert: {
          bg: '#FDECEA',
          border: '#E8A19A',
          text: '#8A3B33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chat: '18px',
      },
    },
  },
  plugins: [],
}
