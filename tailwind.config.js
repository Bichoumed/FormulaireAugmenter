/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        surface: "#161b22",
        textMain: "#c9d1d9",
        neon: "#4ef5d2",
        neonSoft: "#92ffe0",
      },
      boxShadow: {
        neon: "0 0 25px rgba(78, 245, 210, 0.3)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "50%": {
            transform: "translateY(-20px) rotate(180deg)",
            opacity: "0.5",
          },
        },
      },
    },
  },
  plugins: [],
};
