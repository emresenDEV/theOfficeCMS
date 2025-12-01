import { useState } from "react";
import { DateTime } from "luxon";
import PropTypes from "prop-types";

const CalendarMobileMini = ({ events = [], onEventClick }) => {
    const [currentMonth, setCurrentMonth] = useState(DateTime.now());
    const [view, setView] = useState("month"); // month, week, day

    // Get days in current month
    const getDaysInMonth = () => {
        const start = currentMonth.startOf("month");
        const end = currentMonth.endOf("month");
        const days = [];
        let current = start.startOf("week");

        while (current <= end.endOf("week")) {
            days.push(current);
            current = current.plus({ days: 1 });
        }
        return days;
    };

    // Check if date has events
    const getEventsForDate = (date) => {
        return events.filter(event => {
            const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
            return eventDate.hasSame(date, "day");
        });
    };

    // Get events to display based on view
    const getDisplayedEvents = () => {
        const now = DateTime.now();
        let startDate, endDate;

        switch (view) {
            case "week":
                startDate = now.startOf("week");
                endDate = now.endOf("week");
                break;
            case "day":
                startDate = now.startOf("day");
                endDate = now.endOf("day");
                break;
            case "month":
            default:
                startDate = currentMonth.startOf("month");
                endDate = currentMonth.endOf("month");
        }

        return events.filter(event => {
            const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
            return eventDate >= startDate && eventDate <= endDate;
        }).sort((a, b) => {
            const dateA = DateTime.fromISO(`${a.start_date}T${a.start_time}`);
            const dateB = DateTime.fromISO(`${b.start_date}T${b.start_time}`);
            return dateA - dateB;
        });
    };

    const days = getDaysInMonth();
    const displayedEvents = getDisplayedEvents();

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">Calendar</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView("month")}
                            className={`text-xs px-2 py-1 rounded ${
                                view === "month" ? "bg-blue-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setView("week")}
                            className={`text-xs px-2 py-1 rounded ${
                                view === "week" ? "bg-blue-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView("day")}
                            className={`text-xs px-2 py-1 rounded ${
                                view === "day" ? "bg-blue-600 text-white" : "bg-gray-200"
                            }`}
                        >
                            Day
                        </button>
                    </div>
                </div>

                {/* Month Navigation */}
                {view === "month" && (
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentMonth(currentMonth.minus({ months: 1 }))}
                            className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            ← Prev
                        </button>
                        <h3 className="text-sm font-semibold">
                            {currentMonth.toFormat("MMMM yyyy")}
                        </h3>
                        <button
                            onClick={() => setCurrentMonth(currentMonth.plus({ months: 1 }))}
                            className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Apple-style Calendar Grid */}
            {view === "month" && (
                <div className="mb-6">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days - Square format */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map(day => {
                            const dayEvents = getEventsForDate(day);
                            const isCurrentMonth = day.month === currentMonth.month;
                            const isToday = day.hasSame(DateTime.now(), "day");

                            return (
                                <div
                                    key={day.toISO()}
                                    className={`aspect-square flex flex-col items-center justify-center text-xs rounded border ${
                                        isToday
                                            ? "bg-blue-100 border-blue-400"
                                            : isCurrentMonth
                                            ? "bg-white border-gray-200 hover:bg-gray-50"
                                            : "bg-gray-50 border-gray-100 text-gray-400"
                                    } cursor-pointer transition`}
                                >
                                    <div className="font-semibold">{day.day}</div>
                                    {dayEvents.length > 0 && (
                                        <div className="flex gap-0.5 mt-1">
                                            {dayEvents.slice(0, 2).map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-1 h-1 bg-blue-600 rounded-full"
                                                />
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-blue-600 font-bold">+</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Events List */}
            <div>
                <h3 className="text-sm font-semibold mb-3">
                    {view === "month" ? "Upcoming Events" : `Events - ${view === "week" ? "This Week" : "Today"}`}
                </h3>

                {displayedEvents.length > 0 ? (
                    <div className="space-y-2">
                        {displayedEvents.map(event => {
                            const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
                            const eventTime = eventDate.toFormat("h:mm a");
                            const displayDate = eventDate.toFormat("d");

                            return (
                                <div
                                    key={event.event_id}
                                    onClick={() => onEventClick(event)}
                                    className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500">{displayDate}</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {event.event_title}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {event.location && `📍 ${event.location}`}
                                            </div>
                                            {event.contact_name && (
                                                <div className="text-xs text-gray-600">
                                                    👤 {event.contact_name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                                            {eventTime}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center py-4">No events scheduled</p>
                )}
            </div>
        </div>
    );
};

CalendarMobileMini.propTypes = {
    events: PropTypes.array,
    onEventClick: PropTypes.func.isRequired,
};

export default CalendarMobileMini;
