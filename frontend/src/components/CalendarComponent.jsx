import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { DateTime } from "luxon";
import CustomToolbar from "./CustomToolbar";


import {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    fetchCalendarEvents,
    } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import CalendarEventModal from "./CalendarEventModal";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales: { "en-US": enUS },
    formats: {
        agendaHeaderFormat: (range) =>
            format(range.start, "MM/dd/yyyy"), 
    },
});


const DnDCalendar = withDragAndDrop(Calendar);

    const CalendarComponent = ({ userId }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);

    const loadEvents = useCallback(async () => {
        const result = await fetchCalendarEvents(userId);
        const transformed = result.map((event) => ({
        ...event,
        title: event.event_title,
        start: new Date(`${event.start_date}T${event.start_time}`),
        end: new Date(`${event.end_date}T${event.end_time}`),
        })).filter((e) => e.start <= e.end);
        setEvents(transformed);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        fetchAccounts().then(setAccounts);
        loadEvents();
    }, [userId, loadEvents]);

    const handleSelectSlot = useCallback(({ start, end }) => {
        setSelectedEvent({
        event_title: "",
        location: "",
        start,
        end,
        notes: "",
        contact_name: "",
        phone_number: "",
        account_id: "",
        });
        setModalOpen(true);
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
        setModalOpen(true);
    }, []);

    const handleEventMove = async ({ event, start, end }) => {
        try {
        const updatedEvent = {
            ...event,
            start_date: DateTime.fromJSDate(start).toFormat("yyyy-MM-dd"),
            end_date: DateTime.fromJSDate(end).toFormat("yyyy-MM-dd"),
            start_time: DateTime.fromJSDate(start).toFormat("HH:mm:ss"),
            end_time: DateTime.fromJSDate(end).toFormat("HH:mm:ss"),
        };
        await updateCalendarEvent(event.event_id, updatedEvent);
        loadEvents();
        } catch (err) {
        console.error("❌ Failed to move/resize event", err);
        }
    };

    const handleSave = async (formData) => {
        const { event_id } = selectedEvent;
        // Use the updated start/end from formData (modal input), not the old selectedEvent times
        const { start, end } = formData;
        const payload = {
            ...formData,
            user_id: userId,
            start_date: DateTime.fromJSDate(start).toFormat("yyyy-MM-dd"),
            start_time: DateTime.fromJSDate(start).toFormat("HH:mm:ss"),
            end_date: DateTime.fromJSDate(end).toFormat("yyyy-MM-dd"),
            end_time: DateTime.fromJSDate(end).toFormat("HH:mm:ss"),
        };
        if (event_id) {
            await updateCalendarEvent(event_id, payload);
        } else {
            await createCalendarEvent(payload);
        }
        loadEvents();
        setModalOpen(false);
    };

    return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📅 My Calendar</h2>
        <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            selectable
            resizable
            defaultDate={new Date()}
            views={{ month: true, week: true, day: true, agenda: true }}
            length={0}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventMove}
            onEventResize={handleEventMove}
            components={{
                toolbar: CustomToolbar,
            }}
        />
    <CalendarEventModal
        isOpen={modalOpen}
        closeModal={() => setModalOpen(false)}
        initialData={selectedEvent}
        onSave={handleSave}
        onDelete={async (eventId) => {
            await deleteCalendarEvent(eventId);
            await loadEvents();
            setModalOpen(false);
        }}
        accounts={accounts}
    />
    </div>
    );
};

CalendarComponent.propTypes = {
    userId: PropTypes.number.isRequired,
};

export default CalendarComponent;
