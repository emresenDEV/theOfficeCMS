import PropTypes from "prop-types";
import { updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";

const EditCalendarEvent = ({ event, setShowModal, setEvents }) => {
    const handleUpdateEvent = async () => {
        await updateCalendarEvent(event.event_id, event);
        setEvents(prev => prev.map(e => (e.event_id === event.event_id ? event : e)));
        setShowModal(false);
    };

    const handleDeleteEvent = async () => {
        await deleteCalendarEvent(event.event_id);
        setEvents(prev => prev.filter(e => e.event_id !== event.event_id));
        setShowModal(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-semibold">Edit Event</h2>

                <label>Event Title</label>
                <input 
                    type="text" 
                    value={event.event_title} 
                    onChange={(e) => event.event_title = e.target.value} 
                    className="border p-2 rounded w-full"
                />

                <label>Location</label>
                <input 
                    type="text" 
                    value={event.location} 
                    onChange={(e) => event.location = e.target.value} 
                    className="border p-2 rounded w-full"
                />

                <label>Start Date & Time</label>
                <div className="flex gap-2">
                    <input type="date" 
                        value={event.start_date} 
                        onChange={(e) => event.start_date = e.target.value} 
                        className="border p-2 rounded w-full"
                    />
                    <input type="time" 
                        value={event.start_time} 
                        onChange={(e) => event.start_time = e.target.value} 
                        className="border p-2 rounded w-full"
                    />
                </div>

                <label>End Date & Time</label>
                <div className="flex gap-2">
                    <input type="date" 
                        value={event.end_date} 
                        onChange={(e) => event.end_date = e.target.value} 
                        className="border p-2 rounded w-full"
                    />
                    <input type="time" 
                        value={event.end_time} 
                        onChange={(e) => event.end_time = e.target.value} 
                        className="border p-2 rounded w-full"
                    />
                </div>

                <label>Notes</label>
                <textarea 
                    value={event.notes} 
                    onChange={(e) => event.notes = e.target.value} 
                    className="border p-2 rounded w-full"
                ></textarea>

                <div className="flex justify-end gap-2 mt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleUpdateEvent}>Save</button>
                    <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDeleteEvent}>Delete</button>
                    <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setShowModal(false)}>Cancel</button>
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
