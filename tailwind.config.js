/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './{index,App,types,constants}.{ts,tsx}',
    './{assets,components,hooks,services,utils,context,pages,design-system}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        /** Tablet — intentional layouts from 768px */
        md: '768px',
        /** Desktop — two-column modules from 1024px */
        lg: '1024px',
        /** Large desktop — expanded grids from 1280px */
        xl: '1280px',
        /** Enterprise monitors — max content width from 1440px */
        '2xl': '1440px',
      },
      maxWidth: {
        'elm-content': '72rem',
        'elm-wide': '80rem',
      },
      colors: {
        elm: {
          bg: '#030308',
          surface: '#0a0f18',
          primary: '#3b82f6',
          'primary-light': '#5eb8e8',
          success: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
