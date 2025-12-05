import { useState } from "react";
import { DateTime } from "luxon";
import PropTypes from "prop-types";

const CalendarMobileMini = ({ events = [], onEventClick, onDateClick, onCreateEvent }) => {
    const [currentMonth, setCurrentMonth] = useState(DateTime.now());
    const [view, setView] = useState("month"); // month, week, day
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        let startDate, endDate;

        switch (view) {
            case "week":
                startDate = currentMonth.startOf("week");
                endDate = currentMonth.endOf("week");
                break;
            case "day":
                startDate = currentMonth.startOf("day");
                endDate = currentMonth.endOf("day");
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

    // Navigate to today
    const goToToday = () => {
        setCurrentMonth(DateTime.now());
    };

    // Navigate to previous week
    const goToPrevWeek = () => {
        setCurrentMonth(currentMonth.minus({ weeks: 1 }));
    };

    // Navigate to next week
    const goToNextWeek = () => {
        setCurrentMonth(currentMonth.plus({ weeks: 1 }));
    };

    // Navigate to previous day
    const goToPrevDay = () => {
        setCurrentMonth(currentMonth.minus({ days: 1 }));
    };

    // Navigate to next day
    const goToNextDay = () => {
        setCurrentMonth(currentMonth.plus({ days: 1 }));
    };

    // Get formatted date range for current view
    const getDateRangeLabel = () => {
        switch (view) {
            case "week":
                const weekStart = currentMonth.startOf("week");
                const weekEnd = currentMonth.endOf("week");
                return `${weekStart.toFormat("MMM d")} - ${weekEnd.toFormat("MMM d, yyyy")}`;
            case "day":
                return currentMonth.toFormat("MMMM d, yyyy");
            case "month":
            default:
                return currentMonth.toFormat("MMMM yyyy");
        }
    };

    // Handle date click to create new event
    const handleDateClick = (date) => {
        if (onDateClick) {
            onDateClick(date);
        }
        if (onCreateEvent) {
            onCreateEvent(date);
        }
    };

    // Handle event click to view details
    const handleEventClick = (event) => {
        console.log("🎯 Event clicked - Full event data:", event);
        if (onEventClick) {
            onEventClick(event);
        }
    };

    const days = getDaysInMonth();
    const displayedEvents = getDisplayedEvents();

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-between items-center mb-4"
            >
                <h2 className="text-lg font-semibold">Calendar</h2>
                <span className="text-xl">{isCollapsed ? "+" : "−"}</span>
            </button>

            {!isCollapsed && (
                <>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={goToToday}
                                    className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 font-semibold"
                                >
                                    Today
                                </button>
                                {onCreateEvent && (
                                    <button
                                        onClick={() => onCreateEvent(DateTime.now())}
                                        className="text-sm px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 font-bold"
                                        title="Create new event"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
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

                        {/* Navigation for all views */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    if (view === "month") {
                                        setCurrentMonth(currentMonth.minus({ months: 1 }));
                                    } else if (view === "week") {
                                        goToPrevWeek();
                                    } else if (view === "day") {
                                        goToPrevDay();
                                    }
                                }}
                                className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                ← Prev
                            </button>
                            <h3 className="text-sm font-semibold">
                                {getDateRangeLabel()}
                            </h3>
                            <button
                                onClick={() => {
                                    if (view === "month") {
                                        setCurrentMonth(currentMonth.plus({ months: 1 }));
                                    } else if (view === "week") {
                                        goToNextWeek();
                                    } else if (view === "day") {
                                        goToNextDay();
                                    }
                                }}
                                className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Next →
                            </button>
                        </div>
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
                                            onClick={() => handleDateClick(day)}
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

                    {/* Week View Calendar Grid */}
                    {view === "week" && (
                        <div className="mb-6">
                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Week days - clickable blocks */}
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const weekStart = currentMonth.startOf("week");
                                    const day = weekStart.plus({ days: i });
                                    const isToday = day.hasSame(DateTime.now(), "day");

                                    return (
                                        <div
                                            key={day.toISO()}
                                            onClick={() => setCurrentMonth(day)}
                                            className={`aspect-square flex items-center justify-center text-sm font-bold rounded border cursor-pointer transition ${
                                                isToday
                                                    ? "bg-blue-600 text-white border-blue-700"
                                                    : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
                                            }`}
                                        >
                                            {day.day}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Events List */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">
                            Events - {getDateRangeLabel()}
                        </h3>

                        {displayedEvents.length > 0 ? (
                            <div className="space-y-3">
                                {displayedEvents.map(event => {
                                    const eventDate = DateTime.fromISO(`${event.start_date}T${event.start_time}`);
                                    const eventTime = eventDate.toFormat("h:mm a");
                                    const displayDate = eventDate.toFormat("d");

                                    return (
                                        <div
                                            key={event.event_id}
                                            onClick={() => handleEventClick(event)}
                                            className="border rounded p-3 cursor-pointer hover:shadow-md transition bg-gray-50 hover:bg-gray-100"
                                        >
                                            {/* Event Card Layout */}
                                            <div className="flex gap-3">
                                                {/* Date Column (Left) */}
                                                <div className="flex flex-col items-center justify-center min-w-fit">
                                                    <div className="text-3xl font-bold text-blue-600 leading-tight">
                                                        {displayDate}
                                                    </div>
                                                </div>

                                                {/* Event Details (Center/Right) */}
                                                <div className="flex-1 flex flex-col justify-between">
                                                    {/* Title */}
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {event.event_title}
                                                    </div>

                                                    {/* Contact Name (Priority 1) */}
                                                    {event.contact_name && (
                                                        <div className="text-xs text-gray-600">
                                                            👤 {event.contact_name}
                                                        </div>
                                                    )}

                                                    {/* Phone Number (Priority 2 - show if contact exists) */}
                                                    {event.contact_name && event.phone_number && (
                                                        <div className="text-xs text-gray-600">
                                                            📱 {event.phone_number}
                                                        </div>
                                                    )}

                                                    {/* Notes (Priority 3 - show if no contact) */}
                                                    {!event.contact_name && event.notes && (
                                                        <div className="text-xs text-gray-500 line-clamp-1">
                                                            {event.notes}
                                                        </div>
                                                    )}

                                                    {/* Location (Priority 4 - show if no contact and no notes) */}
                                                    {!event.contact_name && !event.notes && event.location && (
                                                        <div className="text-xs text-gray-600">
                                                            📍 {event.location}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Time Column (Right) */}
                                                <div className="flex items-center justify-center min-w-fit">
                                                    <div className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                                                        {eventTime}
                                                    </div>
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
                </>
            )}
        </div>
    );
};

CalendarMobileMini.propTypes = {
    events: PropTypes.array,
    onEventClick: PropTypes.func,
    onDateClick: PropTypes.func,
    onCreateEvent: PropTypes.func,
};

export default CalendarMobileMini;
