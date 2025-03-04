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
import { fetchUserProfile } from "../services/userService";
import { FiUsers } from "react-icons/fi";
import PropTypes from "prop-types";

const Dashboard = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;

        async function loadUserProfile() {
            const profile = await fetchUserProfile(user.id);
            if (profile) {
                console.log("✅ Full User Profile in Dashboard:", profile);

                if (!profile.branch_id) {
                    console.warn("⚠️ API Response Missing `branch_id`! Check Backend Response.");
                }

                setUserData(profile);
            }
        }

        loadUserProfile();
    }, [user]);

    useEffect(() => {
        if (!userData || !userData.branch_id) {
            console.warn("⚠️ Dashboard: Waiting for `branch_id`...");
            return;
        }

        console.log("📢 Passing `userData` to `SalesChart` (before rendering):", userData);

        async function fetchData() {
            setLoading(true);
            try {
                const [tasksData, eventsData] = await Promise.all([
                    fetchTasks(userData.user_id),
                    fetchCalendarEvents(userData.user_id),
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
    }, [userData]);

    const handleLogout = async () => {
        await logoutUser();
        window.location.href = "/login";
    };

    if (!userData) {
        return <p className="text-center text-gray-600">Loading user profile...</p>;
    }

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
        <div className="flex bg-gray-100 min-h-screen w-full">
            <Sidebar user={userData} handleLogout={handleLogout} />
            <div className="flex-1 p-6 ml-64 space-y-6">
                <h1 className="text-3xl font-semibold text-gray-900">
                    Hello, {userData.first_name} {userData.last_name}
                </h1>
                <h2 className="text-lg text-gray-600">{userData.role_name || "Loading Role..."} Dashboard</h2>

                {/* 📊 Sales Chart */}
                {userData.branch_id ? (
                    <div className="bg-white shadow-md p-6 rounded-lg w-full">
                        <SalesChart userProfile={userData} />
                    </div>
                ) : (
                    <p className="text-center text-gray-600">Loading Sales Data...</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-screen-2xl mx-auto">
                    <div className="bg-white shadow-md p-6 rounded-lg col-span-2">
                        <CalendarComponent events={events} />
                    </div>
                    <div className="bg-white shadow-md p-6 rounded-lg overflow-y-auto max-h-64">
                        <EventsSection events={events} user={userData} />
                    </div>
                </div>

                <div className="bg-white shadow-md p-6 rounded-lg overflow-y-auto max-h-64 flex-grow w-full">
                    <TasksComponent 
                        tasks={tasks} 
                        toggleTaskCompletion={toggleTaskCompletion}
                        refreshTasks={fetchTasks}
                    />
                </div>

                <div className="bg-white shadow-md p-6 rounded-lg overflow-y-auto max-h-64 flex-grow w-full">
                    <h3 className="text-lg font-bold text-gray-700 flex items-center">
                        <FiUsers className="mr-2" /> My Accounts
                    </h3>
                    <AccountsTable user={userData} />
                </div>
            </div>
        </div>
    );
};

Dashboard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default Dashboard;
