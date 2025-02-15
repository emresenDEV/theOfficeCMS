import { useState } from "react";
import PropTypes from "prop-types";
import { updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";

const EditCalendarEvent = ({ event, setShowModal, setEvents }) => {
    const [updatedEvent, setUpdatedEvent] = useState({ ...event });

    /** ✅ Handle Input Change */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedEvent((prev) => ({ ...prev, [name]: value }));
    };


 /** ✅ Handle Updating Event */
    const handleUpdateEvent = async () => {
        const response = await updateCalendarEvent(updatedEvent.event_id, updatedEvent);
        if (response) {
            setEvents((prev) => prev.map(e => (e.event_id === updatedEvent.event_id ? updatedEvent : e)));
            setShowModal(false);
        }
    };

/** ✅ Handle Deleting Event */
    const handleDeleteEvent = async () => {
        await deleteCalendarEvent(updatedEvent.event_id);
        setEvents(prev => prev.filter(e => e.event_id !== updatedEvent.event_id));
        setShowModal(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">{/* z-50 pointer-events-auto (replace relative with this if needed) */}
                {/* Cancel Button (X) */}
                <button
                    className="absolute top-2 left-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowModal(false)}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                {/* Modal Header */}
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Event</h2>
                {/* Event Title */}
                < div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input 
                    type="text"
                    name="event_title" 
                    value={updatedEvent.event_title} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                />
                </div>
                {/* Location */}
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                    type="text"
                    name="location"
                    value={updatedEvent.location} 
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                />
                </div>
                {/* Start Date and Time */}
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                    <div className="flex gap-2">
                        <input type="date" 
                            name="start_time"
                            value={updatedEvent.start_date} 
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full"
                        />
                        <input type="time" 
                            name="start_time"
                            value={updatedEvent.start_time} 
                            onChange={handleInputChange} 
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
                {/* End Date and Time */}
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                    <div className="flex gap-2">
                        <input type="date" 
                            name="end_date"
                            value={updatedEvent.end_date} 
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full"
                        />
                        <input type="time" 
                            name="end_time"
                            value={updatedEvent.end_time} 
                            onChange={handleInputChange} 
                            className="border p-2 rounded w-full"
                        />
                    </div>
                </div>
                {/* End Date and Time */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        name="notes" 
                        value={updatedEvent.notes} 
                        onChange={handleInputChange}
                        className="border p-2 rounded w-full"
                        rows="3"
                    ></textarea>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-2">
                        <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50" onClick={handleDeleteEvent}>Delete</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" onClick={handleUpdateEvent}>Save</button>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ PropTypes Validation
EditCalendarEvent.propTypes = {
    event: PropTypes.object.isRequired,
    setShowModal: PropTypes.func.isRequired,
    setEvents: PropTypes.func.isRequired,
};

export default EditCalendarEvent;
