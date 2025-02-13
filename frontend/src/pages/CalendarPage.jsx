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
    const [events, setEvents] = useState([]);
    const [selectedDayEvents, setSelectedDayEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user.branch_id || "");
    const [selectedDepartment, setSelectedDepartment] = useState(user.department_id || "");
    const [selectedUserId, setSelectedUserId] = useState(user.id);

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
    
        const filteredEvents = events.filter(event => {
            const eventDate = format(new Date(event.start_date), "yyyy-MM-dd"); // ✅ Ensure correct format
            return eventDate === clickedDate;
        });
    
        console.log("📅 Events on Selected Date:", filteredEvents); // ✅ Debugging log
    
        setSelectedDayEvents(filteredEvents);
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
                />

                {/* ✅ Create Event Component */}
                <CreateCalendarEvent userId={parseInt(selectedUserId, 10)} setEvents={setEvents} />

                {/* ✅ Selected Events for Selected Day */}
                {selectedDayEvents.map(event => (
                    <SelectedEventDetails key={event.event_id} event={event} />
                ))}

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

