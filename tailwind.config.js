/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta basada en la identidad de Century 21: oro/bronce sobre carbón profundo.
        carbon: {
          50: "#F8F8F8",
          100: "#E6E7E8",
          200: "#D1D3D4",
          300: "#BDBEC0",
          400: "#A6A8AB",
          500: "#808285",
          600: "#666769",
          700: "#4C4D4F",
          800: "#373738",
          900: "#252526",
          950: "#111112",
        },
        gold: {
          50: "#F9F8F3",
          100: "#F1EFE3",
          200: "#E1DCC7",
          300: "#CEC5A3",
          400: "#BEAF87",
          500: "#A19276",
          600: "#8C7A5F",
          700: "#6F604A",
          800: "#514637",
          900: "#372F25",
          950: "#211C16",
        },
        signal: {
          ok: "#3f8f5f",
          warn: "#c98a1f",
          danger: "#b6452c",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
