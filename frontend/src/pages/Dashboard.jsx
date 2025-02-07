import { useEffect, useState } from "react";
import { fetchInvoices, fetchCommissions, fetchTasks, createTask, fetchAssignedAccounts } from "../services/api";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiDollarSign, FiClipboard, FiCheck, FiPlus } from "react-icons/fi";
import PropTypes from "prop-types";

const Dashboard = ({ user, handleLogout }) => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState("");
    const [assignedAccounts, setAssignedAccounts] = useState([]);




    
    useEffect(() => {
        if (user && user.id) {
            console.log("Fetching invoices for user:", user.id);
            fetchInvoices(user.id).then(setInvoices);
    
            console.log("Fetching commissions for user:", user.id);
            fetchCommissions(user.id)
                .then(data => {
                    console.log("Commissions API Response:", data);
                    setCommissions(data);
                })
                .catch(error => console.error("Error fetching commissions:", error));
    
            console.log("Fetching tasks for user:", user.id);
            fetchTasks(user.id).then((tasks) => {
                setTasks(tasks.filter(task => !task.completed));
                setCompletedTasks(tasks.filter(task => task.completed));
            });

            console.log("Fetching assigned accounts for user:", user.id);
                fetchAssignedAccounts(user.id).then(setAssignedAccounts);
            

        }
    }, [user]); // ✅ Keep full user object dependency
    

    if (!user || !user.id || !user.firstName) {
        return <p className="text-center text-gray-600">Loading...</p>;
    }


    
    // Filter Invoices
    const assignedInvoices = invoices.filter(inv => inv.sales_employee_id === user.id);
    const paidInvoices = assignedInvoices.filter(inv => inv.status === "Paid");
    const unpaidInvoices = assignedInvoices.filter(inv => inv.status === "Unpaid");
    const pastDueInvoices = assignedInvoices.filter(inv => inv.status === "Past Due");

    // Assigned Accounts
    const assignedAccountsCount = assignedAccounts.length;

    // Commissions
        // 🗓 Get the current month & year dynamically
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;  // Months are 0-indexed, so +1

        // 🏆 Get commissions for current month
    const currentMonthCommission = commissions
        .filter(com => {
            const comDate = new Date(com.date_paid);
            return comDate.getMonth() + 1 === currentMonth && comDate.getFullYear() === currentYear;
        })
        .reduce((total, com) => total + com.commission_amount, 0);

        // 📅 Get commissions for current year
    const yearlyCommission = commissions
        .filter(com => new Date(com.date_paid).getFullYear() === currentYear)
        .reduce((total, com) => total + com.commission_amount, 0);



    // Task Completion
    const toggleTaskCompletion = (taskId) => {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
        setCompletedTasks(completedTasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
    };

    // New Task Creation
    const handleCreateTask = () => {
        if (newTask.trim()) {
            createTask({ user_id: user.id, text: newTask, completed: false }).then(task => {
                setTasks([...tasks, task]);
                setShowTaskModal(false);
                setNewTask("");
            });
        }
    };

    return (
        <div className="flex">
            {/* Sidebar Navigation */}
            <Sidebar user={user} handleLogout={handleLogout} />

            {/* Main Dashboard Content */}
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Dashboard</h1>

                {/* Invoice Overview */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <StatCard 
                        icon={<FiFileText />} 
                        label="Paid Invoices" 
                        value={paidInvoices.length} 
                        onClick={() => navigate("/invoices/paid")} 
                    />
                    <StatCard 
                        icon={<FiDollarSign />} 
                        label="Unpaid Invoices" 
                        value={unpaidInvoices.length} 
                        onClick={() => navigate("/invoices/unpaid")} 
                    />
                    <StatCard 
                        icon={<FiClipboard />} 
                        label="Past Due" 
                        value={pastDueInvoices.length} 
                        onClick={() => navigate("/invoices/past_due")} 
                    />
                </div>

                {/* Commission Overview */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <StatCard 
                        icon={<FiDollarSign />} 
                        label="Assigned Accounts" 
                        value={assignedAccountsCount} 
                        onClick={() => navigate("/accounts/assigned")} />
                    <StatCard 
                        icon={<FiDollarSign />} 
                        label="Commission This Month" 
                        value={`$${isNaN(currentMonthCommission) ? "0.00" : currentMonthCommission.toFixed(2)}`}
                        onClick={() => navigate("/commissions?filter=month")}  
                    />
                    <StatCard 
                        icon={<FiDollarSign />} 
                        label="Commission This Year" 
                        value={`$${isNaN(yearlyCommission) ? "0.00" : yearlyCommission.toFixed(2)}`}
                        onClick={() => navigate("/commissions?filter=year")} 
                    />

                </div>

                {/* Task List */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold">Assigned Tasks</h2>
                    <ul className="mt-2 space-y-2">
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <li key={task.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                    <span>{task.text}</span>
                                    <button className="text-sm text-green-600" onClick={() => toggleTaskCompletion(task.id)}>
                                        <FiCheck />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p>No tasks assigned.</p>
                        )}
                    </ul>
                </div>

                {/* Completed Tasks */}
                <div className="mt-6">
                    <h2 className="text-lg font-semibold">Completed Tasks</h2>
                    <ul className="mt-2 space-y-2">
                        {completedTasks.length > 0 ? (
                            completedTasks.map(task => (
                                <li key={task.id} className="flex justify-between items-center bg-gray-300 p-2 rounded-md">
                                    <span>{task.text}</span>
                                    <button className="text-sm text-red-600" onClick={() => toggleTaskCompletion(task.id)}>
                                        ❌
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p>No completed tasks.</p>
                        )}
                    </ul>
                </div>

                {/* Create New Task Button */}
                <button 
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    onClick={() => setShowTaskModal(true)}
                >
                    <FiPlus /> <span>Create Task</span>
                </button>

                {/* New Task Modal */}
                {showTaskModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-semibold mb-2">Create a New Task</h2>
                            <input 
                                type="text" 
                                value={newTask} 
                                onChange={(e) => setNewTask(e.target.value)}
                                className="border p-2 w-full mb-2"
                                placeholder="Task description"
                            />
                            <div className="flex justify-end">
                                <button className="bg-gray-300 px-4 py-2 rounded mr-2" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCreateTask}>Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// Helper Component for Stat Cards
const StatCard = ({ icon, label, value, onClick }) => (
<div 
    className="bg-white shadow-md p-4 rounded-lg flex items-center space-x-4 cursor-pointer hover:bg-gray-200"
    onClick={onClick}
>
    <div className="text-3xl">{icon}</div>
    <div>
    <p className="text-lg font-semibold">{label}</p>
    <p className="text-xl">{value}</p>
    </div>
</div>
);
//  PropTypes Validation
Dashboard.propTypes = {
user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    role: PropTypes.string,
}).isRequired,
    handleLogout: PropTypes.func.isRequired,
};

StatCard.propTypes = {
icon: PropTypes.element.isRequired,
label: PropTypes.string.isRequired,
value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
onClick: PropTypes.func,
};

export default Dashboard;
