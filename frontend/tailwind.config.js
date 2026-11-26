/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        bistro: {
          DEFAULT: 'var(--accent-brand)',
          hover: 'var(--accent-brand-hover)',
          soft: 'var(--accent-brand-soft)',
        },
        status: {
          available: 'var(--status-available)',
          occupied: 'var(--status-occupied)',
          payment: 'var(--status-payment)',
          cleaning: 'var(--status-cleaning)',
        },
        kds: {
          canvas: 'var(--kds-canvas)',
          card: 'var(--kds-card)',
          note: 'var(--kds-note-highlight)',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"',
          'Georgia',
          'serif',
        ],
      },
      boxShadow: {
        tactile: '0 2px 6px -1px rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04)',
        'tactile-hover': '0 10px 20px -4px rgba(28, 25, 23, 0.1), 0 4px 8px -2px rgba(28, 25, 23, 0.05)',
      },
    },
  },
  plugins: [],
};
