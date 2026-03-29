/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ember:  { DEFAULT: "#e88a1a", light: "#f9c97a", dark: "#5c3005" },
        stone:  { DEFAULT: "#9c9280", light: "#f7f5f0", dark: "#1a1610" },
        moss:   { DEFAULT: "#52a845", light: "#cfe8cb", dark: "#0c2009" },
        ash:    { DEFAULT: "#2e2820", light: "#eae6dc", dark: "#0f0c08" },
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body:    ["DM Sans", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
      },
      animation: {
        "flicker": "flicker 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "rise":    "rise 0.5s ease-out forwards",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "50%":       { opacity: 0.75 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        rise: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
