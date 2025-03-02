import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchMeetings } from "../services/calendarService";
import { useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";
import { format, isAfter, parse } from "date-fns";

export const EventsSection = ({ user }) => {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.id) return;

        fetchMeetings(user.id).then(fetchedEvents => {
            const now = new Date();
            const today = format(now, "yyyy-MM-dd"); // Get today's date in 'YYYY-MM-DD' format

            // ✅ Filter only today's upcoming events
            const todayEvents = fetchedEvents.filter(event => {
                const eventDate = event.start_date; // Assuming 'YYYY-MM-DD' format from backend
                const eventEndTime = parse(event.end_time, "HH:mm", now); // Parse as time

                return eventDate === today && isAfter(eventEndTime, now);
            });

            setEvents(todayEvents);
        });
    }, [user]);

    // ✅ Format time in "hh:mm AM/PM" format
    const formatTime = (timeString) => format(parse(timeString, "HH:mm", new Date()), "hh:mm a");

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 w-full h-80 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-3">📅 Today&apos;s Events</h3>

            {events.length > 0 ? (
                events.map(event => (
                    <div 
                        key={event.event_id} 
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm mb-2 hover:bg-gray-100 transition cursor-pointer"
                        onClick={() => navigate(`/calendar/edit/${event.event_id}`)}
                    >
                        <p className="font-semibold text-gray-900">
                            {event.event_title || "Untitled Event"}
                        </p>
                        <p className="text-sm text-gray-600">
                            {event.start_time ? formatTime(event.start_time) : "No Time"} - 
                            {event.end_time ? formatTime(event.end_time) : "No Time"}
                        </p>
                    </div>
                ))
            ) : (
                <div className="text-center text-gray-500">
                    <p>You have nothing planned today.</p>
                    <button 
                        onClick={() => navigate("/calendar/create")} 
                        className="mt-3 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                    >
                        Create Event
                    </button>
                </div>
            )}
        </div>
    );
};

// ✅ PropTypes Validation
EventsSection.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
};

export default EventsSection;
