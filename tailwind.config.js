/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        plaster: { DEFAULT: "#EAE6DB", deep: "#DFDAC9" },
        card: "#F8F6EF",
        line: "#D8D2BF",
        ink: { DEFAULT: "#22251F", soft: "#63665B", faint: "#93968A" },
        sienna: { DEFAULT: "#B8502C", deep: "#8F3D22", tint: "#F1DCCB" },
        lapis: { DEFAULT: "#2C4A6E", tint: "#D8E0E8" },
        verdigris: { DEFAULT: "#4F7A63", tint: "#DCE7DE" },
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
