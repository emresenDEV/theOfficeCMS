import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    MapPin,
    Plus,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
} from "date-fns";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const normalizeEvent = (event) => {
    const start =
        event.start
            ? new Date(event.start)
            : event.start_date
                ? new Date(`${event.start_date}T${event.start_time || "00:00:00"}`)
                : null;
    const end =
        event.end
            ? new Date(event.end)
            : event.end_date
                ? new Date(`${event.end_date}T${event.end_time || "00:00:00"}`)
                : start;

    return {
        id: event.id || event.event_id || event.eventId || `${event.title}-${start}`,
        title: event.title || event.event_title || "Event",
        start,
        end: end || start,
        location: event.location || event.event_location,
        contactName: event.contact_name,
        accountName: event.account_name || event.accountName,
        raw: event,
    };
};

export function DashboardCalendarSection({ events, onAddEvent, onEventClick }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const normalizedEvents = useMemo(() => events.map(normalizeEvent), [events]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getEventsForDay = (date) =>
        normalizedEvents.filter((event) => event.start && isSameDay(event.start, date));

    const selectedDayEvents = getEventsForDay(selectedDate);

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Calendar</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddEvent?.(selectedDate);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Event
                    </Button>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    )}
                </div>
            </div>

            <div
                className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mini Calendar */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {format(currentDate, "MMMM yyyy")}
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2"
                                >
                                    {day}
                                </div>
                            ))}

                            {days.map((day) => {
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const dayEvents = getEventsForDay(day);
                                const hasEvents = dayEvents.length > 0;

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                                            !isCurrentMonth && "text-slate-300 dark:text-slate-600",
                                            isCurrentMonth && "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                                            isToday && "bg-blue-600 text-white font-semibold",
                                            isSelected && !isToday && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
                                            isSelected && isToday && "ring-2 ring-blue-400 ring-offset-2"
                                        )}
                                    >
                                        {format(day, "d")}
                                        {hasEvents && (
                                            <div className="absolute bottom-1 flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "h-1 w-1 rounded-full",
                                                            isSelected || isToday
                                                                ? "bg-white/80"
                                                                : "bg-blue-600"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setCurrentDate(new Date());
                                    setSelectedDate(new Date());
                                }}
                            >
                                Today
                            </Button>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="lg:border-l lg:pl-6 border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                            {format(selectedDate, "EEEE, MMMM d")}
                        </h3>
                        <div className="space-y-3">
                            {selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700"
                                        onClick={() => onEventClick?.(event.raw)}
                                    >
                                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                            {event.title}
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {event.start
                                                    ? `${format(event.start, "h:mm a")}${
                                                          event.end ? ` - ${format(event.end, "h:mm a")}` : ""
                                                      }`
                                                    : "Time TBD"}
                                            </p>
                                            {event.location && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location}
                                                </p>
                                            )}
                                        </div>
                                        {event.accountName && (
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-xs text-blue-600 mt-2 dark:text-blue-300"
                                            >
                                                {event.accountName}
                                            </Button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                                    No events scheduled
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

DashboardCalendarSection.propTypes = {
    events: PropTypes.arrayOf(PropTypes.object),
    onAddEvent: PropTypes.func,
    onEventClick: PropTypes.func,
};

DashboardCalendarSection.defaultProps = {
    events: [],
};
