import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

export function Input({ className, type = "text", ...props }) {
    return (
        <input
            type={type}
            className={cn(
                "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-blue-900/40",
                className
            )}
            {...props}
        />
    );
}

Input.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
};
