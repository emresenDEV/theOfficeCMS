import { useEffect, useState } from "react";
import { 
    fetchCalendarEvents, 
    fetchDepartments,
    fetchUsers
} from "../services/calendarService";
import { fetchBranches } from "../services/branchService";
// import { fetchUserProfile } from "../services/userService"; 
import Sidebar from "../components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CreateCalendarEvent from "../components/CreateCalendarEvent";
// import EditCalendarEvent from "../components/EditCalendarEvent";
import SelectedEventDetails from "../components/SelectedEventDetails";
import PropTypes from "prop-types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const CalendarPage = ({ user }) => {
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [events, setEvents] = useState(() => []);
    const [users, setUsers] = useState([]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    
    // Default to the current user
    const [selectedBranch, setSelectedBranch] = useState(user.branch_id || "");
    const [selectedDepartment, setSelectedDepartment] = useState(user.department_id || "");
    const [selectedUserId, setSelectedUserId] = useState(user.user_id || "");

    const [editingEventId, setEditingEventId] = useState(null);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [calendarView, setCalendarView] = useState("dayGridMonth");

    // Define Time Ranges
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Sort Events Based on View
    const sortedEvents = events
        .sort((a, b) => 
            new Date(`${a.start_date}T${a.start_time}`) - new Date(`${b.start_date}T${b.start_time}`)
        );

    const upcomingEvents = sortedEvents.filter(event => new Date(event.start_date) >= today);
    const pastEvents = sortedEvents.filter(event => new Date(event.start_date) < today);

    const viewEvents = {
        "dayGridMonth": events.filter(event => 
            event.start_date >= format(monthStart, "yyyy-MM-dd") && 
            event.start_date <= format(monthEnd, "yyyy-MM-dd")
        ),
        "timeGridWeek": events.filter(event => 
            event.start_date >= format(weekStart, "yyyy-MM-dd") && 
            event.start_date <= format(weekEnd, "yyyy-MM-dd")
        ),
        "timeGridDay": events.filter(event => event.start_date === selectedDate),
    };

    useEffect(() => {
        if (!user?.user_id) return;
    
        fetchCalendarEvents(user.user_id).then(setEvents);
    }, [user]);
    

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
    };
    
    
    /** ✅ Handle Clicking on an Event */
    const handleEventClick = (clickInfo) => {
        setSelectedEvent(clickInfo.event.extendedProps);
        setEditingEventId(clickInfo.event.extendedProps.event_id);
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
        <div className="flex bg-gray-100 min-h-screen">
            <div className="w-64 fixed left-0 top-0 h-full">
                <Sidebar user={user} />
            </div>

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold text-gray-700 pb-4">📅 Calendar</h1>

                {/* ✅ Branch, Department, and Employee Selection */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-gray-700">Select Branch:</label>
                        <select 
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="border p-2 rounded w-full mt-2"
                            
                        >
                            {branches.map(branch => (
                                <option 
                                    key={branch.branch_id} 
                                    value={branch.branch_id}>
                                    {branch.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700">Select Department:</label>
                        <select 
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="border p-2 rounded w-full mt-2"
                            
                        >
                            {filteredDepartments.map(dept => (
                                <option 
                                    key={dept.department_id} 
                                    value={dept.department_id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700">Select Employee:</label>
                        <select 
                            value={filteredUsers.length > 0 ? selectedUserId : ""}
                            onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10))}
                            className="border p-2 rounded w-full mt-2"
                            
                        >
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <option 
                                        key={user.user_id} 
                                        value={user.user_id}>
                                        {user.first_name} {user.last_name}
                                    </option>
                                ))
                            ) : (
                                <option value="">No employees available</option>
                            )}
                        </select>

                    </div>
                </div>

                {/* ✅ Full Calendar Component */}
                <div className="p-6 bg-white rounded-lg shadow-md mt-6">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={calendarView}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        events={events.map(event => ({
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
                {/* Create Event Button & Form */}
                <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4 mt-6"
                    onClick={() => setShowCreateEvent(!showCreateEvent)}
                >
                    {showCreateEvent ? "Close Event Form" : "Create Event"}
                </button>

                {showCreateEvent && (
                    <CreateCalendarEvent 
                        userId={selectedUserId} 
                        setEvents={setEvents} 
                        closeForm={() => setShowCreateEvent(false)} 
                    />
                )}

                {/* ✅ Display Events for Selected Date or Today */}
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">
                        📅 Events on {selectedDate === format(new Date(), "yyyy-MM-dd") 
                            ? "Today" 
                            : format(new Date(selectedDate), "MM/dd/yyyy")} 
                    </h2>

                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                            editingEventId === event.event_id ? (
                                // ✅ Show inline edit form if the event is being edited
                                <EditCalendarEvent
                                    key={event.event_id}
                                    event={event}
                                    setEvents={setEvents}
                                    saveEvent={(updatedEvent) => {
                                        setEvents(events.map(e => e.event_id === updatedEvent.event_id ? updatedEvent : e));
                                        setEditingEventId(null); // ✅ Exit edit mode after saving
                                    }}
                                />
                            ) : (
                                // ✅ Show normal event details with an Edit button
                                <SelectedEventDetails
                                    key={event.event_id}
                                    event={event}
                                    onEdit={() => setEditingEventId(event.event_id)} // ✅ Enables inline editing
                                />
                            )
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm italic">No events on this day.</p>
                    )}
                </div>

                {/* Past Events Button */}
                <button 
                    className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => setShowPastEvents(!showPastEvents)}
                >
                    {showPastEvents ? "Hide Past Events" : "Show Past Events"}
                </button>

                {showPastEvents && (
                    <SelectedEventDetails 
                        events={events.filter(event => new Date(event.start_date) < new Date())}
                        selectedDate={selectedDate} 
                        onEdit={setSelectedEvent} 
                    />    
                )}
                {/* ✅ Show Edit Event Modal */}
                {showModal && selectedEvent && (
                    <EditCalendarEvent 
                        event={selectedEvent} 
                        setShowModal={setShowModal} 
                        setEvents={setEvents} 
                    />
                )}
            </div>
        </div>
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
    employees: PropTypes.arrayOf(
        PropTypes.shape({
            user_id: PropTypes.number.isRequired,
            first_name: PropTypes.string.isRequired,
            last_name: PropTypes.string.isRequired,
            branch_id: PropTypes.number.isRequired,
            department_id: PropTypes.number.isRequired,
        })
    ),
    calendar_event: PropTypes.arrayOf( 
        PropTypes.shape({
            event_id: PropTypes.number.isRequired,
            event_title: PropTypes.string.isRequired,
            start_date: PropTypes.string.isRequired,
            end_date: PropTypes.string.isRequired,
            start_time: PropTypes.string.isRequired,
            end_time: PropTypes.string.isRequired,
            location: PropTypes.string,
            account_id: PropTypes.number,
            contact_name: PropTypes.string,
            phone_number: PropTypes.string,
            notes: PropTypes.string,
            user_id: PropTypes.number.isRequired,
        })
    ),
    selectedDate: PropTypes.string.isRequired,
    onEdit: PropTypes.func.isRequired,
};

export default CalendarPage;
