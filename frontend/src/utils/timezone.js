import { DateTime } from "luxon";

const DEFAULT_BASE_TIMEZONE = "America/Chicago";

const safeLocalStorageGet = (key) => {
    try {
        return localStorage.getItem(key);
    } catch (err) {
        return null;
    }
};

export const getSystemTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_BASE_TIMEZONE;
    } catch (err) {
        return DEFAULT_BASE_TIMEZONE;
    }
};

export const getBaseTimeZone = () => {
    return safeLocalStorageGet("base_timezone") || DEFAULT_BASE_TIMEZONE;
};

export const getStoredTimeZoneMode = () => {
    return safeLocalStorageGet("timezone_mode") || "system";
};

export const getStoredTimeZone = () => {
    return safeLocalStorageGet("timezone") || null;
};

export const getEffectiveTimeZone = (user) => {
    const systemTz = getSystemTimeZone();
    const mode = user?.timezone_mode || getStoredTimeZoneMode();
    const fixed = user?.timezone || getStoredTimeZone() || systemTz;
    return mode === "fixed" ? fixed : systemTz;
};

const parseInputToDateTime = (dateInput, baseZone = getBaseTimeZone()) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        return DateTime.fromJSDate(dateInput);
    }
    if (DateTime.isDateTime?.(dateInput)) {
        return dateInput;
    }
    if (typeof dateInput === "string") {
        const trimmed = dateInput.trim();
        if (!trimmed) return null;
        const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
        if (trimmed.includes("T")) {
            return DateTime.fromISO(trimmed, hasZone ? {} : { zone: baseZone });
        }
        if (trimmed.includes(" ")) {
            return DateTime.fromSQL(trimmed, { zone: baseZone });
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return DateTime.fromISO(trimmed, { zone: baseZone });
        }
        const parsed = DateTime.fromRFC2822(trimmed);
        return parsed.isValid ? parsed : DateTime.fromISO(trimmed, { zone: baseZone });
    }
    const fallback = new Date(dateInput);
    return Number.isNaN(fallback.getTime()) ? null : DateTime.fromJSDate(fallback);
};

const formatWithIntl = (dateTime, timeZone, options) => {
    const jsDate = dateTime.toJSDate();
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        ...options,
    }).format(jsDate);
};

export const formatDateTimeInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const dateTime = parseInputToDateTime(dateInput);
    if (!dateTime || !dateTime.isValid) return "—";
    const timeZone = getEffectiveTimeZone(user);
    return formatWithIntl(dateTime, timeZone, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    });
};

export const formatDateInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const timeZone = getEffectiveTimeZone(user);
    if (typeof dateInput === "string") {
        const trimmed = dateInput.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const dateTime = DateTime.fromISO(trimmed, { zone: timeZone });
            if (!dateTime.isValid) return "—";
            return formatWithIntl(dateTime, timeZone, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                ...options,
            });
        }
    }
    const dateTime = parseInputToDateTime(dateInput);
    if (!dateTime || !dateTime.isValid) return "—";
    return formatWithIntl(dateTime, timeZone, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...options,
    });
};

export const formatTimeInTimeZone = (dateInput, user, options = {}) => {
    if (!dateInput) return "—";
    const dateTime = parseInputToDateTime(dateInput);
    if (!dateTime || !dateTime.isValid) return "—";
    const timeZone = getEffectiveTimeZone(user);
    return formatWithIntl(dateTime, timeZone, {
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    });
};

export const formatShortDateInTimeZone = (dateInput, user, options = {}) => {
    return formatDateInTimeZone(dateInput, user, {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options,
    });
};
