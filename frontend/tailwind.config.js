/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

export default {
  darkMode: "class", // or 'media' or 'class'. Media changes based on system settings, class changes manually with a class
  content: [
    "./index.html", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: 
          "var(--color-primary)",
          "primary-dark": "var(--color-primary-dark)",
        background: 
          "var(--color-background)",
          "background-dark": "var(--color-background-dark)",
        text: 
          "var(--color-text)",
          "text-dark": "var(--color-text-dark)",
        button: 
          "var(--color-button)",
          "button-hover": "var(--color-button-hover)",
          "button-dark": "var(--color-button-dark)",
          "button-hover-dark": "var(--color-button-hover-dark)",
      },
    },
  },
  plugins: [
      plugin(function ({ addUtilities }) {
        addUtilities({
          ".high-contrast": {
            backgroundColor: "black !important",
            color: "yellow !important",
          },
          ".high-contrast .bg-white": {
            backgroundColor: "black !important",
            color: "yellow !important",
          },
          ".high-contrast .text-gray-600": {
            color: "yellow !important",
          },
          ".high-contrast .dark\\:bg-gray-800": {
            backgroundColor: "black !important",
            color: "yellow !important",
          },
          ".high-contrast .dark\\:text-gray-300": {
            color: "yellow !important",
          },
      });
    }),
  ],
};