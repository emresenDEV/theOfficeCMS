import { useEffect, useState } from "react";
import { 
    fetchCalendarEvents, 
    fetchDepartments,
    fetchBranches,
    fetchUsers
} from "../services/calendarService";
import Sidebar from "../components/Sidebar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import CreateCalendarEvent from "../components/CreateCalendarEvent";
import EditCalendarEvent from "../components/EditCalendarEvent";
import SelectedEventDetails from "../components/SelectedEventDetails";
import PropTypes from "prop-types";
import { format } from "date-fns";

const CalendarPage = ({ user }) => {
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedDayEvents, setSelectedDayEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");

    const [selectedBranch, setSelectedBranch] = useState(user.branch_id || "");
    const [selectedDepartment, setSelectedDepartment] = useState(user.department_id || "");
    const [selectedUserId, setSelectedUserId] = useState(user.id);

    const [showModal, setShowModal] = useState(false);

    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const [calendarView, setCalendarView] = useState("dayGridMonth"); // Default: Month View
    const [selectedWeekEvents, setSelectedWeekEvents] = useState([]);

    const today = format(new Date(), "yyyy-MM-dd"); // Get today's date
    const upcomingEvents = events.filter(event => event.start_date >= today);
    const pastEvents = events.filter(event => event.start_date < today); // Past events still appear on the calendar


    /** ✅ Fetch Users, Branches, and Departments */
    useEffect(() => {
        async function loadDropdownData() {
            try {
                const [fetchedUsers, fetchedBranches, fetchedDepartments] = await Promise.all([
                    fetchUsers(),
                    fetchBranches(),
                    fetchDepartments(),
                ]);

                setUsers(fetchedUsers);
                setBranches(fetchedBranches);
                setDepartments(fetchedDepartments);
            } catch (error) {
                console.error("❌ Error fetching dropdown data:", error);
            }
        }
        loadDropdownData();
    }, []);

    /** ✅ Fetch Events for Selected User */
    useEffect(() => {
        if (selectedUserId) {
            fetchCalendarEvents(selectedUserId).then(setEvents);
        }
    }, [selectedUserId]);

    /** ✅ Update Department List Based on Selected Branch */
    useEffect(() => {
        if (selectedBranch) {
            // ✅ Get department IDs from users who work at the selected branch
            const departmentIdsAtBranch = users
                .filter(user => user.branch_id === parseInt(selectedBranch))
                .map(user => user.department_id);
            
            // ✅ Find matching departments
            setFilteredDepartments(departments.filter(dept => departmentIdsAtBranch.includes(dept.department_id)));
            
            setSelectedDepartment(""); // ✅ Reset Department on Branch Change
            setSelectedUserId(""); // ✅ Reset Employee on Branch Change
        } else {
            setFilteredDepartments([]);
        }
    }, [selectedBranch, users, departments]);
    

    /** ✅ Update Employee List Based on Selected Department */
    useEffect(() => {
        if (selectedDepartment) {
            setFilteredUsers(users.filter(user => 
                user.department_id === parseInt(selectedDepartment) &&
                user.branch_id === parseInt(selectedBranch)
            ));
        } else {
            setFilteredUsers([]);
        }
    }, [selectedDepartment, selectedBranch, users]);
    
    // ✅ Filter events based on calendar view
    useEffect(() => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
        let filteredEvents = [];
    
        if (calendarView === "dayGridMonth") {
            // ✅ Show all events in the current month
            filteredEvents = events.filter(event => 
                new Date(event.start_date) >= monthStart && 
                new Date(event.start_date) <= monthEnd
            );
        } else if (calendarView === "timeGridWeek") {
            // ✅ Show only events for the selected week
            const weekStart = new Date(selectedDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            filteredEvents = events.filter(event => 
                new Date(event.start_date) >= weekStart && 
                new Date(event.start_date) <= weekEnd
            );
        } else if (calendarView === "timeGridDay") {
            // ✅ Show only events for the selected day
            filteredEvents = events.filter(event => event.start_date === selectedDate);
        }
    
        setSelectedWeekEvents(filteredEvents);
    }, [calendarView, selectedDate, events]);
    

    /** ✅ Handle Clicking on an Event */
    const handleEventClick = (clickInfo) => {
        setSelectedEvent({
            event_id: clickInfo.event.id,
            event_title: clickInfo.event.title,
            start_date: format(new Date(clickInfo.event.start), "MM/dd/yyyy"),
            start_time: format(new Date(clickInfo.event.start), "h:mm a"),
            end_date: format(new Date(clickInfo.event.end), "MM/dd/yyyy"),
            end_time: format(new Date(clickInfo.event.end), "h:mm a"),
            location: clickInfo.event.extendedProps.location || "No Location",
            account_id: clickInfo.event.extendedProps.account_id || "N/A",
            contact_name: clickInfo.event.extendedProps.contact_name || "N/A",
            phone_number: clickInfo.event.extendedProps.phone_number || "N/A",
            notes: clickInfo.event.extendedProps.notes || "No Notes",
        });
    
        console.log("📌 Selected Event Details:", selectedEvent); // ✅ Debugging log
    
        setShowModal(true);
    };
    

    /** ✅ Handle Clicking on a Date */
    const handleDateClick = (dateInfo) => {
        const clickedDate = format(new Date(dateInfo.date), "yyyy-MM-dd");  // ✅ Standardize date format
        console.log(`📌 Selected Date: ${clickedDate}`);  // ✅ Debugging log
    
        setSelectedDate(clickedDate); // ✅ Store selected date
    
        // const filteredEvents = events.filter(event => {
        //     const eventDate = format(new Date(event.start_date), "yyyy-MM-dd"); // ✅ Ensure correct format
        //     return eventDate === clickedDate;
        // });
    
        // console.log("📅 Events on Selected Date:", filteredEvents); // ✅ Debugging log
    
        // setSelectedDayEvents(filteredEvents);
        setSelectedDayEvents(events.filter(event => event.start_date === clickedDate));
    };
    

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar user={user} />

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold text-gray-700">📅 Calendar</h1>

                {/* ✅ Select Branch & Department */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-gray-700">Select Branch:</label>
                        <select 
                            value={selectedBranch}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value);
                                setSelectedDepartment(""); // ✅ Reset department
                                setSelectedUserId(""); // ✅ Reset employee
                            }}
                            className="border p-2 rounded w-full mt-2"
                        >
                            <option value={user.branch_id}>
                                {branches.find(branch => branch.branch_id === user.branch_id)?.branch_name || "Select Branch"}
                            </option>
                            {branches.map(branch => (
                                <option key={branch.branch_id} value={branch.branch_id}>
                                    {branch.branch_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700">Select Department:</label>
                        <select 
                            value={selectedDepartment}
                            onChange={(e) => {
                                setSelectedDepartment(e.target.value);
                                setSelectedUserId(""); // ✅ Reset employee when department changes
                            }}
                            className="border p-2 rounded w-full mt-2"
                        >
                            <option value={user.department_id}>
                                {departments.find(dept => dept.department_id === user.department_id)?.department_name || "Select Department"}
                            </option>
                            {filteredDepartments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div>
                        <label className="block text-gray-700">Select Employee:</label>
                        <select 
                            value={selectedUserId} 
                            onChange={(e) => setSelectedUserId(parseInt(e.target.value, 10))}
                            className="border p-2 rounded w-full mt-2"
                        >
                            <option value={user.id}>👤 {user.first_name} {user.last_name}</option>
                            {filteredUsers.map(u => (
                                <option key={u.user_id} value={u.user_id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ✅ Full Calendar Component */}
                <div className="p-6 bg-white rounded-lg shadow-md">
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
                        start: new Date(`${event.start_date}T${event.start_time}`),
                        end: new Date(`${event.end_date}T${event.end_time}`),
                        extendedProps: event,
                        }))}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        viewDidMount={(view) => setCalendarView(view.view.type)}
                        className="font-sans"
                    />
                </div>

                {/* ✅ Create Event Component */}
                <CreateCalendarEvent userId={parseInt(selectedUserId, 10)} setEvents={setEvents} />

                {/* ✅ Selected Events for Selected Day */}
                {selectedDayEvents.map(event => (
                    <SelectedEventDetails key={event.event_id} event={event} />
                ))}

                {/* ✅ Display Upcoming Events for the Selected View */}
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">
                        {calendarView === "dayGridMonth" && "📆 This Month’s Events"}
                        {calendarView === "timeGridWeek" && "📅 This Week’s Events"}
                        {calendarView === "timeGridDay" && `📍 Events on ${format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}`}
                    </h2>


                    {/* month/week/day EVENT card */}
                    {selectedWeekEvents.length > 0 ? (
                        selectedWeekEvents.map((event, index) => (
                            <div
                            key={event.event_id}
                            className={`p-5 rounded-lg transition-all duration-300 ease-in-out shadow-md ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:shadow-lg hover:bg-gray-100 mb-4`} // 🔹 Added mb-4 for spacing between cards
                            >
                            {/* Date and Time Row */}
                            <div className="flex justify-between items-center">
                                {/* Date */}
                                <p className="text-sm text-gray-600 font-bold"> {/* 🔹 Added font-bold */}
                                {format(new Date(event.start_date), "EEEE, MMM. d, yyyy")}
                                </p>

                                {/* Time */}
                                <p className="text-sm text-gray-600 font-bold"> {/* 🔹 Added font-bold */}
                                {format(new Date(`${event.start_date}T${event.start_time}`), "h:mm a")} -{" "}
                                {format(new Date(`${event.end_date}T${event.end_time}`), "h:mm a")}
                                </p>
                            </div>

                            {/* Event Title */}
                            <p className="text-sm text-gray-800 font-semibold mt-2 text-left"> {/* 🔹 Added text-left */}
                                {event.event_title}
                            </p>

                            {/* Event Location */}
                            <p className="text-sm text-gray-700 mt-1 text-left"> {/* 🔹 Added text-left */}
                                📍 {event.location || "No location provided"}
                            </p>

                            {/* Account ID */}
                            {event.account_id && (
                                <p className="text-sm text-gray-700 mt-1 text-left"> {/* 🔹 Added text-left */}
                                🏢 Account: {event.account_id}
                                </p>
                            )}

                            {/* Contact Name */}
                            {event.contact_name && (
                                <p className="text-sm text-gray-700 mt-1 text-left"> {/* 🔹 Added text-left */}
                                📞 Contact: {event.contact_name}
                                </p>
                            )}

                            {/* Phone Number */}
                            {event.phone_number && (
                                <p className="text-sm text-gray-700 mt-1 text-left"> {/* 🔹 Added text-left */}
                                📱 Phone: {event.phone_number}
                                </p>
                            )}

                            {/* Notes and Edit Button Row */}
                            <div className="flex items-center mt-2">
                                {/* Notes */}
                                <p className="text-sm text-gray-500 italic text-left flex-grow"> {/* 🔹 Added flex-grow */}
                                📝 {event.notes}
                                </p>

                                {/* Edit Button */}
                                <button
                                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50"
                                onClick={() => {
                                    setSelectedEvent(event);
                                    setShowModal(true);
                                }}
                                >
                                Edit
                                </button>
                            </div>
                            </div>
                        ))
                        ) : (
                        <p className="text-gray-500 text-center text-lg mt-4 italic">
                            No events scheduled.
                        </p>
                        )}
                </div>


                {/* ✅ Edit Event Component */}
                {showModal && <EditCalendarEvent event={selectedEvent} setShowModal={setShowModal} setEvents={setEvents} />}
            </div>
        </div>
    );
};

// ✅ Corrected PropTypes
CalendarPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
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
        })
    ),
};

export default CalendarPage;

