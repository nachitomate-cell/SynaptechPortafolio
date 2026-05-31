/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        synapse: {
          // Neon cyan / electric blue accent used across the network.
          glow: "#22d3ee",
          core: "#06b6d4",
          edge: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        neon: "0 0 20px rgba(34,211,238,0.45), 0 0 60px rgba(34,211,238,0.25)",
      },
    },
  },
  plugins: [],
};
