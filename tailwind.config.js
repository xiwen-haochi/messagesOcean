/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          bg: "#03070D",
          panel: "rgba(5, 11, 20, 0.82)",
          cyan: "#3BC7FF",
          violet: "#8A63FF",
          grid: "rgba(59, 199, 255, 0.11)"
        }
      },
      boxShadow: {
        neon: "0 0 24px rgba(59, 199, 255, 0.45)",
        "neon-strong": "0 0 42px rgba(59, 199, 255, 0.72)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"]
      }
    }
  },
  plugins: []
};
