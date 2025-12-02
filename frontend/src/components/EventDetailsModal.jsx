import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import PropTypes from "prop-types";

const EventDetailsModal = ({ event, isOpen, onClose, onEdit, onSave, isEditing = false }) => {
    const [editedEvent, setEditedEvent] = useState(null);
    const [isEditMode, setIsEditMode] = useState(isEditing);

    useEffect(() => {
        if (event) {
            setEditedEvent({ ...event });
        }
    }, [event, isOpen]);

    if (!isOpen || !event) return null;

    const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
    const formattedDate = eventDate.toFormat("MMMM d, yyyy");
    const formattedTime = eventDate.toFormat("h:mm a");

    const handleInputChange = (field, value) => {
        setEditedEvent(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(editedEvent);
        }
        setIsEditMode(false);
    };

    const handleEdit = () => {
        setIsEditMode(true);
        if (onEdit) {
            onEdit(event);
        }
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
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {isEditMode ? (
                        <>
                            {/* Event Title */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Event Title
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent?.event_title || ""}
                                    onChange={(e) => handleInputChange("event_title", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter event title"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={editedEvent?.start_date || ""}
                                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                />
                            </div>

                            {/* Time */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={editedEvent?.start_time || ""}
                                    onChange={(e) => handleInputChange("start_time", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent?.location || ""}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter location"
                                />
                            </div>

                            {/* Contact Name */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={editedEvent?.contact_name || ""}
                                    onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    placeholder="Enter contact name"
                                />
                            </div>

                            {/* Event Details */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">
                                    Details
                                </label>
                                <textarea
                                    value={editedEvent?.event_details || ""}
                                    onChange={(e) => handleInputChange("event_details", e.target.value)}
                                    className="w-full px-3 py-2 border rounded text-sm resize-none"
                                    rows="4"
                                    placeholder="Enter event details"
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

                            <div className="space-y-2 text-sm text-gray-700">
                                <div>
                                    <span className="font-semibold">Date & Time:</span> {formattedDate} at {formattedTime}
                                </div>

                                {event.location && (
                                    <div>
                                        <span className="font-semibold">📍 Location:</span> {event.location}
                                    </div>
                                )}

                                {event.contact_name && (
                                    <div>
                                        <span className="font-semibold">👤 Contact:</span> {event.contact_name}
                                    </div>
                                )}

                                {event.event_details && (
                                    <div>
                                        <span className="font-semibold">Details:</span>
                                        <p className="mt-1 text-gray-600">{event.event_details}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-2 justify-end">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditedEvent(event);
                                }}
                                className="px-4 py-2 rounded bg-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded bg-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-400"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleEdit}
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                Edit
                            </button>
                        </>
                    )}
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
        location: PropTypes.string,
        contact_name: PropTypes.string,
        event_details: PropTypes.string,
    }),
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func,
    onSave: PropTypes.func,
    isEditing: PropTypes.bool,
};

export default EventDetailsModal;
