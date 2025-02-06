import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const SettingsPage = ({ user }) => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("fontSize")) || 16);
  const [highContrast, setHighContrast] = useState(localStorage.getItem("highContrast") === "true");

  // Apply theme changes when toggled
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("highContrast", highContrast);
  }, [highContrast]);

  // Apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

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
          <button
            className={`px-4 py-2 rounded-lg transition ${
              darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Disable" : "Enable"}
          </button>
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
            <span className="text-lg">{fontSize}px</span>
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
