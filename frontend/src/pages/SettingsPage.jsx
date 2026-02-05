import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../components/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import PropTypes from "prop-types";
import { getSystemTimeZone } from "../utils/timezone";
import { updateUser } from "../services/userService";

/**
 * SettingsPage Component
 * 
 * Allows users to customize their experience by adjusting settings such as:
 * - Light Mode
 * - Dark Mode
 * - Use System Theme (Auto)
 * - Font Size
 * - High Contrast Mode
 * 
 * @param {object} props - Component props.
 * @param {object} props.user - User information (firstName, lastName, role).
 * @returns {JSX.Element} - The rendered SettingsPage component.
 */
const SettingsPage = ({ user }) => {
  const location = useLocation();
  // State for theme, font size, high contrast
  const { setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("fontSize")) || 16);
  const [highContrast, setHighContrast] = useState(localStorage.getItem("highContrast") === "true");
  const detectedTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [timezoneMode, setTimezoneMode] = useState(
    user?.timezone_mode || localStorage.getItem("timezone_mode") || "system"
  );
  const [timezoneValue, setTimezoneValue] = useState(
    user?.timezone || localStorage.getItem("timezone") || detectedTimeZone
  );
  const [timezoneSaving, setTimezoneSaving] = useState(false);
  const [timezoneHighlight, setTimezoneHighlight] = useState(false);
  const [contactsAutosave, setContactsAutosave] = useState(
    user?.contacts_autosave ?? (localStorage.getItem("contacts_autosave") !== "false")
  );
  const [contactsSaving, setContactsSaving] = useState(false);

  const timeZones = useMemo(() => {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
    return [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
    ];
  }, []);

  // Apply high contrast mode
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("highContrast", highContrast);
  }, [highContrast]);

  // Apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("system_timezone", detectedTimeZone);
  }, [detectedTimeZone]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("highlight") !== "timezone") return;
    setTimezoneHighlight(true);
    const timeoutId = setTimeout(() => setTimezoneHighlight(false), 60_000);
    return () => clearTimeout(timeoutId);
  }, [location.search]);

  // Handle system preference changes
  // Reset all settings to default
  const resetSettings = () => {
    setTheme("system");
    setFontSize(16);
    setHighContrast(false);
    setTimezoneMode("system");
    setTimezoneValue(detectedTimeZone);
    localStorage.removeItem("theme");
    localStorage.removeItem("fontSize");
    localStorage.removeItem("highContrast");
    localStorage.removeItem("timezone_mode");
    localStorage.removeItem("timezone");
  };

  const saveTimezone = async () => {
    if (!user?.user_id) return;
    setTimezoneSaving(true);
    const payload = {
      timezone_mode: timezoneMode,
      timezone: timezoneMode === "fixed" ? timezoneValue : null,
      detected_timezone: detectedTimeZone,
      actor_user_id: user.user_id,
      actor_email: user.email,
    };
    const response = await updateUser(user.user_id, payload);
    if (response) {
      localStorage.setItem("timezone_mode", timezoneMode);
      if (timezoneMode === "fixed") {
        localStorage.setItem("timezone", timezoneValue);
      } else {
        localStorage.removeItem("timezone");
      }
    }
    setTimezoneSaving(false);
  };

  const saveContactsAutosave = async (value) => {
    if (!user?.user_id) return;
    setContactsSaving(true);
    const response = await updateUser(user.user_id, {
      contacts_autosave: value,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    if (response) {
      setContactsAutosave(value);
      localStorage.setItem("contacts_autosave", value ? "true" : "false");
    }
    setContactsSaving(false);
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold text-left text-foreground">Settings</h1>

        {/* Theme Selection */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-semibold text-foreground">Appearance</span>
          <ThemeToggle size="md" />
        </div>

        {/* Font Size Control */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-semibold text-foreground">Font Size</span>
          <div className="flex items-center space-x-3">
            <button
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg"
              onClick={() => setFontSize(fontSize - 2)}
              disabled={fontSize <= 12}
            >
              A-
            </button>
            <span className="text-lg text-foreground">{fontSize}px</span>
            <button
              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg"
              onClick={() => setFontSize(fontSize + 2)}
              disabled={fontSize >= 24}
            >
              A+
            </button>
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-semibold text-foreground">High Contrast Mode</span>
          <button
            className={`px-4 py-2 rounded-lg transition ${
              highContrast ? "bg-warning text-warning-foreground" : "bg-secondary text-secondary-foreground"
            }`}
            onClick={() => setHighContrast(!highContrast)}
          >
            {highContrast ? "Disable" : "Enable"}
          </button>
        </div>

        {/* Timezone Settings */}
        <div
          className={`mt-6 rounded-lg border border-border bg-card p-4 ${
            timezoneHighlight ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Timezone</p>
              <p className="text-xs text-muted-foreground">
                System detected: {detectedTimeZone}
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              onClick={saveTimezone}
              disabled={timezoneSaving}
            >
              {timezoneSaving ? "Saving..." : "Save Timezone"}
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-foreground">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="timezoneMode"
                value="system"
                checked={timezoneMode === "system"}
                onChange={() => setTimezoneMode("system")}
              />
              Use system timezone (recommended if you travel often)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="timezoneMode"
                value="fixed"
                checked={timezoneMode === "fixed"}
                onChange={() => setTimezoneMode("fixed")}
              />
              Use fixed timezone across all devices
            </label>
          </div>
          {timezoneMode === "fixed" && (
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select timezone
              </label>
              <select
                className="mt-2 w-full rounded-lg border border-border bg-card p-2 text-sm text-foreground"
                value={timezoneValue}
                onChange={(e) => setTimezoneValue(e.target.value)}
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Contacts Autosave */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="font-semibold text-foreground">Contacts Autosave</p>
            <p className="text-xs text-muted-foreground">
              Default autosave behavior for contact edits. You can override per contact.
            </p>
          </div>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              contactsAutosave ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
            onClick={() => saveContactsAutosave(!contactsAutosave)}
            disabled={contactsSaving}
          >
            {contactsSaving ? "Saving..." : contactsAutosave ? "Autosave On" : "Autosave Off"}
          </button>
        </div>

        {/* Reset to Default Settings */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-semibold text-foreground">Reset Settings</span>
          <button
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
            onClick={resetSettings}
          >
            Reset to Default
          </button>
        </div>
      </div>
  );
};

SettingsPage.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    role: PropTypes.string,
    user_id: PropTypes.number,
    id: PropTypes.number,
    email: PropTypes.string,
    timezone: PropTypes.string,
    timezone_mode: PropTypes.string,
    contacts_autosave: PropTypes.bool,
  }).isRequired,
};

export default SettingsPage;
