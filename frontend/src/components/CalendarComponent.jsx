import PropTypes from "prop-types";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const CalendarComponent = ({ meetings }) => {
    return (
        <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={meetings.map(meeting => ({
                title: meeting.event_title,
                start: meeting.start_date,
                end: meeting.end_date,
            }))}
        />
    );
};

CalendarComponent.propTypes = {
    meetings: PropTypes.arrayOf(
        PropTypes.shape({
            event_title: PropTypes.string.isRequired,
            start_date: PropTypes.string.isRequired,
            end_date: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default CalendarComponent;
