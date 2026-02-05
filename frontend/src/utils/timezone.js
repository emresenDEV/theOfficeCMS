export const getSystemTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
    } catch (err) {
        return "America/Chicago";
    }
};

export const getStoredTimeZoneMode = () => {
    return localStorage.getItem("timezone_mode") || "system";
};

export const getStoredTimeZone = () => {
    return localStorage.getItem("timezone") || null;
};

export const getEffectiveTimeZone = (user) => {
    const systemTz = getSystemTimeZone();
    const mode = user?.timezone_mode || getStoredTimeZoneMode();
    const fixed = user?.timezone || getStoredTimeZone() || systemTz;
    return mode === "fixed" ? fixed : systemTz;
};

export const formatDateTimeInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "—";
    const timeZone = getEffectiveTimeZone(user);
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(date);
};

export const formatDateInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "—";
    const timeZone = getEffectiveTimeZone(user);
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...options,
    }).format(date);
};

export const formatTimeInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "—";
    const timeZone = getEffectiveTimeZone(user);
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(date);
};
