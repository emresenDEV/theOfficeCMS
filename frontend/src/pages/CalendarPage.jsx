import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    fetchCalendarEvents, 
    fetchDepartments,
    fetchUsers
} from "../services/calendarService";
import { fetchBranches } from "../services/branchService";
// import { fetchUserProfile } from "../services/userService"; 
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CreateCalendarEvent from "../components/CreateCalendarEvent";
import PropTypes from "prop-types";
import { format } from "date-fns";

const CalendarPage = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const calendarRef = useRef(null);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [events, setEvents] = useState(() => []);
    const [users, setUsers] = useState([]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    
    // Default to the current user
    const [selectedBranch, setSelectedBranch] = useState(user.branch_id || "");
    const [selectedDepartment, setSelectedDepartment] = useState(user.department_id || "");
    const [selectedUserId, setSelectedUserId] = useState(user.user_id || "");

    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [calendarView, setCalendarView] = useState("dayGridMonth");
    const [eventToast, setEventToast] = useState("");
    const [showIntegrations, setShowIntegrations] = useState(false);
    const [calendarIntegrations, setCalendarIntegrations] = useState(() => {
        const stored = localStorage.getItem("calendar_integrations");
        if (!stored) return { google: false, apple: false };
        try {
            return JSON.parse(stored);
        } catch (error) {
            return { google: false, apple: false };
        }
    });
    const [appleCalUrl, setAppleCalUrl] = useState("");

    const today = new Date();
    const selectedDateLabel = selectedDate
        ? selectedDate === format(today, "yyyy-MM-dd")
            ? "Today"
            : format(new Date(selectedDate), "MMM d, yyyy")
        : "Select a date";

    const sortByStart = (a, b) =>
        new Date(`${a.start_date}T${a.start_time}`) - new Date(`${b.start_date}T${b.start_time}`);

    const sortedEvents = useMemo(() => [...events].sort(sortByStart), [events]);
    const pastEvents = useMemo(
        () => sortedEvents.filter((event) => new Date(event.start_date) < today),
        [sortedEvents, today]
    );
    const pastEventList = useMemo(() => pastEvents.slice(0, 8), [pastEvents]);
    const selectedDateEventList = useMemo(
        () => [...selectedDateEvents].sort(sortByStart),
        [selectedDateEvents]
    );

    const formatEventTime = (timeValue) => {
        if (!timeValue) return "";
        return format(new Date(`1970-01-01T${timeValue}`), "h:mm a");
    };

    useEffect(() => {
        if (!user?.user_id) return;
    
        fetchCalendarEvents(user.user_id).then(setEvents);
    }, [user]);

    useEffect(() => {
        if (!eventToast) return;
        const timeoutId = setTimeout(() => setEventToast(""), 2500);
        return () => clearTimeout(timeoutId);
    }, [eventToast]);

    useEffect(() => {
        localStorage.setItem("calendar_integrations", JSON.stringify(calendarIntegrations));
    }, [calendarIntegrations]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dateParam = params.get("date");
        if (!dateParam) return;
        setSelectedDate(dateParam);
        setSelectedDateEvents(events.filter(event => event.start_date === dateParam));
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(dateParam);
            api.changeView("timeGridDay");
            setCalendarView("timeGridDay");
        }
    }, [location.search, events]);
    

    /** ✅ Fetch Users, Branches, and Departments */
    useEffect(() => {
        async function loadDropdownData() {
            try {
                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
                const fetchedUsers = await fetchUsers();
                setUsers(fetchedUsers);

                const fetchedBranches = await fetchBranches();
                setBranches(fetchedBranches);

                const fetchedDepartments = await fetchDepartments();
                setDepartments(fetchedDepartments);

                const currentUser = fetchedUsers.find(u => u.user_id === user.user_id);
                if (currentUser) {
                    setSelectedBranch(currentUser.branch_id);
                    setSelectedDepartment(currentUser.department_id);
                    setSelectedUserId(currentUser.user_id);
                }
            } catch (error) {
                console.error("❌ Error fetching dropdown data:", error);
            }
        }
        loadDropdownData();
    }, [user]);
    // useEffect(() => {
    //     async function loadUserData() {
    //         try {
    //             const fetchedUsers = await fetchUsers();
    //             setUsers(fetchedUsers);
    
    //             // ✅ Auto-select the logged-in user’s details
    //             const currentUser = fetchedUsers.find(u => u.user_id === user.user_id);
    //             if (currentUser) {
    //                 setSelectedBranch(currentUser.branch_id);
    //                 setSelectedDepartment(currentUser.department_id);
    //                 setSelectedUserId(currentUser.user_id);
    //             }
    
    //             // ✅ Fetch calendar events immediately after user details are set
    //             fetchCalendarEvents(user.user_id).then(setEvents);
    //         } catch (error) {
    //             console.error("❌ Error fetching user data:", error);
    //         }
    //     }
    
    //     loadUserData();
    // }, [user]);
    

    /** ✅ Fetch Events for Selected User */
    useEffect(() => {
        if (!selectedUserId) return;

        fetchCalendarEvents(selectedUserId)
            .then(fetchedEvents => {
                setEvents(Array.isArray(fetchedEvents) ? fetchedEvents : []);
                setSelectedDateEvents(fetchedEvents.filter(event => event.start_date === selectedDate));
            })
            .catch(error => {
                console.error("❌ Error fetching events:", error);
                setEvents([]);
            });
    }, [selectedUserId, selectedDate]);

    
    /** ✅ Handle Clicking on a Date */
    const handleDateClick = (dateInfo) => {
        const localDate = new Date(dateInfo.date);
        localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset()); 
    
        const formattedDate = format(localDate, "yyyy-MM-dd"); 
        setSelectedDate(formattedDate);
        setSelectedDateEvents(events.filter(event => event.start_date === formattedDate));
        setSelectedEvent(null);
        navigate(`?date=${formattedDate}`, { replace: true });
    };
    
    
    /** ✅ Handle Clicking on an Event */
    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event.extendedProps);
    };

    /** ✅ Filter Departments Based on Selected Branch */
    useEffect(() => {
        if (!selectedBranch || departments.length === 0 || users.length === 0) return;
    
        console.log("✅ Filtering departments for branch:", selectedBranch);
    
        // ✅ Ensure the users are loaded before filtering departments
        const branchUsers = users.filter(user => user.branch_id === parseInt(selectedBranch));
        
        // ✅ Find departments that have employees in the selected branch
        const filteredDeptList = departments.filter(dept =>
            branchUsers.some(user => user.department_id === dept.department_id)
        );
    
        setFilteredDepartments(filteredDeptList);
    
        if (filteredDeptList.length > 0) {
            setSelectedDepartment(prevDept =>
                filteredDeptList.some(dept => dept.department_id === prevDept) ? prevDept : filteredDeptList[0].department_id
            );
        } else {
            console.warn("⚠️ No departments found for selected branch:", selectedBranch);
            setSelectedDepartment(null); // Reset when no departments found
            setFilteredUsers([]);
            setSelectedUserId(null);
        }
        
    }, [selectedBranch, departments, users, user]);

    /** ✅ Filter Employees Based on Selected Department */
    useEffect(() => {
        if (!selectedDepartment || !selectedBranch || users.length === 0) {
            setFilteredUsers([]); // Reset users if invalid selection
            return;
        }
    
        console.log("✅ Filtering users for branch:", selectedBranch, "and department:", selectedDepartment);
    
        // ✅ Ensure departments and users are loaded before filtering
        const branchUsers = users.filter(user => user.branch_id === parseInt(selectedBranch));
        const departmentUsers = branchUsers.filter(user => user.department_id === parseInt(selectedDepartment));
    
        setFilteredUsers(departmentUsers);
    
        // ✅ Ensure valid employee selection
        if (departmentUsers.length > 0) {
            setSelectedUserId(prevUserId => 
                departmentUsers.some(user => user.user_id === prevUserId) ? prevUserId : departmentUsers[0].user_id
            );
        } else {
            console.warn("⚠️ No employees found for department:", selectedDepartment);
            setSelectedUserId(null); // Prevents an invalid selection
        }
        
    }, [selectedDepartment, selectedBranch, users, user]);

    
    return (
        <>
            <div className="bg-background min-h-screen px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-md border border-border bg-card px-4 py-3 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
                            <p className="text-xs text-muted-foreground">
                                Manage schedules, filter by branch and team, and review daily agendas.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                onClick={() => setShowCreateEvent(!showCreateEvent)}
                            >
                                {showCreateEvent ? "Close Event Form" : "Create Event"}
                            </button>
                            <button
                                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40"
                                onClick={() => setShowPastEvents(!showPastEvents)}
                            >
                                {showPastEvents ? "Hide Past Events" : "Show Past Events"}
                            </button>
                            <button
                                className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40"
                                onClick={() => setShowIntegrations(true)}
                            >
                                Connect Calendar
                            </button>
                        </div>
                    </div>
                </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[300px,1fr]">
                <div className="space-y-6">
                    <div className="rounded-md border border-border bg-card p-3 shadow-card">
                        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Filters
                        </h2>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Branch
                                </label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
                                >
                                    {branches.map((branch) => (
                                        <option key={branch.branch_id} value={branch.branch_id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Department
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
                                >
                                    {filteredDepartments.map((dept) => (
                                        <option key={dept.department_id} value={dept.department_id}>
                                            {dept.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Employee
                                </label>
                                <select
                                    value={filteredUsers.length > 0 ? selectedUserId : ""}
                                    onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10))}
                                    className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
                                >
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <option key={user.user_id} value={user.user_id}>
                                                {user.first_name} {user.last_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No employees available</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-border bg-card p-3 shadow-card">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground">
                                Agenda: {selectedDateLabel}
                            </h2>
                            <span className="text-[11px] text-muted-foreground">
                                {selectedDateEventList.length} event
                                {selectedDateEventList.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {selectedDateEventList.length > 0 ? (
                                selectedDateEventList.map((event) => (
                                    <button
                                        key={event.event_id}
                                        type="button"
                                        className={`w-full rounded-md border border-border p-2 text-left transition hover:bg-muted/40 ${
                                            selectedEvent?.event_id === event.event_id ? "bg-muted/40" : "bg-card"
                                        }`}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {event.event_title}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                                                </p>
                                                {event.location && (
                                                    <p className="text-[11px] text-muted-foreground">{event.location}</p>
                                                )}
                                            </div>
                                            {event.account_id && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    Account {event.account_id}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No events scheduled.</p>
                            )}
                        </div>
                    </div>

                    {selectedEvent && (
                        <div className="rounded-md border border-border bg-card p-3 shadow-card">
                            <h2 className="text-sm font-semibold text-foreground">Event Details</h2>
                            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                                <p className="text-foreground font-semibold">{selectedEvent.event_title}</p>
                                <p>
                                    {selectedEvent.start_date} • {formatEventTime(selectedEvent.start_time)} -{" "}
                                    {formatEventTime(selectedEvent.end_time)}
                                </p>
                                {selectedEvent.location && <p>Location: {selectedEvent.location}</p>}
                                {selectedEvent.contact_name && <p>Contact: {selectedEvent.contact_name}</p>}
                                {selectedEvent.phone_number && <p>Phone: {selectedEvent.phone_number}</p>}
                                {selectedEvent.notes && <p>Notes: {selectedEvent.notes}</p>}
                            </div>
                        </div>
                    )}

                    {showPastEvents && (
                        <div className="rounded-md border border-border bg-card p-3 shadow-card">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground">Past Events</h2>
                                <span className="text-[11px] text-muted-foreground">
                                    Showing {pastEventList.length} of {pastEvents.length}
                                </span>
                            </div>
                            <div className="mt-3 space-y-2">
                                {pastEventList.length > 0 ? (
                                    pastEventList.map((event) => (
                                        <button
                                            key={event.event_id}
                                            type="button"
                                            className="w-full rounded-md border border-border p-2 text-left transition hover:bg-muted/40"
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            <p className="text-sm font-semibold text-foreground">
                                                {event.event_title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {event.start_date} • {formatEventTime(event.start_time)}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No past events found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="calendar-shell rounded-md border border-border bg-card p-3 shadow-card">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView={calendarView}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek,timeGridDay",
                            }}
                            buttonText={{
                                today: "Today",
                                month: "Month",
                                week: "Week",
                                day: "Day",
                            }}
                            height="auto"
                            expandRows
                            nowIndicator
                            dayMaxEvents
                            eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                            events={events.map((event) => ({
                                id: event.event_id,
                                title: event.event_title,
                                start: new Date(`${event.start_date}T${event.start_time}`),
                                end: new Date(`${event.end_date}T${event.end_time}`),
                                extendedProps: event,
                            }))}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            viewDidMount={({ view }) => setCalendarView(view.type)}
                        />
                    </div>

                    {showCreateEvent && (
                        <div className="rounded-md border border-border bg-card p-3 shadow-card">
                            <CreateCalendarEvent
                                userId={selectedUserId}
                                setEvents={setEvents}
                                closeForm={() => setShowCreateEvent(false)}
                                selectedDate={selectedDate ? new Date(selectedDate) : null}
                                onCreated={() => setEventToast("Event created.")}
                            />
                        </div>
                    )}
                </div>
            </div>
                {showIntegrations && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4"
                        onClick={() => setShowIntegrations(false)}
                    >
                        <div
                            className="w-full max-w-xl rounded-lg border border-border bg-card p-4 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Calendar Integrations</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Connect external calendars for two-way visibility. Demo mode simulates connections.
                                    </p>
                                </div>
                                <button
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowIntegrations(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-md border border-border bg-muted/30 p-3">
                                    <p className="text-sm font-semibold text-foreground">Google Calendar</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Sync events, availability, and reminders.
                                    </p>
                                    <button
                                        className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                        onClick={() => {
                                            setCalendarIntegrations((prev) => ({ ...prev, google: true }));
                                            setEventToast("Google Calendar linked.");
                                            setShowIntegrations(false);
                                        }}
                                        disabled={calendarIntegrations.google}
                                    >
                                        {calendarIntegrations.google ? "Connected" : "Connect Google"}
                                    </button>
                                </div>

                                <div className="rounded-md border border-border bg-muted/30 p-3">
                                    <p className="text-sm font-semibold text-foreground">Apple Calendar</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Add an iCloud calendar URL for syncing.
                                    </p>
                                    <input
                                        value={appleCalUrl}
                                        onChange={(e) => setAppleCalUrl(e.target.value)}
                                        placeholder="iCloud calendar URL"
                                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
                                    />
                                    <button
                                        className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                        onClick={() => {
                                            setCalendarIntegrations((prev) => ({ ...prev, apple: true }));
                                            setEventToast("Apple Calendar linked.");
                                            setShowIntegrations(false);
                                        }}
                                        disabled={calendarIntegrations.apple || !appleCalUrl.trim()}
                                    >
                                        {calendarIntegrations.apple ? "Connected" : "Connect Apple"}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Connected: {calendarIntegrations.google ? "Google" : "—"}{" "}
                                    {calendarIntegrations.apple ? "• Apple" : ""}
                                </span>
                                <button
                                    className="text-xs font-semibold text-primary hover:underline"
                                    onClick={() => {
                                        setCalendarIntegrations({ google: false, apple: false });
                                        setAppleCalUrl("");
                                        setEventToast("Integrations cleared.");
                                        setShowIntegrations(false);
                                    }}
                                >
                                    Disconnect all
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {eventToast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
                    {eventToast}
                </div>
            )}
        </>
    );
};

// ✅ Fully Corrected PropTypes
CalendarPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        branch_id: PropTypes.number.isRequired,
        department_id: PropTypes.number.isRequired,
    }).isRequired,
};

export default CalendarPage;
