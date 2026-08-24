/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,.08)',
        'card-hover': '0 12px 32px rgba(0,0,0,.12)',
      },
      animation: { float: 'float 3s ease-in-out infinite' },
    },
  },
  plugins: [],
}
