/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#2A2018',
          tint: '#3A2E24',
          deep: '#1A130E',
        },
        wood: {
          DEFAULT: '#8B6F47',
          light: '#A88A5E',
          dark: '#6B5436',
        },
        clay: {
          DEFAULT: '#B8916A',
          light: '#CDAE88',
        },
        moss: {
          DEFAULT: '#6B7B4F',
          light: '#8A9B6E',
        },
        cream: '#F8F5EF',
        paper: '#FFFFFF',
        muted: '#756B61',
        rim: '#DBD0C2',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(42, 32, 24, 0.06)',
        card: '0 4px 16px rgba(42, 32, 24, 0.08)',
        lift: '0 8px 30px rgba(42, 32, 24, 0.12)',
      },
    },
  },
  plugins: [],
};
