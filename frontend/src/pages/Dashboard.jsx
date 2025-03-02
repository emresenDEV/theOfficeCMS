import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { logoutUser } from "../services/authService"; 
import SalesChart from "../components/SalesChart";
import CalendarComponent from "../components/CalendarComponent";
import TasksComponent from "../components/TaskComponent";
import AccountsTable from "../components/AccountsTable";
import EventsSection from "../components/EventsSection";
import { fetchCalendarEvents } from "../services/calendarService";
import { fetchTasks, updateTask } from "../services/tasksService";
import { FiCalendar, FiUsers } from "react-icons/fi";
import PropTypes from "prop-types";

const Dashboard = ({ user }) => {
    const [tasks, setTasks] = useState([]);
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
                setTasks(tasksData);
                setEvents(eventsData);
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const handleLogout = async () => {
        await logoutUser();
        window.location.href = "/login";  // ✅ Redirect to login after logout
    };
    
    if (loading) {
        return <p className="text-center text-gray-600">Loading dashboard...</p>;
    }

    const toggleTaskCompletion = async (task) => {
        const updatedTask = { ...task, is_completed: !task.is_completed };
        setTasks(prevTasks => prevTasks.map(t => t.task_id === task.task_id ? updatedTask : t));
        try {
            await updateTask(task.task_id, updatedTask);
        } catch (error) {
            console.error("❌ Error updating task:", error);
        }
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            {/* Sidebar */}
            <Sidebar user={user} handleLogout={ handleLogout} />

            {/* Main Content */}
            <div className="flex-1 p-6 ml-64 space-y-6">
                {/* Header */}
                <h1 className="text-3xl font-semibold text-gray-900">Hello, {user.first_name} {user.last_name}</h1>
                <h2 className="text-lg text-gray-600">{user.role} Dashboard</h2>

                {/* Sales & Calendar Section */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Sales Charts */}
                    <div className="col-span-2 bg-white shadow-md p-6 rounded-lg">
                        <SalesChart user={user} />
                    </div>
                    {/* Calendar */}
                    <div className="col-span-1 bg-white shadow-md p-6 rounded-lg">
                        <CalendarComponent events={events} />
                    </div>
                </div>

                {/* Tasks & Events Section */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Tasks Section */}
                    <div className="col-span-2 bg-white shadow-md p-6 rounded-lg overflow-auto">
                        <TasksComponent 
                            tasks={tasks} 
                            toggleTaskCompletion={toggleTaskCompletion}
                            refreshTasks={fetchTasks}
                        />
                    </div>
                    {/* Events Section */}
                    <div className="col-span-1 bg-white shadow-md p-6 rounded-lg overflow-auto">
                        <EventsSection events={events} user={user} />
                    </div>
                </div>

                {/* My Accounts Section */}
                <div className="bg-white shadow-md p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center"><FiUsers className="mr-2" /> My Accounts</h3>
                    <AccountsTable user={user} />
                </div>
            </div>
        </div>
    );
};

Dashboard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
    }).isRequired,
};

export default Dashboard;
