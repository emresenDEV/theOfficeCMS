import { format } from "date-fns";
import { formatDateInTimeZone, formatDateTimeInTimeZone } from "./timezone";

// Convert to MM/DD/YYYY
export const formatDate = (rawDateTime) => {
    const formatted = formatDateInTimeZone(rawDateTime, null, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
    return formatted === "—" ? "N/A" : formatted;
};

// Convert to MM/DD/YYYY hh:mm a
export const formatDateTime = (rawDateTime) => {
    const formatted = formatDateTimeInTimeZone(rawDateTime, null, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
    return formatted === "—" ? "N/A" : formatted;
};

// For sending back to DB from input type="datetime-local"
export const toBackendTimestamp = (inputDateTime) => {
    if (!inputDateTime) return null;
    const date = new Date(inputDateTime);
    return format(date, "yyyy-MM-dd HH:mm:ss");
};

// ✅ Helper function to get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// ✅ Helper function to get current time in HH:MM AM/PM format (rounded to nearest 15 min)
export const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Round to nearest 15-minute interval
    const remainder = minutes % 15;
    if (remainder !== 0) {
        minutes += 15 - remainder;
        if (minutes >= 60) {
            minutes = 0;
            hours += 1;
        }
    }

    // Convert to 12-hour format with AM/PM
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert "0" to "12" for AM/PM format
    const formattedMinutes = String(minutes).padStart(2, "0");

    return `${hours}:${formattedMinutes} ${period}`;
};

// Convert a backend timestamp (e.g., "2025-03-23 19:48:13.486595") to mm/dd/yyyy
const parseBackendDate = (rawDate) => {
    if (!rawDate || typeof rawDate !== "string") return null;

    // Trim microseconds and add 'T' to make it ISO-8601
    const clean = rawDate.split(" ")[0] + "T" + rawDate.split(" ")[1].split(".")[0];
    const date = new Date(clean);

    return isNaN(date) ? null : date;
};
