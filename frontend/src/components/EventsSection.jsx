import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchCalendarEvents } from "../services/calendarService";
import { useNavigate } from "react-router-dom";
import { DateTime } from "luxon";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";


// Central Time fallback
const centralTimeZone = "America/Chicago";


export const EventsSection = ({ user, setEvents, openCreateModal }) => { 
    const [localEvents, setLocalEvents] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.id || !setEvents) return; 
        
        async function loadTodayEvents() {
            try {
                const allEvents = await fetchCalendarEvents(user.id);
    
                const nowCentral = DateTime.now().setZone(centralTimeZone);
                // const today = nowCentral.toFormat("yyyy-MM-dd");
                console.log("🕒 nowCentral:", nowCentral.toISO()); //debugging
    
                const upcomingTodayEvents = allEvents.filter(event => {
                    if (!event.start_date || !event.start_time) return false;
                
                    const eventDateTime = DateTime.fromISO(`${event.start_date}T${event.start_time}`, { zone: "utc" }).setZone(centralTimeZone);
                    
                    console.log("🔍 Comparing full datetime:", {
                        event_title: event.event_title,
                        eventDateTime: eventDateTime.toISO(),
                        nowCentral: nowCentral.toISO(),
                        sameDay: eventDateTime.hasSame(nowCentral, "day"),
                        isAfterNow: eventDateTime > nowCentral,
                    }); //debugging
                
                    return eventDateTime.hasSame(nowCentral, "day") && eventDateTime > nowCentral;
                });
                

                const sortedEvents = upcomingTodayEvents.sort((a, b) => {
                    const aTime = DateTime.fromFormat(a.start_time, "HH:mm", { zone: "America/Chicago" });
                    const bTime = DateTime.fromFormat(b.start_time, "HH:mm", { zone: "America/Chicago" });
                    return aTime - bTime;
                });
                
                setLocalEvents(sortedEvents);
                setEvents(sortedEvents);
            } catch (error) {
                console.error("❌ Error loading today's events:", error);
            }
        }
    
        loadTodayEvents();
    }, [user, setEvents]);

    const formatTime = (timeString, dateString) => {
        return DateTime.fromISO(`${dateString}T${timeString}`, { zone: "utc" })
            .setZone("America/Chicago")
            .toFormat("hh:mm a");
    };
    

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
                                {event.start_time ? formatTime(event.start_time, event.start_date) : "No Time"} -
                                {event.end_time ? formatTime(event.end_time, event.end_date) : "No Time"}

                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-6">
                        <p>You have nothing planned today.</p>
                        <button
                            onClick={openCreateModal}
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

// PropTypes Validation
EventsSection.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
    setEvents: PropTypes.func.isRequired, 
    openCreateModal: PropTypes.func.isRequired,
};

export default EventsSection;
