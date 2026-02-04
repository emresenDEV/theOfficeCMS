import PropTypes from "prop-types";
import { cn } from "../../lib/utils";

export function Separator({ orientation = "horizontal", className }) {
    return (
        <div
            role="separator"
            className={cn(
                orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
                "bg-border",
                className
            )}
        />
    );
}

Separator.propTypes = {
    orientation: PropTypes.oneOf(["horizontal", "vertical"]),
    className: PropTypes.string,
};
