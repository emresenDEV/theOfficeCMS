import { StrictMode } from 'react' //for development, catches bugs early/depreciated APIs.
import { createRoot } from 'react-dom/client' //future-proof, improve performance, enables React18. Alternative to using ReactDOM.render (which updates one at a time), batches updates into one render-more efficient. 
import './index.css'
import { ThemeProvider } from "./components/ThemeContext";
import App from './App.jsx'

// Apply dark mode and high contrast mode based on localStorage
const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

// Check localStorage for theme and high contrast settings
const theme = localStorage.getItem("theme") || "system";
const highContrast = localStorage.getItem("highContrast") === "true";

// Apply classes to the root element
if (theme === "dark") {
  document.documentElement.classList.add("dark");
} else if (theme === "system") {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", prefersDark);
} else {
  document.documentElement.classList.remove("dark");
}

if (highContrast) {
  document.documentElement.classList.add("high-contrast");
} else {
  document.documentElement.classList.remove("high-contrast");
}

// Render the app
root.render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
