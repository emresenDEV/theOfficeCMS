import PropTypes from "prop-types";
import { format } from "date-fns";

const SelectedEventDetails = ({ events = [], selectedDate = "", onEdit = () => {} }) => {
    // Prevent `.map()` error by ensuring `events` is always an array
    if (!Array.isArray(events)) {
        console.error("❌ Expected 'events' to be an array, but got:", events);
        return <p className="text-gray-500 text-sm italic">No events found.</p>;
    }

    return (
        <div className="mt-6">
            <h2 className="text-lg font-bold text-gray-700">
                {selectedDate ? `Events on ${selectedDate}` : "Select a day to view event details"}
            </h2>

            {/* If no events on the selected day */}
            {selectedDate && events.length === 0 && (
                <p className="text-gray-600">No events scheduled for this day.</p>
            )}

            {/* Render each event */}
            {events.map(event => (
                <div key={event.event_id} className="bg-white p-4 rounded-lg shadow-md mt-4 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-sm text-gray-600">
                            {event.start_date} {event.start_date !== event.end_date ? `- ${event.end_date}` : ""}
                        </p>
                        <p className="text-lg font-bold">{event.event_title}</p>
                        <p>{event.location}</p>
                        <p className="text-sm text-gray-600">
                            {format(new Date(`1970-01-01T${event.start_time}`), "h:mm a")} - {format(new Date(`1970-01-01T${event.end_time}`), "h:mm a")}
                        </p>
                        {event.account_id && <p className="text-sm">Account: {event.account_id}</p>}
                        {event.contact_name && <p className="text-sm">Contact: {event.contact_name}</p>}
                        {event.phone_number && <p className="text-sm">Phone: {event.phone_number}</p>}
                        <p className="text-gray-600 mt-2">{event.notes}</p>
                    </div>

                    {/* Edit Button */}
                    <button 
                        className="border border-blue-600 text-blue-600 px-3 py-1 rounded text-sm"
                        onClick={() => onEdit(event)}
                    >
                        Edit
                    </button>
                </div>
            ))}
        </div>
    );
};

// **PropTypes Validation**
SelectedEventDetails.propTypes = {
    events: PropTypes.arrayOf(
        PropTypes.shape({
            event_id: PropTypes.number.isRequired,
            event_title: PropTypes.string.isRequired,
            start_date: PropTypes.string.isRequired,
            end_date: PropTypes.string.isRequired,
            start_time: PropTypes.string.isRequired,
            end_time: PropTypes.string.isRequired,
            location: PropTypes.string,
            account_id: PropTypes.number,
            contact_name: PropTypes.string,
            phone_number: PropTypes.string,
            notes: PropTypes.string,
        })
    ).isRequired,
    selectedDate: PropTypes.string.isRequired,
    onEdit: PropTypes.func.isRequired,
};

export default SelectedEventDetails;
