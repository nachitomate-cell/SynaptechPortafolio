/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        synapse: {
          // SynapTech brand lime-green accent used across the network.
          glow: "#a3d94a",
          core: "#92c83a",
          edge: "#7bb22e",
          bright: "#bef264",
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
        neon: "0 0 20px rgba(146,200,58,0.45), 0 0 60px rgba(146,200,58,0.25)",
      },
    },
  },
  plugins: [],
};
