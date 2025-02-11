import PropTypes from "prop-types";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const CalendarComponent = ({ events }) => {
    return (
        <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events.map(event => ({
                title: event.event_title,
                start: event.start_date,
                end: event.end_date,
            }))}
        />
    );
};


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
