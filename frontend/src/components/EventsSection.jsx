import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchMeetings } from "../services/calendarService";
import { useNavigate } from "react-router-dom";
import { format, isAfter, parse } from "date-fns";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid"; 

export const EventsSection = ({ user, setEvents }) => { 
    const [localEvents, setLocalEvents] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.id) return;
        
        async function fetchTodayEvents() {
            const fetchedEvents = await fetchMeetings(user.id);
            const now = new Date();
            const today = format(now, "yyyy-MM-dd");

            // ✅ Filter only upcoming events today
            const todayEvents = fetchedEvents.filter(event => {
                const eventEndTime = parse(event.end_time, "HH:mm", now);
                return event.start_date === today && isAfter(eventEndTime, now);
            });

            setLocalEvents(todayEvents);
            if (setEvents) {
                setEvents(todayEvents);
            }
        }
    
        fetchTodayEvents();
    }, [user]);  // ✅ Only refetch when user changes

    const formatTime = (timeString) => format(parse(timeString, "HH:mm", new Date()), "hh:mm a");

    return (
        <div className={`bg-white shadow-lg rounded-lg transition-all duration-300 ${isCollapsed ? "h-14 overflow-hidden" : "h-auto"}`}>
            {/* 🔹 Header with Collapse Toggle */}
            <div className="flex justify-between items-center px-4 py-3 cursor-pointer" onClick={() => setIsCollapsed(prev => !prev)}>
                <h3 className="text-lg font-bold text-gray-700">📅 Today&apos;s Events</h3>
                <button>
                    {isCollapsed ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronUpIcon className="w-6 h-6 text-gray-500" />}
                </button>
            </div>

            {/* 🔹 Conditionally Render Events */}
            <div className={`transition-all duration-300 ${isCollapsed ? "opacity-0 scale-y-0 h-0" : "opacity-100 scale-y-100 h-auto"} px-4 pb-4`}>
                {localEvents.length > 0 ? (
                    localEvents.slice(0, 3).map(event => (
                        <div
                            key={event.event_id}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-md shadow-sm mb-2 hover:bg-gray-100 transition-colors cursor-pointer"
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
                    <div className="text-center text-gray-500 py-6">
                        <p>You have nothing planned today.</p>
                        <button
                            onClick={() => navigate("/calendar/create")}
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Event
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ✅ PropTypes Validation
EventsSection.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
    setEvents: PropTypes.func,
};

export default EventsSection;