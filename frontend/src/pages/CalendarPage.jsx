import { useEffect, useState } from "react";
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";
import Sidebar from "../components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "../components/Modal";
import PropTypes from "prop-types";


const CalendarPage = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCalendarEvents(user.id).then(setEvents);
        }
    }, [user]);

    // Handles event selection (for editing)
    const handleEventClick = (clickInfo) => {
        setSelectedEvent({
            event_id: clickInfo.event.id,
            event_title: clickInfo.event.title,
            start_date: clickInfo.event.startStr.split("T")[0],
            start_time: clickInfo.event.startStr.split("T")[1]?.slice(0, 5) || "09:00",
            end_date: clickInfo.event.endStr ? clickInfo.event.endStr.split("T")[0] : clickInfo.event.startStr.split("T")[0],
            end_time: clickInfo.event.endStr ? clickInfo.event.endStr.split("T")[1]?.slice(0, 5) : "10:00",
            location: clickInfo.event.extendedProps.location || "",
            notes: clickInfo.event.extendedProps.notes || "",
            account_id: clickInfo.event.extendedProps.account_id || null,
            contact_name: clickInfo.event.extendedProps.contact_name || "",
            phone_number: clickInfo.event.extendedProps.phone_number || "",
        });
        setShowModal(true);
    };

    // Handles creating a new event
    const handleDateClick = (dateInfo) => {
        setSelectedEvent({
            start_date: dateInfo.dateStr,
            end_date: dateInfo.dateStr,
            start_time: "09:00",
            end_time: "10:00",
            event_title: "",
            location: "",
            notes: "",
            account_id: null,
            contact_name: "",
            phone_number: "",
        });
        setShowModal(true);
    };

    // Handles deleting an event
    const handleDelete = async () => {
        if (selectedEvent && selectedEvent.event_id) {
            await deleteCalendarEvent(selectedEvent.event_id);
            setEvents(events.filter(event => event.event_id !== selectedEvent.event_id));
            setShowModal(false);
        }
    };

    // Handles saving an event (new or edited)
    const handleSave = async () => {
        if (!selectedEvent.event_title.trim()) {
            alert("Event title cannot be empty.");
            return;
        }

        if (selectedEvent.event_id) {
            await updateCalendarEvent(selectedEvent.event_id, selectedEvent);
            setEvents(events.map(event => (event.event_id === selectedEvent.event_id ? selectedEvent : event)));
        } else {
            const newEvent = await createCalendarEvent({ ...selectedEvent, user_id: user.id });
            setEvents([...events, newEvent]);
        }
        setShowModal(false);
    };

    return (
        <div className="flex bg-blue-gray-100 min-h-screen">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Calendar View */}
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold text-dark-cornflower">My Calendar</h1>

                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                    }}
                    events={events.map(event => ({
                        id: event.event_id,
                        title: event.event_title,
                        start: `${event.start_date}T${event.start_time}`,
                        end: `${event.end_date}T${event.end_time}`,
                        extendedProps: event,
                    }))}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                />
            </div>

            {/* Modal for Editing Events */}
            {showModal && (
                <Modal title="Event Details" onClose={() => setShowModal(false)}>
                    <label>Event Title</label>
                    <input type="text" value={selectedEvent.event_title} onChange={(e) => setSelectedEvent({ ...selectedEvent, event_title: e.target.value })} />

                    <label>Location</label>
                    <input type="text" value={selectedEvent.location} onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })} />

                    <label>Start Time</label>
                    <input type="time" value={selectedEvent.start_time} onChange={(e) => setSelectedEvent({ ...selectedEvent, start_time: e.target.value })} />

                    <label>End Time</label>
                    <input type="time" value={selectedEvent.end_time} onChange={(e) => setSelectedEvent({ ...selectedEvent, end_time: e.target.value })} />

                    <label>Notes</label>
                    <textarea value={selectedEvent.notes} onChange={(e) => setSelectedEvent({ ...selectedEvent, notes: e.target.value })}></textarea>

                    <button className="bg-true-blue text-white px-4 py-2 rounded" onClick={handleSave}>Save</button>
                    {selectedEvent.event_id && <button className="bg-red-500 text-white px-4 py-2 rounded ml-2" onClick={handleDelete}>Delete</button>}
                </Modal>
            )}
        </div>
    );
};

// ✅ **PropTypes Validation**
CalendarPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        role: PropTypes.string,
    }).isRequired,
};

export default CalendarPage;
