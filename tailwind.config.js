/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    extend: {
     backgroundColor: {
        'custom-gray': 'rgb(211, 204, 201)',
        },
      spacing: {
        '112': '28rem',
        '128': '32rem'
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
      }
    },
  },
  plugins: [],
}

