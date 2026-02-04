import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

const VARIANTS = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    secondary: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
    outline: "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200",
};

export function Badge({ className, variant = "default", ...props }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                VARIANTS[variant],
                className
            )}
            {...props}
        />
    );
}

Badge.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(Object.keys(VARIANTS)),
};
