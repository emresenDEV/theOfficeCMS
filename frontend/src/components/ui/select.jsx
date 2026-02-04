import React from "react";
import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

export const Select = ({ value, onValueChange, children }) => {
    return (
        <div className="relative inline-flex w-full">
            {React.Children.map(children, (child) => {
                if (!child) return null;
                if (child.type.displayName === "SelectTrigger") {
                    return React.cloneElement(child, { value, onValueChange });
                }
                return child;
            })}
        </div>
    );
};

Select.propTypes = {
    value: PropTypes.string,
    onValueChange: PropTypes.func,
    children: PropTypes.node,
};

const SelectTrigger = ({ className, value, onValueChange, children }) => {
    return (
        <select
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            className={cn(
                "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                className
            )}
        >
            {children}
        </select>
    );
};

SelectTrigger.displayName = "SelectTrigger";
SelectTrigger.propTypes = {
    className: PropTypes.string,
    value: PropTypes.string,
    onValueChange: PropTypes.func,
    children: PropTypes.node,
};

export const SelectValue = ({ placeholder }) => {
    return <option value="">{placeholder}</option>;
};

SelectValue.propTypes = {
    placeholder: PropTypes.string,
};

export const SelectContent = ({ children }) => <>{children}</>;
SelectContent.propTypes = {
    children: PropTypes.node,
};

export const SelectItem = ({ value, children }) => (
    <option value={value}>{children}</option>
);

SelectItem.propTypes = {
    value: PropTypes.string.isRequired,
    children: PropTypes.node,
};

export { SelectTrigger };
