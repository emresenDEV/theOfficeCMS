// src/components/ThemeContext.jsx
import { createContext, useContext, useLayoutEffect, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes

// Create the ThemeContext
const ThemeContext = createContext();

const applyThemeClass = (themeValue) => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = themeValue === "dark" || (themeValue === "system" && prefersDark);
    const root = document.getElementById("root");
    const targets = [document.documentElement, document.body, root].filter(Boolean);

    targets.forEach((el) => el.classList.remove("dark"));
    if (shouldUseDark) {
        targets.forEach((el) => el.classList.add("dark"));
    }

    const effectiveTheme = shouldUseDark ? "dark" : "light";
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.themePreference = themeValue;
    document.documentElement.style.colorScheme = effectiveTheme;
};

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(localStorage.getItem("theme") || "system");

    const setTheme = (nextTheme) => {
        setThemeState(nextTheme);
        applyThemeClass(nextTheme);
        localStorage.setItem("theme", nextTheme);
    };

    useLayoutEffect(() => {
        applyThemeClass(theme);
        localStorage.setItem("theme", theme);

        if (theme !== "system") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            applyThemeClass("system");
        };
        mediaQuery.addEventListener?.("change", handler);
        return () => mediaQuery.removeEventListener?.("change", handler);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Prop validation for ThemeProvider
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired, // Validate that children is a valid React node and is required
};

// Custom hook to use the ThemeContext
export const useTheme = () => useContext(ThemeContext);
