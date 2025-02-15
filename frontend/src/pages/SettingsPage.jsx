import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

/**
 * SettingsPage Component
 * 
 * Allows users to customize their experience by adjusting settings such as:
 * - Dark Mode (manual or system preference)
 * - Font Size
 * - High Contrast Mode
 * 
 * @param {object} props - Component props.
 * @param {object} props.user - User information (firstName, lastName, role).
 * @returns {JSX.Element} - The rendered SettingsPage component.
 */

const SettingsPage = ({ user }) => {
  // State for dark mode, font size, high contrast, and system preference
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("fontSize")) || 16);
  const [highContrast, setHighContrast] = useState(localStorage.getItem("highContrast") === "true");
  const [useSystemTheme, setUseSystemTheme] = useState(localStorage.getItem("useSystemTheme") === "true");

  // Apply theme changes when toggled
  useEffect(() => {
    if (useSystemTheme) {
      // Sync with system preference
      const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemDarkMode);
      localStorage.setItem("theme", systemDarkMode ? "dark" : "light");
    } else {
      // Use manual dark mode setting
      document.documentElement.classList.toggle("dark", darkMode);
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    }
  }, [darkMode, useSystemTheme]);

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
      if (useSystemTheme) {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [useSystemTheme]);

  // Reset all settings to default
  const resetSettings = () => {
    setDarkMode(false);
    setFontSize(16);
    setHighContrast(false);
    setUseSystemTheme(true);
    localStorage.removeItem("theme");
    localStorage.removeItem("fontSize");
    localStorage.removeItem("highContrast");
    localStorage.removeItem("useSystemTheme");
  };

  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main Settings Page */}
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Dark Mode Toggle */}
        <div className="mt-6 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Dark Mode</span>
          <div className="flex items-center space-x-3">
            <button
              className={`px-4 py-2 rounded-lg transition ${
                darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
              }`}
              onClick={() => {
                setDarkMode(!darkMode);
                setUseSystemTheme(false); // Disable system theme when manually toggling
              }}
              disabled={useSystemTheme}
            >
              {darkMode ? "Disable" : "Enable"}
            </button>
            <span className="text-gray-700 dark:text-gray-300">or</span>
            <button
              className={`px-4 py-2 rounded-lg transition ${
                useSystemTheme ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
              onClick={() => setUseSystemTheme(!useSystemTheme)}
            >
              {useSystemTheme ? "Using System" : "Use System Theme"}
            </button>
          </div>
        </div>

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