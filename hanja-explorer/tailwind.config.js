/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.dark-mode'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'display': 'var(--text-display)',
        'h1':      'var(--text-h1)',
        'h2':      'var(--text-h2)',
        'h3':      'var(--text-h3)',
        'h4':      'var(--text-h4)',
        'body-lg': 'var(--text-body-lg)',
        'body':    'var(--text-body)',
        'sm-res':  'var(--text-sm)',
        'xs-res':  'var(--text-xs)',
      },
      lineHeight: {
        'standard': 'var(--line-height-standard)',
      }
    }
  },
  plugins: [],
}
