import PropTypes from "prop-types";
import { useTheme } from "./ThemeContext";
import { cn } from "../lib/utils";

export const ThemeToggle = ({ size = "sm", className }) => {
    const { theme, setTheme } = useTheme();

    const sizes = {
        sm: "h-8 text-xs",
        md: "h-9 text-sm",
    };

    const buttonClasses = (value) =>
        cn(
            "px-3 transition-colors rounded-full",
            theme === value
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        );

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900",
                sizes[size],
                className
            )}
            role="group"
            aria-label="Theme selection"
        >
            <button
                type="button"
                className={buttonClasses("light")}
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
            >
                Light
            </button>
            <button
                type="button"
                className={buttonClasses("dark")}
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
            >
                Dark
            </button>
            <button
                type="button"
                className={buttonClasses("system")}
                aria-pressed={theme === "system"}
                onClick={() => setTheme("system")}
            >
                System
            </button>
        </div>
    );
};

ThemeToggle.propTypes = {
    size: PropTypes.oneOf(["sm", "md"]),
    className: PropTypes.string,
};
