/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b6fe0',
        'primary-dark': '#2c5bc7',
        danger: '#dc2626',
        'danger-dark': '#b91c1c',
        'danger-bg': '#fef2f2',
        'danger-border': '#fecaca',
        success: '#16a34a',
        'success-bg': '#f0fdf4',
        'success-border': '#bbf7d0',
        warning: '#d97706',
        'warning-bg': '#fffbeb',
        'warning-border': '#fde68a',
        neutral: '#475569',
        'neutral-bg': '#f1f5f9',
        'neutral-border': '#cbd5e1',
        surface: '#f8f9fb',
        card: '#ffffff',
        edge: '#e4e7ec',
        muted: '#6b7280',
        subtle: '#9ca3af',
        navy: '#1a2332',
        'navy-light': '#2d3f55',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}