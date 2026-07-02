/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d5f5e6",
          200: "#aeeacf",
          300: "#79d9b4",
          400: "#43c096",
          500: "#22a67c",
          600: "#158564",
          700: "#136a53",
          800: "#125444",
          900: "#0f4539",
          950: "#07271f",
        },
        ink: {
          900: "#12181b",
          800: "#1b2327",
          700: "#28323a",
          600: "#3a464f",
          500: "#54636d",
          400: "#7c8994",
          300: "#a9b2ba",
          200: "#d3d8dc",
          100: "#eceff1",
          50: "#f6f8f9",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
