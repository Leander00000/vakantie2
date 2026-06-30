/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#effcf7",
          100: "#d8f6eb",
          200: "#b5ecd9",
          300: "#83dbc1",
          400: "#4ec2a3",
          500: "#2aa98a",
          600: "#1f8770",
          700: "#1c6d5d",
          800: "#1a584c",
          900: "#184940"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(25, 47, 63, 0.08)"
      }
    }
  },
  plugins: []
};
