import { useState } from "react";
import PropTypes from "prop-types";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";


const CalendarComponent = ({ events }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
        {/* 🔹 Header with Collapse Toggle */}
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-700">📅 My Calendar</h3>
            <button onClick={() => setIsCollapsed(prev => !prev)}>
                {isCollapsed ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronUpIcon className="w-6 h-6 text-gray-500" />}
            </button>
        </div>

        {/* 🔹 Conditionally Render Content */}
        {!isCollapsed && (
            <div> {/* Wrap everything in a single parent div */}
                <div className="bg-white shadow-md p-6 rounded-lg w-full h-[700px] flex flex-col ">
                    {/* FullCalendar Stays Centered */}
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        height="100%"
                        contentHeight="auto"
                        aspectRatio={2.2}
                        events={events.map(event => ({
                            title: event.event_title || "Untitled Event",
                            start: `${event.start_date}T${event.start_time}`, 
                            end: `${event.end_date}T${event.end_time}`,  
                            extendedProps: event
                        }))}
                    />
                </div>
            </div>
        )}

        </div>
    );
};

// ✅ PropTypes Validation
CalendarComponent.propTypes = {
    events: PropTypes.arrayOf(
        PropTypes.shape({
            event_title: PropTypes.string,
            start_date: PropTypes.string.isRequired,
            end_date: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default CalendarComponent;
