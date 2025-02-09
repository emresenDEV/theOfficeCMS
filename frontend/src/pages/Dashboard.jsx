import { useEffect, useState } from "react";
import { fetchInvoices, fetchCommissions, fetchTasks, fetchAssignedAccounts, fetchMeetings } from "../services/api";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiCalendar } from "react-icons/fi";
import PropTypes from "prop-types";
import SalesChart from "../components/SalesChart";  
import CalendarComponent from "../components/CalendarComponent"; 

const Dashboard = ({ user, handleLogout }) => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [assignedAccounts, setAssignedAccounts] = useState([]);
    const [meetings, setMeetings] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            fetchInvoices(user.id).then(setInvoices);
            fetchCommissions(user.id).then(setCommissions);
            fetchTasks(user.id).then((tasks) => {
                setTasks(tasks.filter(task => !task.completed));
                setCompletedTasks(tasks.filter(task => task.completed));
            });
            fetchAssignedAccounts(user.id).then(setAssignedAccounts);
            fetchMeetings(user.id).then(setMeetings);
        }
    }, [user]);

    if (!user || !user.id || !user.firstName) {
        return <p className="text-center text-gray-600">Loading...</p>;
    }

    // ✅ Invoices & Commission Logic
    const assignedInvoices = invoices.filter(inv => inv.sales_user_id === user.id);
    const paidInvoicesCount = assignedInvoices.filter(inv => inv.status === "Paid").length;
    const unpaidInvoicesCount = assignedInvoices.filter(inv => inv.status === "Unpaid").length;
    const pastDueInvoicesCount = assignedInvoices.filter(inv => inv.status === "Past Due").length;
    const assignedAccountsCount = assignedAccounts.length;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const currentMonthCommission = commissions
        .filter(com => {
            const comDate = new Date(com.date_paid);
            return comDate.getMonth() + 1 === currentMonth && comDate.getFullYear() === currentYear;
        })
        .reduce((total, com) => total + com.commission_amount, 0);

    const yearlyCommission = commissions
        .filter(com => new Date(com.date_paid).getFullYear() === currentYear)
        .reduce((total, com) => total + com.commission_amount, 0);

    // ✅ Task Completion Logic
    const toggleTaskCompletion = (taskId) => {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
        setCompletedTasks(completedTasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
    };

    return (
        <div className="flex bg-blue-gray-100 min-h-screen">
            {/* Sidebar */}
            <Sidebar user={user} handleLogout={handleLogout} />

            {/* Main Content */}
            <div className="flex-1 p-6 ml-64">
                {/* Header */}
                <h1 className="text-3xl font-semibold text-dark-cornflower">Hello, {user.firstName}</h1>
                <h2 className="text-xl text-gray-600">Sales Dashboard</h2>

                {/* Grid Layout */}
                <div className="grid grid-cols-3 gap-6 mt-6">
                    {/* Paper Sales Report */}
                    <div className="col-span-2 bg-white shadow-md p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-dark-cornflower mb-4">Paper Sales Report</h3>
                        <SalesChart />
                    </div>

                    {/* My Tasks Section */}
                    <div className="bg-white shadow-md p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-dark-cornflower mb-3">My Tasks</h3>
                        <ul className="space-y-2">
                            {tasks.slice(0, 4).map(task => (
                                <li key={task.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                    <span className={task.completed ? "line-through text-gray-500" : "text-black"}>
                                        {task.text}
                                    </span>
                                    <input 
                                        type="checkbox" 
                                        checked={task.completed} 
                                        onChange={() => toggleTaskCompletion(task.id)} 
                                        className="cursor-pointer"
                                    />
                                </li>
                            ))}
                        </ul>
                        <button 
                            className="mt-3 w-full bg-true-blue text-white py-2 rounded-lg"
                            onClick={() => navigate("/tasks")}
                        >
                            New Task
                        </button>
                    </div>

                    {/* Calendar Section */}
                    <div className="col-span-3 bg-white shadow-md p-6 rounded-lg mt-6">
                        <h3 className="text-lg font-bold text-dark-cornflower mb-3">My Calendar</h3>
                        <CalendarComponent meetings={meetings} />

                        {/* Today's Meetings */}
                        <h4 className="text-md font-semibold text-gray-700 mt-4">Today's Meetings</h4>
                        {meetings.length > 0 ? (
                            meetings.map(meeting => (
                                <div key={meeting.id} className="flex items-center justify-between bg-blue-gray-100 p-3 rounded-lg mt-2">
                                    <div className="flex items-center">
                                        <FiCalendar className="text-true-blue text-xl mr-3" />
                                        <div>
                                            <p className="font-semibold">{meeting.event_title}</p>
                                            {meeting.notes && <p className="text-sm text-gray-600">{meeting.notes}</p>}
                                        </div>
                                    </div>
                                    <p className="text-md font-bold">
                                        {meeting.start_time} - {meeting.end_time}
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
// Dashboard.propTypes = {
//     user: PropTypes.shape({
//         id: PropTypes.number.isRequired,
//         firstName: PropTypes.string.isRequired,
//         lastName: PropTypes.string.isRequired,
//         role: PropTypes.string,
//     }).isRequired,
//     handleLogout: PropTypes.func.isRequired,
// };

Dashboard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        role: PropTypes.string,
    }),
    handleLogout: PropTypes.func,
};


export default Dashboard;
