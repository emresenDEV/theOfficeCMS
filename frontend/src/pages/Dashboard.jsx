import { useEffect, useState } from "react";
import { fetchInvoices, fetchCommissions, fetchTasks, createTask } from "../services/api";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiDollarSign, FiClipboard, FiCheck, FiPlus } from "react-icons/fi";
import PropTypes from "prop-types";

const Dashboard = ({ user, handleLogout }) => {
    if (!user) return <p className="text-center text-gray-600">Loading...</p>
    
    const { firstName, lastName, id } = user;
    const [invoices, setInvoices] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [accountID, setAccountId] = useState("");
    const [invoiceID, setInvoiceId] = useState("");

    const navigate = useNavigate();

useEffect(() => {
    fetchInvoices().then(setInvoices);
    fetchCommissions().then(setCommissions);
    fetchTasks(user.id).then((tasks) => {
        setTasks(tasks.filter(task => !task.completed));
        setCompletedTasks(tasks.filter(task => task.completed));
    });
    
}, [id]);

// Filter invoices for the logged-in user
const assignedInvoices = invoices.filter(inv => inv.sales_employee_id === id);
const paidInvoices = assignedInvoices.filter(inv => inv.status === "Paid");
const unpaidInvoices = assignedInvoices.filter(inv => inv.status === "Unpaid");
const pastDueInvoices = assignedInvoices.filter(inv => inv.status === "Past Due");

// Commission Data
const currentMonthCommission = commissions
    .filter(com => com?.date)
    .reduce((total, com) => total + (com.date.includes("2025-02") ? com.amount : 0), 0);

const yearlyCommission = commissions
    .filter(com => com?.date) // ✅ Ensure 'date' exists
    .reduce((total, com) => total + (com.date.includes("2025") ? com.amount : 0), 0);



// Task Completion
const toggleTaskCompletion = (taskId) => {
    const task = tasks.find(task => task.id === taskId) || completedTasks.find(task => task.id === taskId);

    if (!task) return;

    if (task.completed) {
        // Move from completed → assigned
        setCompletedTasks(completedTasks.filter(t => t.id !== taskId));
        setTasks([...tasks, { ...task, completed: false }]);
    } else {
        // Move from assigned → completed
        setTasks(tasks.filter(t => t.id !== taskId));
        setCompletedTasks([...completedTasks, { ...task, completed: true }]);
    }
};


// Create New Task
const handleCreateTask = async () => {
    if (newTask.trim()) return;
    
    try {
        const task = await createTask({
            user_id: id,
            text: newTask,
            assigned_to: assignedTo || null,
            account_id: accountID || null,
            invoice_id: invoiceID || null,
            completed: false
        })
        setTasks([...tasks, task]);
        setShowTaskModal(false);
        setNewTask("");
        setAssignedTo("");
        setAccountId("");
        setInvoiceId("");
    } catch (error) {
        console.error("Error creating task:", error);
    }
};

//  Handle the Logout
const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("lastActive");
    window.location.href = "/login"; // Redirect user to login after logout
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
            onClick={() => navigate("/invoices?status=Paid")} 
        />
        <StatCard 
            icon={<FiDollarSign />} 
            label="Unpaid Invoices" 
            value={unpaidInvoices.length} 
            onClick={() => navigate("/invoices?status=Unpaid")} 
        />
        <StatCard 
            icon={<FiClipboard />} 
            label="Past Due" 
            value={pastDueInvoices.length} 
            onClick={() => navigate("/invoices?status=Past Due")} 
        />
        </div>

        {/* Commission Overview */}
        <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard icon={<FiDollarSign />} label="Assigned Accounts" value={assignedAccounts} />
        <StatCard icon={<FiDollarSign />} label="Commission This Month" value={`$${currentMonthCommission.toFixed(2)}`} />
        <StatCard icon={<FiDollarSign />} label="Commission This Year" value={`$${yearlyCommission.toFixed(2)}`} />
        </div>

        {/* Task List */}
        <div className="mt-6">
            <h2 className="text-lg font-semibold">Assigned Tasks</h2>
            <ul className="mt-2 space-y-2">
                {tasks.length > 0 ? (
                tasks
                    .filter(task => task && task.text)
                    .map(task => (
                        <li key={task.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                            <span>{task.text}</span>
                            <button className="text-sm text-green-600" onClick={() => toggleTaskCompletion(task.id)}
                            >
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
                <button 
                    className="text-sm text-red-600" 
                    onClick={() => toggleTaskCompletion(task.id)}
                >
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
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-semibold mb-2">Create a New Task</h2>
                        <input 
                            type="text" 
                            value={newTask} 
                            onChange={(e) => setNewTask(e.target.value)}
                            className="border p-2 w-full mb-2"
                            placeholder="Task description"
                        />

                        {/* Assign to User */}
                        <input
                            type="number"
                            className="border p-2 w-full mb-2"
                            placeholder="Assign to User ID (optional)"
                            onChange={(e) => setAssignedTo(e.target.value)}
                        />

                        {/* Select Account */}
                        <input
                            type="number"
                            className="border p-2 w-full mb-2"
                            placeholder="Account ID (optional)"
                            onChange={(e) => setAccountId(e.target.value)}
                        />

                        {/* Select Invoice */}
                        <input
                            type="number"
                            className="border p-2 w-full mb-2"
                            placeholder="Invoice ID (optional)"
                            onChange={(e) => setInvoiceId(e.target.value)}
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

//  PropTypes Validation
Dashboard.propTypes = {
user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
}).isRequired,
    handleLogout: PropTypes.func.isRequired,
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

StatCard.propTypes = {
icon: PropTypes.element.isRequired,
label: PropTypes.string.isRequired,
value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
onClick: PropTypes.func,
};

export default Dashboard;
