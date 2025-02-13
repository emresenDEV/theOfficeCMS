import PropTypes from "prop-types";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const CalendarComponent = ({ events }) => {
    return (
        <div className="bg-white shadow-md p-4 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-bold text-gray-700 mb-3">📅 My Calendar</h3>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                height="300px"  // ✅ Adjust calendar height
                events={events.map(event => ({
                    title: event.event_title,
                    start: `${event.start_date}T${event.start_time}`, 
                    end: `${event.end_date}T${event.end_time}`,  
                    extendedProps: event
                }))}
            />
        </div>
    );
};

// ✅ PropTypes Validation
CalendarComponent.propTypes = {
    events: PropTypes.arrayOf(
        PropTypes.shape({
            event_title: PropTypes.string.isRequired,
            start_date: PropTypes.string.isRequired,
            end_date: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default CalendarComponent;
