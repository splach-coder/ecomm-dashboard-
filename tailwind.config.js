/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tumbleweed: "#21A179",
        oceanblue: "#24333E",
        fog: "#6A8DA6",
        moderatelybrown: "#6B3C23",
        grey: "#8A8C8B",
      },
    },
  },
  plugins: [],
}
