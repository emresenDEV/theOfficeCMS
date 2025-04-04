import { useState, useEffect, useCallback, Fragment } from "react";
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
import { Dialog, Transition } from "@headlessui/react";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, fetchCalendarEvents } from "../services/calendarService";
import { fetchAccounts } from "../services/accountService";
import { DateTime } from "luxon";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
format,
parse,
startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
getDay,
locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const CalendarComponent = ({ userId }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);

useEffect(() => {
    async function loadAccounts() {
        const res = await fetchAccounts();
        setAccounts(res);
    }
    loadAccounts();
    }, []);



useEffect(() => {
async function loadEvents() {
    const result = await fetchCalendarEvents(userId);
    const transformed = result
    .map(event => {
        const start = new Date(`${event.start_date}T${event.start_time}`);
        const end = new Date(`${event.end_date}T${event.end_time}`);
        return {
        ...event,
        title: event.event_title,
        start,
        end,
        };
    })
    .filter(e => e.start <= e.end); 

    setEvents(transformed);
}
if (userId) loadEvents();
}, [userId]);

const handleSelectSlot = useCallback(({ start, end }) => {
    console.log("📅 Slot selected:", start, end); // debugging
    setSelectedEvent({ start, end, title: "", user_id: userId });
    setModalOpen(true);
}, [userId]);

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
    const refreshed = await fetchCalendarEvents(userId);
    const transformed = refreshed.map(ev => ({
        ...ev,
        title: ev.event_title,
        start: new Date(`${ev.start_date}T${ev.start_time}`),
        end: new Date(`${ev.end_date}T${ev.end_time}`),
    }));
    setEvents(transformed);
} catch (err) {
    console.error("❌ Failed to move or resize event", err);  // debugging
}
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
        selectable={true}
        resizable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventMove}
        onEventResize={handleEventMove}
    />

    <Transition appear show={modalOpen} as={Fragment}>
    <Dialog as="div" className="relative z-10" onClose={() => setModalOpen(false)}>
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            >
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {selectedEvent?.event_id ? "Edit Event" : "Create New Event"}
                </Dialog.Title>

                <form
                onSubmit={async (e) => {
                    const startISO = form.start.value;
                    const endISO = form.end.value;

                    if (DateTime.fromISO(startISO) >= DateTime.fromISO(endISO)) {
                    alert("Start time must be before end time.");
                    return;
                    }

                    e.preventDefault();
                    const form = e.target;
                    const payload = {
                        event_title: form.event_title.value,
                        location: form.location.value,
                        start_date: DateTime.fromISO(form.start.value).toFormat("yyyy-MM-dd"),
                        end_date: DateTime.fromISO(form.end.value).toFormat("yyyy-MM-dd"),
                        start_time: DateTime.fromISO(form.start.value).toFormat("HH:mm:ss"),
                        end_time: DateTime.fromISO(form.end.value).toFormat("HH:mm:ss"),
                        notes: form.notes.value,
                        contact_name: form.contact_name.value,
                        phone_number: form.phone_number.value,
                        account_id: form.account_id.value ? parseInt(form.account_id.value) : null,
                        user_id: userId, 
                    };

                    let result;
                    if (selectedEvent?.event_id) {
                    result = await updateCalendarEvent(selectedEvent.event_id, payload);
                    } else {
                    result = await createCalendarEvent(payload);
                    }
                    if (result) {
                    const refreshed = await fetchCalendarEvents(userId);
                    const transformed = refreshed.map(event => ({
                        ...event,
                        title: event.event_title,
                        start: new Date(`${event.start_date}T${event.start_time}`),
                        end: new Date(`${event.end_date}T${event.end_time}`),
                    }));
                    setEvents(transformed);
                    setModalOpen(false);
                    }
                }}
                className="mt-4 space-y-4"
                >
                <input
                    type="text"
                    name="event_title"
                    defaultValue={selectedEvent?.event_title}
                    required
                    placeholder="Event Title"
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <input
                    type="text"
                    name="location"
                    defaultValue={selectedEvent?.location || ""}
                    placeholder="Location"
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <input
                    type="datetime-local"
                    name="start"
                    defaultValue={DateTime.fromJSDate(selectedEvent?.start).toFormat("yyyy-MM-dd'T'HH:mm")}
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <input
                    type="datetime-local"
                    name="end"
                    defaultValue={DateTime.fromJSDate(selectedEvent?.end).toFormat("yyyy-MM-dd'T'HH:mm")}
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <textarea
                    name="notes"
                    defaultValue={selectedEvent?.notes || ""}
                    placeholder="Notes"
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <input
                    type="text"
                    name="contact_name"
                    defaultValue={selectedEvent?.contact_name || ""}
                    placeholder="Contact Name"
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <input
                    type="tel"
                    name="phone_number"
                    defaultValue={selectedEvent?.phone_number || ""}
                    placeholder="Phone Number"
                    className="w-full p-2 border border-gray-300 rounded"
                />

                <select
                name="account_id"
                defaultValue={selectedEvent?.account_id || ""}
                className="w-full p-2 border border-gray-300 rounded"
                >
                <option value="">Select Account (optional)</option>
                {accounts.map(account => (
                    <option key={account.account_id} value={account.account_id}>
                    {account.business_name}
                    </option>
                ))}
                </select>

                <div className="flex justify-between space-x-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    {selectedEvent?.event_id ? "Update" : "Create"}
                    </button>
                    {selectedEvent?.event_id && (
                    <button
                        type="button"
                        onClick={async () => {
                        await deleteCalendarEvent(selectedEvent.event_id);
                        const refreshed = await fetchCalendarEvents(userId);
                        const transformed = refreshed.map(event => ({
                            ...event,
                            title: event.event_title,
                            start: new Date(`${event.start_date}T${event.start_time}`),
                            end: new Date(`${event.end_date}T${event.end_time}`),
                        }));
                        setEvents(transformed);
                        setModalOpen(false);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                        Delete
                    </button>
                    )}
                    <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:underline">
                    Cancel
                    </button>
                </div>
                </form>
            </Dialog.Panel>
            </Transition.Child>
        </div>
        </div>
    </Dialog>
    </Transition>
</div>
);
};

CalendarComponent.propTypes = {
    userId: PropTypes.number.isRequired,
};

export default CalendarComponent;
