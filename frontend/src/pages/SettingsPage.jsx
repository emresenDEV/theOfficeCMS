import { useEffect, useState } from "react";
import { useTheme } from "../components/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
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
  const { setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("fontSize")) || 16);
  const [highContrast, setHighContrast] = useState(localStorage.getItem("highContrast") === "true");

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
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold text-left text-slate-900 dark:text-slate-100">Settings</h1>

        {/* Theme Selection */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Appearance</span>
          <ThemeToggle size="md" />
        </div>

        {/* Font Size Control */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Font Size</span>
          <div className="flex items-center space-x-3">
            <button
              className="px-3 py-1 bg-slate-200 text-slate-900 rounded-lg dark:bg-slate-800 dark:text-slate-100"
              onClick={() => setFontSize(fontSize - 2)}
              disabled={fontSize <= 12}
            >
              A-
            </button>
            <span className="text-lg text-slate-700 dark:text-slate-200">{fontSize}px</span>
            <button
              className="px-3 py-1 bg-slate-200 text-slate-900 rounded-lg dark:bg-slate-800 dark:text-slate-100"
              onClick={() => setFontSize(fontSize + 2)}
              disabled={fontSize >= 24}
            >
              A+
            </button>
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-200">High Contrast Mode</span>
          <button
            className={`px-4 py-2 rounded-lg transition ${
              highContrast ? "bg-yellow-500 text-black" : "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            }`}
            onClick={() => setHighContrast(!highContrast)}
          >
            {highContrast ? "Disable" : "Enable"}
          </button>
        </div>

        {/* Reset to Default Settings */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Reset Settings</span>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={resetSettings}
          >
            Reset to Default
          </button>
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
