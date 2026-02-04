import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

const VARIANTS = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
    ghost:
        "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
    link:
        "bg-transparent text-blue-600 underline-offset-4 hover:underline dark:text-blue-300",
    destructive:
        "bg-red-600 text-white hover:bg-red-700",
    success:
        "bg-emerald-600 text-white hover:bg-emerald-700",
};

const SIZES = {
    default: "h-9 px-4 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-5 text-sm",
    icon: "h-9 w-9",
};

export function Button({
    className,
    variant = "default",
    size = "default",
    type = "button",
    ...props
}) {
    return (
        <button
            type={type}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:opacity-50 disabled:pointer-events-none",
                VARIANTS[variant],
                SIZES[size],
                className
            )}
            {...props}
        />
    );
}

Button.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(Object.keys(VARIANTS)),
    size: PropTypes.oneOf(Object.keys(SIZES)),
    type: PropTypes.string,
};
