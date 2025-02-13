import { useEffect, useState } from "react";
import { fetchTasks, createTask, updateTask, deleteTask, fetchBranches, fetchDepartments, fetchEmployees, fetchUsers } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { FiEdit, FiXCircle, FiChevronDown, FiChevronUp, FiCheckSquare, FiSquare } from "react-icons/fi";
import CreateTaskComponent from "../components/CreateTaskComponent"; // Import the new component

const TasksPage = ({ user }) => {
const navigate = useNavigate();
const [tasks, setTasks] = useState([]);
const [completedTasks, setCompletedTasks] = useState([]);
const [accounts, setAccounts] = useState([]);
const [branches, setBranches] = useState([]);
const [departments, setDepartments] = useState([]);
const [employees, setEmployees] = useState([]);
const [showCompleted, setShowCompleted] = useState(false);

useEffect(() => {
    if (!user || !user.id) return;

    async function loadData() {
    try {
        const [fetchedTasks, fetchedAccounts] = await Promise.all([
        fetchTasks(user.id),
        fetchAccounts(),
        ]);

        if (Array.isArray(fetchedTasks)) {
        const updatedTasks = fetchedTasks.map((task) => ({
            ...task,
            account_name: task.account_id
            ? fetchedAccounts.find((acc) => acc.account_id === task.account_id)?.business_name || "Unknown"
            : null,
        }));

        setTasks(updatedTasks.filter((task) => !task.is_completed));
        setCompletedTasks(updatedTasks.filter((task) => task.is_completed));
        }

        setAccounts(fetchedAccounts);
    } catch (error) {
        console.error("❌ Error fetching data:", error);
    }
    }

    loadData();
}, [user]);

useEffect(() => {
    async function loadDropdownData() {
    try {
        const [fetchedBranches, fetchedDepartments, fetchedEmployees] = await Promise.all([
        fetchBranches(),
        fetchDepartments(),
        fetchEmployees(),
        ]);

        setBranches(fetchedBranches);
        setDepartments(fetchedDepartments);
        setEmployees(fetchedEmployees);
    } catch (error) {
        console.error("❌ Error fetching dropdown data:", error);
    }
    }

    loadDropdownData();
}, []);

const handleCreateTask = async (taskData) => {
    const createdTask = await createTask(taskData);
    if (createdTask) {
    setTasks((prevTasks) => [...prevTasks, createdTask]);
    const updatedTasks = await fetchTasks(user.id);
    setTasks(updatedTasks.filter((task) => !task.is_completed));
    setCompletedTasks(updatedTasks.filter((task) => task.is_completed));
    }
};

const handleEditTask = (task) => {
    const newDescription = prompt("Edit task description:", task.task_description);
    if (newDescription !== null) {
    updateTask(task.task_id, { task_description: newDescription }).then(() => {
        setTasks((prevTasks) =>
        prevTasks.map((t) =>
            t.task_id === task.task_id ? { ...t, task_description: newDescription } : t
        )
        );
    });
    }
};

const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
    deleteTask(taskId).then(() => {
        setTasks((prevTasks) => prevTasks.filter((task) => task.task_id !== taskId));
        setCompletedTasks((prevCompletedTasks) =>
        prevCompletedTasks.filter((task) => task.task_id !== taskId)
        );
    });
    }
};

const handleToggleComplete = (task) => {
    const updatedTask = { ...task, is_completed: !task.is_completed };
    updateTask(task.task_id, updatedTask).then(() => {
    if (updatedTask.is_completed) {
        setTasks((prevTasks) => prevTasks.filter((t) => t.task_id !== task.task_id));
        setCompletedTasks((prevCompletedTasks) => [...prevCompletedTasks, updatedTask]);
    } else {
        setCompletedTasks((prevCompletedTasks) =>
        prevCompletedTasks.filter((t) => t.task_id !== task.task_id)
        );
        setTasks((prevTasks) => [...prevTasks, updatedTask]);
    }
    });
};

return (
    <div className="flex bg-gray-100 min-h-screen">
    <Sidebar user={user} />
    <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl font-bold text-blue-700">My Tasks</h1>

        {/* ✅ Create Task Component */}
        <CreateTaskComponent
        user={user}
        branches={branches}
        departments={departments}
        employees={employees}
        accounts={accounts}
        onCreateTask={handleCreateTask}
        />

        {/* ✅ Active Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
        <table className="w-full border">
            <thead>
            <tr className="bg-gray-200">
                <th className="p-2">Task</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Account</th>
                <th className="p-2">Actions</th>
            </tr>
            </thead>
            <tbody>
            {tasks.map((task) => (
                <tr key={task.task_id} className="border text-center">
                <td className="p-2">{task.task_description}</td>
                <td className="p-2">{format(new Date(task.due_date), "EEE, MMMM dd, yyyy")}</td>
                <td className="p-2">
                    {task.account_id ? (
                    <button
                        className="border border-blue-600 text-blue-600 px-3 py-1 rounded text-sm"
                        onClick={() => navigate(`/account/${task.account_id}`)}
                    >
                        {task.account_name}
                    </button>
                    ) : (
                    <span className="text-gray-500">No Account</span>
                    )}
                </td>
                <td className="p-2 flex justify-center gap-2">
                    <button
                    className="border border-green-600 text-green-600 px-3 py-1 rounded whitespace-nowrap"
                    onClick={() => handleToggleComplete(task)}
                    >
                    <FiCheckSquare className="mr-1" /> Complete
                    </button>
                    <button
                    className="border border-blue-600 text-blue-600 px-3 py-1 rounded whitespace-nowrap"
                    onClick={() => handleEditTask(task)}
                    >
                    <FiEdit className="mr-1" /> Edit
                    </button>
                    <button
                    className="border border-red-600 text-red-600 px-3 py-1 rounded whitespace-nowrap"
                    onClick={() => handleDeleteTask(task.task_id)}
                    >
                    <FiXCircle className="mr-1" /> Delete
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>

        {/* ✅ Completed Tasks (Collapsible) */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <button
            className="flex items-center text-lg font-semibold w-full text-left"
            onClick={() => setShowCompleted(!showCompleted)}
        >
            {showCompleted ? <FiChevronUp className="mr-2" /> : <FiChevronDown className="mr-2" />}
            Completed Tasks
        </button>
        {showCompleted && (
            <table className="w-full border mt-4">
            <thead>
                <tr className="bg-gray-200">
                <th className="p-2">Task</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Account</th>
                <th className="p-2">Actions</th>
                </tr>
            </thead>
            <tbody>
                {completedTasks.map((task) => (
                <tr key={task.task_id} className="border text-center">
                    <td className="p-2">{task.task_description}</td>
                    <td className="p-2">{format(new Date(task.due_date), "EEE, MMMM dd, yyyy")}</td>
                    <td className="p-2">{task.account_id || "None"}</td>
                    <td className="p-2">
                    <FiCheckSquare
                        className="text-green-600 cursor-pointer"
                        onClick={() => handleToggleComplete(task)}
                    />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    </div>
    </div>
);
};

TasksPage.propTypes = {
user: PropTypes.object.isRequired,
};

export default TasksPage;