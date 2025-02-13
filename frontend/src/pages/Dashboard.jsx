import { useEffect, useState } from "react";
// import { fetchInvoices } from "../services/invoiceService";
// import { fetchCommissions } from "../services/commissionsService";
import { fetchTasks, updateTask } from "../services/tasksService";
// import { fetchAssignedAccounts } from "../services/accountService";
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
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [invoices, setInvoices] = useState([]);
    // const [commissions, setCommissions] = useState([]);
    // const [assignedAccounts, setAssignedAccounts] = useState([]);

    // useEffect(() => {
    //     if (!user || !user.id) return;
    
    //     async function fetchData() {
    //         setLoading(true);
            // try {
            //     // ✅ Fetch tasks and calendar events in parallel
            //     const [tasksData, eventsData] = await Promise.all([
            //         fetchTasks(user.id),
            //         fetchCalendarEvents(user.id),
            //     ]);
    
            //     console.log("✅ Fetched Tasks:", tasksData);
            //     console.log("✅ Fetched Calendar Events:", eventsData);
    
            //     // ✅ Ensure tasks are correctly categorized
            //     setTasks(tasksData.filter(task => !task.is_completed));
            //     setCompletedTasks(tasksData.filter(task => task.is_completed));
    
            //     // ✅ Set events in state
            //     setEvents(eventsData);
    
            // } catch (error) {
            //     console.error("❌ Error fetching data:", error);
            // } finally {
            //     setLoading(false);
            // }
    //         try {
    //             const tasksData = await fetchTasks(user.id);
    //             console.log("✅ Fetched Tasks in Dashboard:", tasksData);
    //             setTasks(tasksData.filter(task => !task.is_completed));
    //             setCompletedTasks(tasksData.filter(task => task.is_completed));
    //         } catch (error) {
    //             console.error("❌ Error fetching tasks:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     }
    
    //     fetchData();
    // }, [user]);
    
    useEffect(() => {
        if (!user || !user.id) return;
    
        async function fetchData() {
            setLoading(true);
            try {
                // ✅ Fetch tasks and calendar events at the same time
                const [tasksData, eventsData] = await Promise.all([
                    fetchTasks(user.id),
                    fetchCalendarEvents(user.id),
                ]);
    
                console.log("✅ Fetched Tasks in Dashboard:", tasksData);
                console.log("✅ Fetched Calendar Events in Dashboard:", eventsData);
    
                // ✅ Update state correctly
                setTasks(tasksData.filter(task => !task.is_completed));
                setCompletedTasks(tasksData.filter(task => task.is_completed));
                setEvents(eventsData);
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
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
    const toggleTaskCompletion = (task) => {
        const updatedTask = { ...task, is_completed: !task.is_completed };
    
        // ✅ Optimistically update UI
        setTasks(prevTasks => 
            prevTasks.map(t => (t.task_id === task.task_id ? updatedTask : t))
        );
    
        // ✅ Update backend
        updateTask(task.task_id, updatedTask).then(() => {
            console.log("✅ Task Updated:", updatedTask);
        }).catch(error => {
            console.error("❌ Error updating task:", error);
        });
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
        id: PropTypes.number.isRequired, // ✅ User's ID (unchanged)
        username: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,  // ✅ Ensure task_id is a number
            user_id: PropTypes.number.isRequired,  // ✅ User ID instead of assigned_to
            assigned_to: PropTypes.number.isRequired,  // ✅ Assigned user ID instead of user_id
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string.isRequired, // ✅ Due date should be a string (formatted later)
            is_completed: PropTypes.bool.isRequired, // ✅ Boolean for completed status
            account_id: PropTypes.number, // ✅ Optional field, if task is linked to an account
        })
    ).isRequired,
    toggleTaskCompletion: PropTypes.func.isRequired, // ✅ Function to toggle task completion
};


export default Dashboard;
