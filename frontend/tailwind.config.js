/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media", // or 'media' or 'class'. Media changes based on system settings, class changes manually with a class
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
  plugins: [],
};