import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import PropTypes from "prop-types";
import { updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";

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
        }
    }, [event, isOpen]);

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
                ...editedEvent,
                start_time: convertTo24HourFormat(editedEvent.start_time),
                end_time: convertTo24HourFormat(editedEvent.end_time),
            };

            console.log("Updating event:", updatedData);
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
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditMode ? "Edit Event" : "Event Details"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
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
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.event_title || ""}
                                    onChange={(e) => handleInputChange("event_title", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter event title"
                                    disabled={loading}
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={editedEvent.start_date || ""}
                                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={editedEvent.end_date || ""}
                                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    disabled={loading}
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Start Time
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.start_time || ""}
                                    onChange={(e) => handleTimeChange("start_time", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="12:00 AM"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    End Time
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.end_time || ""}
                                    onChange={(e) => handleInputChange("end_time", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="1:00 AM"
                                    disabled={loading}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.location || ""}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter location"
                                    disabled={loading}
                                />
                            </div>

                            {/* Contact Name */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.contact_name || ""}
                                    onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter contact name"
                                    disabled={loading}
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent.phone_number || ""}
                                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter phone number"
                                    disabled={loading}
                                />
                            </div>

                            {/* Event Details / Notes */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={editedEvent.event_details || ""}
                                    onChange={(e) => handleInputChange("event_details", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm resize-none"
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
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {event.event_title}
                                </h3>
                            </div>

                            <div className="space-y-3 text-sm text-gray-700">
                                <div>
                                    <span className="font-semibold">📅 Date & Time:</span>
                                    <p className="text-gray-600">{formattedDate} at {formattedTime}</p>
                                </div>

                                {event.contact_name && (
                                    <div>
                                        <span className="font-semibold">👤 Contact:</span>
                                        <p className="text-gray-600">{event.contact_name}</p>
                                    </div>
                                )}

                                {event.phone_number && (
                                    <div>
                                        <span className="font-semibold">📱 Phone:</span>
                                        <p className="text-gray-600">{event.phone_number}</p>
                                    </div>
                                )}

                                {event.location && (
                                    <div>
                                        <span className="font-semibold">📍 Location:</span>
                                        <p className="text-gray-600">{event.location}</p>
                                    </div>
                                )}

                                {event.event_details && (
                                    <div>
                                        <span className="font-semibold">Notes:</span>
                                        <p className="text-gray-600">{event.event_details}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-2 justify-between">
                    <div className="flex gap-2">
                        {!isEditMode && (
                            showDeleteConfirm ? (
                                <>
                                    <button
                                        onClick={cancelDelete}
                                        className="px-3 py-2 rounded bg-gray-400 text-white text-sm font-semibold hover:bg-gray-500 disabled:opacity-50"
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
                                    className="px-4 py-2 rounded bg-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-400 disabled:opacity-50"
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
        event_details: PropTypes.string,
    }),
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
};

export default EventDetailsModal;
