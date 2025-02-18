// src/components/ThemeContext.jsx
import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types"; // Import PropTypes

// Create the ThemeContext
const ThemeContext = createContext();

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");

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