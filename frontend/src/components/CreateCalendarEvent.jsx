import { useState } from "react";
import PropTypes from "prop-types";
import { createCalendarEvent } from "../services/calendarService";

const CreateCalendarEvent = ({ userId, setEvents }) => {
    const [newEvent, setNewEvent] = useState({
        event_title: "",
        start_date: "",
        start_time: "09:00",
        end_date: "",
        end_time: "10:00",
        location: "",
        notes: "",
    });
    const [showModal, setShowModal] = useState(false);

    const handleCreateEvent = async () => {
        if (!newEvent.event_title.trim() || !newEvent.start_date) {
            alert("⚠️ Event title and start date are required.");
            return;
        }

        const createdEvent = await createCalendarEvent({ ...newEvent, user_id: userId });

        if (createdEvent) {
            setEvents(prev => [...prev, createdEvent]);
            setShowModal(false);
            setNewEvent({
                event_title: "",
                start_date: "",
                start_time: "09:00",
                end_date: "",
                end_time: "10:00",
                location: "",
                notes: "",
            });
        }
    };

    return (
        <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>
                ➕ Create Event
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-semibold">Create Event</h2>
                        
                        <label>Event Title</label>
                        <input 
                            type="text" 
                            value={newEvent.event_title} 
                            onChange={(e) => setNewEvent({ ...newEvent, event_title: e.target.value })} 
                            className="border p-2 rounded w-full"
                        />

                        <label>Location</label>
                        <input 
                            type="text" 
                            value={newEvent.location} 
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} 
                            className="border p-2 rounded w-full"
                        />

                        <label>Start Date & Time</label>
                        <div className="flex gap-2">
                            <input type="date" 
                                value={newEvent.start_date} 
                                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })} 
                                className="border p-2 rounded w-full"
                            />
                            <input type="time" 
                                value={newEvent.start_time} 
                                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })} 
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        <label>End Date & Time</label>
                        <div className="flex gap-2">
                            <input type="date" 
                                value={newEvent.end_date} 
                                onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })} 
                                className="border p-2 rounded w-full"
                            />
                            <input type="time" 
                                value={newEvent.end_time} 
                                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })} 
                                className="border p-2 rounded w-full"
                            />
                        </div>

                        <label>Notes</label>
                        <textarea 
                            value={newEvent.notes} 
                            onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })} 
                            className="border p-2 rounded w-full"
                        ></textarea>

                        <div className="flex justify-end gap-2 mt-4">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreateEvent}>Save</button>
                            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ✅ PropTypes Validation
CreateCalendarEvent.propTypes = {
    userId: PropTypes.number.isRequired,
    setEvents: PropTypes.func.isRequired,
};

export default CreateCalendarEvent;
