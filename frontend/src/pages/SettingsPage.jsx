import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../components/ThemeContext";
import PropTypes from "prop-types";

/**
 * SettingsPage Component
 * 
 * Allows users to customize their experience by adjusting settings such as:
 * - Light Mode
 * - Dark Mode
 * - Use System Theme (Auto)
 * - Font Size
 * - High Contrast Mode
 * 
 * @param {object} props - Component props.
 * @param {object} props.user - User information (firstName, lastName, role).
 * @returns {JSX.Element} - The rendered SettingsPage component.
 */
const SettingsPage = ({ user }) => {
  // State for theme, font size, high contrast
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("fontSize")) || 16);
  const [highContrast, setHighContrast] = useState(localStorage.getItem("highContrast") === "true");

  // Apply theme changes when toggled
  useEffect(() => {
    if (theme === "system") {
      // Sync with system preference
      const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemDarkMode);
      localStorage.setItem("theme", "system");
    } else {
      // Use manual theme setting
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Apply high contrast mode
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("highContrast", highContrast);
  }, [highContrast]);

  // Apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  // Handle system preference changes
  useEffect(() => {
    const handleSystemThemeChange = (e) => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  // Reset all settings to default
  const resetSettings = () => {
    setTheme("system");
    setFontSize(16);
    setHighContrast(false);
    localStorage.removeItem("theme");
    localStorage.removeItem("fontSize");
    localStorage.removeItem("highContrast");
  };

  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main Settings Page */}
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl font-bold text-left">Settings</h1>

        {/* Theme Selection */}
        {/* <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 text-left">Appearance</h2> */}

          {/* Light Mode */}
          {/* <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 dark:text-gray-300">Light Mode</span>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                theme === "light" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
              onClick={() => setTheme("light")}
            >
              {theme === "light" ? "Enabled" : "Enable"}
            </button>
          </div> */}

          {/* Dark Mode */}
          {/* <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                theme === "dark" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
              onClick={() => setTheme("dark")}
            >
              {theme === "dark" ? "Enabled" : "Enable"}
            </button>
          </div> */}

          {/* Use System Theme (Auto) */}
          {/* <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Use System Theme (Auto)</span>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                theme === "system" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
              onClick={() => setTheme("system")}
            >
              {theme === "system" ? "Auto" : "Set to Auto"}
            </button>
          </div> */}
        {/* </div> */}

        {/* Font Size Control */}
        <div className="mt-6 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Font Size</span>
          <div className="flex items-center space-x-3">
            <button
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded-lg"
              onClick={() => setFontSize(fontSize - 2)}
              disabled={fontSize <= 12}
            >
              A-
            </button>
            <span className="text-lg text-gray-700 dark:text-gray-300">{fontSize}px</span>
            <button
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-black dark:text-white rounded-lg"
              onClick={() => setFontSize(fontSize + 2)}
              disabled={fontSize >= 24}
            >
              A+
            </button>
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="mt-6 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 dark:text-gray-300">High Contrast Mode</span>
          <button
            className={`px-4 py-2 rounded-lg transition ${
              highContrast ? "bg-yellow-500 text-black" : "bg-gray-300 text-black"
            }`}
            onClick={() => setHighContrast(!highContrast)}
          >
            {highContrast ? "Disable" : "Enable"}
          </button>
        </div>

        {/* Reset to Default Settings */}
        <div className="mt-6 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Reset Settings</span>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={resetSettings}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

SettingsPage.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
};

export default SettingsPage;