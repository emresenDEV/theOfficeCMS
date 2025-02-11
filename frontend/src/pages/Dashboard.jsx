import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/invoiceService";
import { fetchCommissions } from "../services/commissionsService";
import { fetchTasks } from "../services/tasksService";
import { fetchAssignedAccounts } from "../services/accountService";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiCalendar } from "react-icons/fi";
import PropTypes from "prop-types";
import SalesChart from "../components/SalesChart";  
import CalendarComponent from "../components/CalendarComponent"; 
import TasksComponent from "../components/TaskComponent";
import { fetchCalendarEvents } from "../services/calendarService";


const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    // const [invoices, setInvoices] = useState([]);
    // const [commissions, setCommissions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    // const [assignedAccounts, setAssignedAccounts] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;
    
        async function fetchData() {
            setLoading(true);
            try {
                const [tasksData, eventsData] = await Promise.all([
                    fetchTasks(user.id),
                    fetchCalendarEvents(user.id),
                ]);
                
                setTasks(tasksData.filter(task => !task.completed));
                setCompletedTasks(tasksData.filter(task => task.completed));
                setEvents(eventsData);
    
            } catch (error) {
                console.error("❌ Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
    
        fetchData();
    }, [user]);
    
    

    if (loading) {
        return <p className="text-center text-gray-600">Loading dashboard...</p>;
    }

    // ✅ Task Completion Logic
    const toggleTaskCompletion = (taskId) => {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
        setCompletedTasks(completedTasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
    };

    return (
        <div className="flex bg-blue-gray-100 min-h-screen">
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <div className="flex-1 p-6 ml-64">
                {/* Header */}
                <h1 className="text-3xl font-semibold text-dark-cornflower">
                    Hello, {user?.first_name || "Guest"}
                </h1>
                <h2 className="text-xl text-gray-600">Sales Dashboard</h2>

                {/* Grid Layout */}
                <div className="grid grid-cols-3 gap-6 mt-6">
                    {/* Paper Sales Report */}
                    <div className="col-span-2 bg-white shadow-md p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-dark-cornflower mb-4">Paper Sales Report</h3>
                        <SalesChart user={user} />

                    </div>

                    {/* My Tasks Section */}
                    <TasksComponent tasks={tasks} toggleTaskCompletion={toggleTaskCompletion} />


                    {/* Calendar Section */}
                    <div className="col-span-3 bg-white shadow-md p-6 rounded-lg mt-6">
                        <h3 className="text-lg font-bold text-dark-cornflower mb-3">My Calendar</h3>
                        <CalendarComponent events={events} />

                        {/* Today's Meetings */}
                        <h4 className="text-md font-semibold text-gray-700 mt-4">My Meetings</h4>
                        {events.length > 0 ? (
                            events.map(event => (
                                <div key={event.event_id} className="flex items-center justify-between bg-blue-gray-100 p-3 rounded-lg mt-2">
                                    <div className="flex items-center">
                                        <FiCalendar className="text-true-blue text-xl mr-3" />
                                        <div>
                                            <p className="font-semibold">{event.event_title}</p>
                                            {event.notes && <p className="text-sm text-gray-600">{event.notes}</p>}
                                        </div>
                                    </div>
                                    <p className="text-md font-bold">
                                        {event.start_time} - {event.end_time}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600">No meetings today.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ PropTypes Validation
Dashboard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        role: PropTypes.string,
    }).isRequired
};

export default Dashboard;
