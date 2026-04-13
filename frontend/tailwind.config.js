/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#14395B', light: '#1c4a73', dark: '#0e2a43' },
        accent: { DEFAULT: '#2F75B5', light: '#4a8ec7', dark: '#24609a' },
        teal: { DEFAULT: '#1F6F78', light: '#278a95', dark: '#175660' },
        success: { DEFAULT: '#2E8B57', light: '#3aa46a', dark: '#246e45' },
        amber: { DEFAULT: '#C58B00', light: '#daa520', dark: '#9e6f00' },
        danger: { DEFAULT: '#C0504D', light: '#d06663', dark: '#a3403d' },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        heading: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
