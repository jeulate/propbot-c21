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
          950: "#0d0d0c",
          900: "#161513",
          800: "#211f1c",
          700: "#2e2b26",
          600: "#454039",
        },
        gold: {
          50: "#fbf6ea",
          100: "#f3e7c4",
          300: "#dfc06b",
          500: "#b8860b", // dorado C21 clásico (darkgoldenrod)
          600: "#9c700a",
          700: "#7d5a08",
        },
        signal: {
          ok: "#3f8f5f",
          warn: "#c98a1f",
          danger: "#b6452c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
