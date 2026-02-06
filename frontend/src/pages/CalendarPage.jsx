import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
    fetchCalendarEvents, 
    fetchCalendarEventsByUsers,
    updateCalendarEvent,
    respondToCalendarInvite,
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
import { format, addDays } from "date-fns";

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
    const [compareMode, setCompareMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState([user.user_id || ""]);
    const [compareSearch, setCompareSearch] = useState("");
    const [compareDate, setCompareDate] = useState(new Date());

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

    const resolveViewerStatus = (event) => {
        if (event.viewer_status) return event.viewer_status;
        if (!user?.user_id) return null;
        if (event.user_id === user.user_id) return "owner";
        const match = (event.attendees || []).find(
            (attendee) => attendee.user_id === user.user_id
        );
        return match?.status || null;
    };

    const calendarEvents = useMemo(() => {
        return events.map((event) => ({
            id: event.event_id,
            title: event.event_title,
            start: new Date(`${event.start_date}T${event.start_time}`),
            end: new Date(`${event.end_date}T${event.end_time}`),
            extendedProps: { ...event, viewer_status: resolveViewerStatus(event) },
            backgroundColor: getUserColor(event.user_id),
            borderColor: getUserColor(event.user_id),
            textColor: "#fff",
        }));
    }, [events, user?.user_id]);

    const formatEventTime = (timeValue) => {
        if (!timeValue) return "";
        return format(new Date(`1970-01-01T${timeValue}`), "h:mm a");
    };

    const toDateString = (date) => format(date, "yyyy-MM-dd");
    const toTimeString = (date) => format(date, "HH:mm");

    const updateEventState = (updated) => {
        setEvents((prev) =>
            prev.map((event) => (event.event_id === updated.event_id ? { ...event, ...updated } : event))
        );
    };

    const handleEventDrop = async (info) => {
        const event = info.event;
        if (event.extendedProps.user_id !== user.user_id) {
            info.revert();
            return;
        }
        const payload = {
            start_date: toDateString(event.start),
            end_date: toDateString(event.end || event.start),
            start_time: toTimeString(event.start),
            end_time: toTimeString(event.end || event.start),
            actor_user_id: user.user_id,
            actor_email: user.email,
        };
        const updated = await updateCalendarEvent(event.id, payload);
        if (updated) {
            updateEventState({
                event_id: event.id,
                start_date: payload.start_date,
                end_date: payload.end_date,
                start_time: payload.start_time,
                end_time: payload.end_time,
            });
            setEventToast("Event updated.");
        } else {
            info.revert();
        }
    };

    const handleEventResize = async (info) => {
        const event = info.event;
        if (event.extendedProps.user_id !== user.user_id) {
            info.revert();
            return;
        }
        const payload = {
            start_date: toDateString(event.start),
            end_date: toDateString(event.end || event.start),
            start_time: toTimeString(event.start),
            end_time: toTimeString(event.end || event.start),
            actor_user_id: user.user_id,
            actor_email: user.email,
        };
        const updated = await updateCalendarEvent(event.id, payload);
        if (updated) {
            updateEventState({
                event_id: event.id,
                start_date: payload.start_date,
                end_date: payload.end_date,
                start_time: payload.start_time,
                end_time: payload.end_time,
            });
            setEventToast("Event updated.");
        } else {
            info.revert();
        }
    };

    const userColorPalette = [
        "hsl(221 70% 55%)",
        "hsl(142 60% 45%)",
        "hsl(38 85% 55%)",
        "hsl(199 80% 52%)",
        "hsl(262 70% 62%)",
        "hsl(16 80% 55%)",
        "hsl(340 65% 56%)",
    ];

    const getUserColor = (userId) => {
        const id = Number(userId) || 0;
        return userColorPalette[id % userColorPalette.length];
    };

    const selectedUserMap = useMemo(() => {
        const map = new Map();
        users.forEach((user) => map.set(user.user_id, user));
        return map;
    }, [users]);

    const compareUsers = useMemo(() => {
        return selectedUserIds
            .map((id) => selectedUserMap.get(Number(id)))
            .filter(Boolean);
    }, [selectedUserIds, selectedUserMap]);

    const compareUserResults = useMemo(() => {
        const term = compareSearch.trim().toLowerCase();
        if (!term) return users;
        return users.filter((user) => {
            const name = `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase();
            return (
                name.includes(term) ||
                (user.username || "").toLowerCase().includes(term)
            );
        });
    }, [compareSearch, users]);

    useEffect(() => {
        if (!user?.user_id) return;
        if (compareMode) {
            const ids = selectedUserIds.filter(Boolean);
            if (!ids.length) {
                setEvents([]);
                return;
            }
            fetchCalendarEventsByUsers(ids).then((data) => {
                const safe = Array.isArray(data) ? data : [];
                setEvents(safe);
                setSelectedDateEvents(safe.filter((event) => event.start_date === selectedDate));
            });
            return;
        }
        if (!selectedUserId) return;
        fetchCalendarEvents(selectedUserId)
            .then((fetchedEvents) => {
                const safe = Array.isArray(fetchedEvents) ? fetchedEvents : [];
                setEvents(safe);
                setSelectedDateEvents(safe.filter((event) => event.start_date === selectedDate));
            })
            .catch(error => {
                console.error("❌ Error fetching events:", error);
                setEvents([]);
            });
    }, [user, compareMode, selectedUserIds, selectedUserId, selectedDate]);

    useEffect(() => {
        if (!eventToast) return;
        const timeoutId = setTimeout(() => setEventToast(""), 2500);
        return () => clearTimeout(timeoutId);
    }, [eventToast]);

    useEffect(() => {
        if (!compareMode) {
            setSelectedUserIds(selectedUserId ? [selectedUserId] : []);
        }
    }, [compareMode, selectedUserId]);

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

    const handleInviteResponse = async (status) => {
        if (!selectedEvent || !user?.user_id) return;
        const response = await respondToCalendarInvite(selectedEvent.event_id, {
            user_id: user.user_id,
            status,
            actor_email: user.email,
        });
        if (response) {
            setSelectedEvent((prev) => ({
                ...prev,
                viewer_status: status,
                attendees: (prev.attendees || []).map((attendee) =>
                    attendee.user_id === user.user_id ? { ...attendee, status } : attendee
                ),
            }));
            setEvents((prev) =>
                prev.map((event) =>
                    event.event_id === selectedEvent.event_id
                        ? {
                              ...event,
                              viewer_status: status,
                              attendees: (event.attendees || []).map((attendee) =>
                                  attendee.user_id === user.user_id ? { ...attendee, status } : attendee
                              ),
                          }
                        : event
                )
            );
            setEventToast(`Invite ${status}.`);
        }
    };

    const isCompareGrid = compareMode && ["timeGridWeek", "timeGridDay"].includes(calendarView);

    const handleComparePrev = () => {
        const step = calendarView === "timeGridWeek" ? -7 : -1;
        setCompareDate((prev) => addDays(prev, step));
    };

    const handleCompareNext = () => {
        const step = calendarView === "timeGridWeek" ? 7 : 1;
        setCompareDate((prev) => addDays(prev, step));
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.defaultPrevented) return;
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target;
            const isTyping =
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT" ||
                    target.isContentEditable);
            if (isTyping) return;

            const key = event.key.toLowerCase();
            if (key === "n") {
                setShowCreateEvent(true);
                event.preventDefault();
                return;
            }
            if (key === "t") {
                if (isCompareGrid) {
                    setCompareDate(new Date());
                } else if (calendarRef.current) {
                    calendarRef.current.getApi().today();
                }
                event.preventDefault();
                return;
            }
            if (key === "m" || key === "w" || key === "d") {
                const view =
                    key === "m" ? "dayGridMonth" : key === "w" ? "timeGridWeek" : "timeGridDay";
                setCalendarView(view);
                if (!isCompareGrid && calendarRef.current) {
                    calendarRef.current.getApi().changeView(view);
                }
                event.preventDefault();
                return;
            }
            if (key === "arrowleft") {
                if (isCompareGrid) {
                    handleComparePrev();
                } else if (calendarRef.current) {
                    calendarRef.current.getApi().prev();
                }
                event.preventDefault();
            }
            if (key === "arrowright") {
                if (isCompareGrid) {
                    handleCompareNext();
                } else if (calendarRef.current) {
                    calendarRef.current.getApi().next();
                }
                event.preventDefault();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCompareGrid, calendarView]);

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

                            <div className="border-t border-border pt-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Compare Schedules
                                    </label>
                                    <button
                                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                            compareMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }`}
                                        onClick={() => setCompareMode((prev) => !prev)}
                                    >
                                        {compareMode ? "On" : "Off"}
                                    </button>
                                </div>
                                {compareMode && (
                                    <div className="mt-3 space-y-2">
                                        <input
                                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground"
                                            placeholder="Search users..."
                                            value={compareSearch}
                                            onChange={(e) => setCompareSearch(e.target.value)}
                                        />
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <button
                                                className="text-primary hover:underline"
                                                onClick={() => setSelectedUserIds(users.map((user) => user.user_id))}
                                            >
                                                Select all
                                            </button>
                                            <button
                                                className="text-primary hover:underline"
                                                onClick={() => setSelectedUserIds([])}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-2">
                                            {compareUserResults.map((userOption) => (
                                                <label
                                                    key={userOption.user_id}
                                                    className="flex items-center gap-2 py-1 text-xs text-foreground"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(userOption.user_id)}
                                                        onChange={(e) => {
                                                            setSelectedUserIds((prev) =>
                                                                e.target.checked
                                                                    ? [...new Set([...prev, userOption.user_id])]
                                                                    : prev.filter((id) => id !== userOption.user_id)
                                                            );
                                                        }}
                                                    />
                                                    <span
                                                        className="inline-flex h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: getUserColor(userOption.user_id) }}
                                                    />
                                                    {userOption.first_name} {userOption.last_name}
                                                </label>
                                            ))}
                                            {compareUserResults.length === 0 && (
                                                <p className="text-[11px] text-muted-foreground">No users found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                {selectedEvent.viewer_status === "pending" && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-warning/15 px-3 py-1 text-[11px] font-semibold text-warning">
                                            Pending invite
                                        </span>
                                        <button
                                            className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground"
                                            onClick={() => handleInviteResponse("accepted")}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground"
                                            onClick={() => handleInviteResponse("declined")}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}
                                {selectedEvent.attendees?.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Attendees
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {selectedEvent.attendees.map((attendee) => (
                                                <div
                                                    key={`${selectedEvent.event_id}-${attendee.user_id}`}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-foreground">
                                                        {attendee.user_name || `User ${attendee.user_id}`}
                                                    </span>
                                                    <span className="text-muted-foreground capitalize">
                                                        {attendee.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        {isCompareGrid ? (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/40"
                                            onClick={handleComparePrev}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/40"
                                            onClick={() => setCompareDate(new Date())}
                                        >
                                            Today
                                        </button>
                                        <button
                                            className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/40"
                                            onClick={handleCompareNext}
                                        >
                                            Next
                                        </button>
                                        <span className="text-xs text-muted-foreground">
                                            {format(compareDate, "MMM d, yyyy")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {["dayGridMonth", "timeGridWeek", "timeGridDay"].map((view) => (
                                            <button
                                                key={view}
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                    calendarView === view
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                                onClick={() => setCalendarView(view)}
                                            >
                                                {view === "dayGridMonth"
                                                    ? "Month"
                                                    : view === "timeGridWeek"
                                                    ? "Week"
                                                    : "Day"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {compareUsers.map((compareUser) => {
                                        const eventsForUser = calendarEvents.filter((event) => {
                                            const payload = event.extendedProps || {};
                                            if (payload.user_id === compareUser.user_id) return true;
                                            return (payload.attendees || []).some(
                                                (attendee) => attendee.user_id === compareUser.user_id
                                            );
                                        });
                                        return (
                                            <div
                                                key={compareUser.user_id}
                                                className="rounded-md border border-border bg-background p-2"
                                            >
                                                <div className="mb-2 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 text-foreground">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full"
                                                            style={{ backgroundColor: getUserColor(compareUser.user_id) }}
                                                        />
                                                        {compareUser.first_name} {compareUser.last_name}
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {eventsForUser.length} events
                                                    </span>
                                                </div>
                                                <FullCalendar
                                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                                    initialView={calendarView}
                                                    initialDate={compareDate}
                                                    headerToolbar={false}
                                                    height="auto"
                                                    expandRows
                                                    nowIndicator
                                                    dayMaxEvents
                                                    eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                                                    events={eventsForUser}
                                                    eventClick={handleEventClick}
                                                    editable
                                                    eventDrop={handleEventDrop}
                                                    eventResize={handleEventResize}
                                                    eventAllow={(dropInfo, event) => event.extendedProps?.user_id === user.user_id}
                                                    eventClassNames={(arg) =>
                                                        arg.event.extendedProps?.viewer_status === "pending"
                                                            ? ["event-pending"]
                                                            : []
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
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
                                events={calendarEvents}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                viewDidMount={({ view }) => setCalendarView(view.type)}
                                editable
                                eventDrop={handleEventDrop}
                                eventResize={handleEventResize}
                                eventAllow={(dropInfo, event) => event.extendedProps?.user_id === user.user_id}
                                eventClassNames={(arg) =>
                                    arg.event.extendedProps?.viewer_status === "pending" ? ["event-pending"] : []
                                }
                            />
                        )}
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
