/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: 'var(--font-heading)',
        body:    'var(--font-body)',
      },
      colors: {
        // Gunakan sebagai: bg-theme-page, bg-theme-card, text-theme-accent, dll.
        theme: {
          page  : 'var(--c-page)',
          card  : 'var(--c-card)',
          input : 'var(--c-input)',
          accent: 'var(--c-accent)',
          text  : 'var(--c-text)',
          muted : 'var(--c-text-muted)',
          label : 'var(--c-text-label)',
        },
      },
    },
  },
  plugins: [],
}