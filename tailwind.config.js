/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        plaster: { DEFAULT: "#F3F1E8", deep: "#E5E2D6" },
        card: "#FFFEF8",
        line: "#D4D1C4",
        ink: { DEFAULT: "#171717", soft: "#55534D", faint: "#89867C" },
        sienna: { DEFAULT: "#F04F35", deep: "#B92E1D", tint: "#FFE0D8" },
        lapis: { DEFAULT: "#3459E6", tint: "#E0E7FF" },
        verdigris: { DEFAULT: "#B8E52D", tint: "#EFFFC9" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
