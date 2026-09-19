/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: '#101322', pearl: '#F7F7FB', violet: '#6D48F3' }, boxShadow: { glow: '0 20px 60px rgba(109,72,243,.24)' } } },
  plugins: [],
}
