import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import PropTypes from "prop-types";
import { updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import CustomTimePicker from "./CustomTimePicker";

// Add one hour to time
const addOneHour = (time) => {
    const [hour, minute, period] = time.split(/[: ]/);
    let hourNum = parseInt(hour, 10);

    if (period === "PM" && hourNum !== 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;

    hourNum = (hourNum + 1) % 24;
    const newPeriod = hourNum >= 12 ? "PM" : "AM";
    const newHour = hourNum % 12 || 12;

    return `${newHour}:${minute} ${newPeriod}`;
};

// Convert 24-hour to 12-hour format
const convertTo12HourFormat = (time24h) => {
    if (!time24h) return "12:00 AM";

    const [hours, minutes] = time24h.split(":");
    let hour = parseInt(hours, 10);
    const minute = minutes;
    const period = hour >= 12 ? "PM" : "AM";

    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;

    return `${hour}:${minute} ${period}`;
};

// Convert to 24 hour format for API
const convertTo24HourFormat = (time12h) => {
    if (!time12h) return "00:00:00";

    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    hours = parseInt(hours, 10);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
};

const EventDetailsModal = ({ event, isOpen, onClose, onRefresh }) => {
    const [editedEvent, setEditedEvent] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [accountSearch, setAccountSearch] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    useEffect(() => {
        async function loadAccounts() {
            const fetchedAccounts = await fetchAccounts();
            setAccounts(fetchedAccounts);
        }
        loadAccounts();
    }, []);

    useEffect(() => {
        if (event && isOpen) {
            // Convert 24-hour times to 12-hour format for display/editing
            const displayEvent = {
                ...event,
                start_time: event.start_time ? convertTo12HourFormat(event.start_time) : "12:00 AM",
                end_time: event.end_time ? convertTo12HourFormat(event.end_time) : "1:00 AM",
            };
            console.log("🔍 Full Event Data in Modal:", event);
            console.log("📋 Edited Event State:", displayEvent);
            setEditedEvent(displayEvent);
            setIsEditMode(false);

            // Load selected account if event has account_id and accounts are loaded
            if (event.account_id && accounts.length > 0) {
                const account = accounts.find(a => a.account_id === event.account_id);
                if (account) {
                    console.log("✅ Found account for event:", account);
                    setSelectedAccount(account);
                    setAccountSearch(account.business_name);
                } else {
                    console.warn("⚠️ Account not found for account_id:", event.account_id);
                    setSelectedAccount(null);
                    setAccountSearch("");
                }
            } else {
                setSelectedAccount(null);
                setAccountSearch("");
            }
        }
    }, [event, isOpen, accounts]);

    if (!isOpen || !event) return null;

    const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
    const formattedDate = eventDate.toFormat("MMMM d, yyyy");
    const formattedTime = eventDate.toFormat("h:mm a");

    const handleInputChange = (field, value) => {
        setEditedEvent(prev => {
            const updated = { ...prev, [field]: value };
            // When start_date changes, automatically update end_date to same day
            if (field === "start_date") {
                updated.end_date = value;
            }
            return updated;
        });
    };

    const handleAccountSearch = (value) => {
        setAccountSearch(value);
        if (value.trim() === "") {
            setFilteredAccounts([]);
            setShowDropdown(false);
            return;
        }
        const matches = accounts.filter(account =>
            account.business_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredAccounts(matches);
        setShowDropdown(matches.length > 0);
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setEditedEvent(prevEvent => ({
            ...prevEvent,
            account_id: account.account_id,
            contact_name: account.contact_name || "",
            phone_number: account.phone_number || "",
            location: `${account.address}, ${account.city}, ${account.state} ${account.zip_code}`,
        }));
        setAccountSearch(account.business_name);
        setFilteredAccounts([]);
        setShowDropdown(false);
    };

    const handleTimeChange = (field, value) => {
        setEditedEvent(prev => {
            const updated = { ...prev, [field]: value };
            // When start_time changes, automatically update end_time
            if (field === "start_time") {
                updated.end_time = addOneHour(value);
            }
            return updated;
        });
    };

    const handleSave = async () => {
        if (!editedEvent.event_title.trim()) {
            alert("Event title is required");
            return;
        }

        setLoading(true);
        try {
            const updatedData = {
                event_id: editedEvent.event_id,
                event_title: editedEvent.event_title,
                start_date: editedEvent.start_date,
                end_date: editedEvent.end_date,
                start_time: convertTo24HourFormat(editedEvent.start_time),
                end_time: convertTo24HourFormat(editedEvent.end_time),
                location: editedEvent.location,
                contact_name: editedEvent.contact_name || "",
                phone_number: editedEvent.phone_number || "",
                notes: editedEvent.notes || "",
                account_id: editedEvent.account_id || null,
                user_id: editedEvent.user_id,
            };

            console.log("📝 Updating event with data:", updatedData);
            const result = await updateCalendarEvent(event.event_id, updatedData);

            if (result) {
                console.log("✅ Event updated successfully");
                onRefresh();
                onClose();
            } else {
                console.error("❌ Failed to update event");
            }
        } catch (error) {
            console.error("Error updating event:", error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            console.log("Deleting event:", event.event_id);
            const result = await deleteCalendarEvent(event.event_id);

            if (result.success) {
                console.log("✅ Event deleted successfully");
                onRefresh();
                onClose();
            } else {
                console.error("❌ Failed to delete event");
            }
        } catch (error) {
            console.error("Error deleting event:", error);
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {isEditMode ? "Edit Event" : "Event Details"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl font-bold"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {isEditMode && editedEvent ? (
                        <>
                            {/* Event Title */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.event_title || ""}
                                    onChange={(e) => handleInputChange("event_title", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    placeholder="Enter event title"
                                    disabled={loading}
                                />
                            </div>

                            {/* Account Search */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Search for an Account
                                </label>
                                <input
                                    type="text"
                                    value={accountSearch}
                                    onChange={(e) => handleAccountSearch(e.target.value)}
                                    placeholder="Search by account name..."
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm"
                                    disabled={loading}
                                />
                                {showDropdown && (
                                    <ul className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full mt-1 rounded shadow-lg max-h-48 overflow-y-auto z-50">
                                        {filteredAccounts.map(account => (
                                            <li
                                                key={account.account_id}
                                                onClick={() => handleSelectAccount(account)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200"
                                            >
                                                {account.business_name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {selectedAccount && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Selected: {selectedAccount.business_name}
                                    </p>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={editedEvent.start_date || ""}
                                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={editedEvent.end_date || ""}
                                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    disabled={loading}
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Start Time
                                </label>
                                <CustomTimePicker
                                    value={editedEvent.start_time || "12:00 AM"}
                                    onChange={(value) => handleTimeChange("start_time", value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    End Time
                                </label>
                                <CustomTimePicker
                                    value={editedEvent.end_time || "1:00 AM"}
                                    onChange={(value) => handleInputChange("end_time", value)}
                                    isEndTime={true}
                                    startTime={editedEvent.start_time}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.location || ""}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    placeholder="Enter location"
                                    disabled={loading}
                                />
                            </div>

                            {/* Contact Name */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.contact_name || ""}
                                    onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    placeholder="Enter contact name"
                                    disabled={loading}
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.phone_number || ""}
                                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm"
                                    placeholder="Enter phone number"
                                    disabled={loading}
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={editedEvent.notes || ""}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-sm resize-none"
                                    rows="4"
                                    placeholder="Enter notes"
                                    disabled={loading}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Display Mode */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    {event.event_title}
                                </h3>
                            </div>

                            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                                <div>
                                    <span className="font-semibold">📅 Start Date & Time:</span>
                                    <p className="text-slate-600 dark:text-slate-400">{formattedDate} at {formattedTime}</p>
                                </div>

                                {event.end_date && event.end_time && (
                                    <div>
                                        <span className="font-semibold">📅 End Date & Time:</span>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            {DateTime.fromISO(`${event.end_date}T${event.end_time}`).toFormat("MMMM d, yyyy")} at {DateTime.fromISO(`${event.end_date}T${event.end_time}`).toFormat("h:mm a")}
                                        </p>
                                    </div>
                                )}

                                {event.contact_name && (
                                    <div>
                                        <span className="font-semibold">👤 Contact:</span>
                                        <p className="text-slate-600 dark:text-slate-400">{event.contact_name}</p>
                                    </div>
                                )}

                                {event.phone_number && (
                                    <div>
                                        <span className="font-semibold">📱 Phone:</span>
                                        <p className="text-slate-600 dark:text-slate-400">{event.phone_number}</p>
                                    </div>
                                )}

                                {event.location && (
                                    <div>
                                        <span className="font-semibold">📍 Location:</span>
                                        <p className="text-slate-600 dark:text-slate-400">{event.location}</p>
                                    </div>
                                )}

                                {event.notes && (
                                    <div>
                                        <span className="font-semibold">📝 Notes:</span>
                                        <p className="text-slate-600 dark:text-slate-400">{event.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Associated Account Section */}
                            {selectedAccount && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Associated Account</h4>
                                    <div className="space-y-2 text-sm bg-blue-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <div>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Business:</span>
                                            <p className="text-slate-600 dark:text-slate-400">{selectedAccount.business_name}</p>
                                        </div>
                                        {selectedAccount.address && (
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Address:</span>
                                                <p className="text-slate-600 dark:text-slate-400">{selectedAccount.address}, {selectedAccount.city}, {selectedAccount.state} {selectedAccount.zip_code}</p>
                                            </div>
                                        )}
                                        {selectedAccount.contact_name && (
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span>
                                                <p className="text-slate-600 dark:text-slate-400">{selectedAccount.contact_name}</p>
                                            </div>
                                        )}
                                        {selectedAccount.phone_number && (
                                            <div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Phone:</span>
                                                <p className="text-slate-600 dark:text-slate-400">{selectedAccount.phone_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex gap-2 justify-between">
                    <div className="flex gap-2">
                        {!isEditMode && (
                            showDeleteConfirm ? (
                                <>
                                    <button
                                        onClick={cancelDelete}
                                        className="px-3 py-2 rounded bg-slate-400 text-white text-sm font-semibold hover:bg-slate-500 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-3 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {loading ? "Deleting..." : "Yes"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-3 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            )
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setEditedEvent(event);
                                    }}
                                    className="px-4 py-2 rounded bg-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-400 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

EventDetailsModal.propTypes = {
    event: PropTypes.shape({
        event_id: PropTypes.number,
        event_title: PropTypes.string,
        start_date: PropTypes.string,
        start_time: PropTypes.string,
        end_date: PropTypes.string,
        end_time: PropTypes.string,
        location: PropTypes.string,
        contact_name: PropTypes.string,
        phone_number: PropTypes.string,
        notes: PropTypes.string,
        user_id: PropTypes.number,
    }),
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
};

export default EventDetailsModal;
