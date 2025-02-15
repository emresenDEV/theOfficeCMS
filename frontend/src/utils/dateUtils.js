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
