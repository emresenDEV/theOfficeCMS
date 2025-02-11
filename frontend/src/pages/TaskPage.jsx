import { useEffect, useState } from "react";
import { fetchTasks, createTask, updateTask, deleteTask } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { FiEdit, FiXCircle, FiChevronDown, FiChevronUp } from "react-icons/fi"; // ✅ Icons

const TasksPage = ({ user }) => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [accountSearch, setAccountSearch] = useState("");
    const [newTask, setNewTask] = useState({
        task_description: "",
        due_date: "",
        account_id: "",
        account_name: "",
    });

    useEffect(() => {
        if (!user || !user.id) return;

        fetchTasks(user.id).then(tasks => {
            setTasks(tasks.filter(task => !task.is_completed));
            setCompletedTasks(tasks.filter(task => task.is_completed));
        });

        fetchAccounts().then(setAccounts);
    }, [user]);

    useEffect(() => {
        if (accountSearch.length > 0) {
            setFilteredAccounts(
                accounts.filter(account =>
                    account.business_name.toLowerCase().includes(accountSearch.toLowerCase())
                )
            );
        } else {
            setFilteredAccounts([]);
        }
    }, [accountSearch, accounts]);

    const handleCreateTask = async () => {
        if (!newTask.task_description.trim() || !newTask.due_date) {
            alert("Task description and due date are required.");
            return;
        }

        const createdTask = await createTask({
            user_id: user.id,
            assigned_to: user.id,
            task_description: newTask.task_description,
            due_date: newTask.due_date,
            account_id: newTask.account_id || null,
        });

        if (createdTask) {
            setTasks([...tasks, createdTask]);
            setNewTask({ task_description: "", due_date: "", account_id: "", account_name: "" });
            setAccountSearch("");
        }
    };

    const handleEditTask = (task) => {
        const newDescription = prompt("Edit task description:", task.task_description);
        if (newDescription !== null) {
            updateTask(task.task_id, { task_description: newDescription }).then(() => {
                setTasks(tasks.map(t => (t.task_id === task.task_id ? { ...t, task_description: newDescription } : t)));
            });
        }
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            deleteTask(taskId).then(() => {
                setTasks(tasks.filter(task => task.task_id !== taskId));
                setCompletedTasks(completedTasks.filter(task => task.task_id !== taskId));
            });
        }
    };

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar user={user} />

            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold text-blue-700">My Tasks</h1>

                {/* ✅ Task Form */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <h2 className="text-lg font-semibold">Create a New Task</h2>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <input
                            type="text"
                            value={newTask.task_description}
                            onChange={(e) => setNewTask({ ...newTask, task_description: e.target.value })}
                            placeholder="Task Description"
                            className="border p-2 rounded w-full"
                        />

                        <input
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                            className="border p-2 rounded w-full"
                        />

                        {/* ✅ Account Selection */}
                        <div className="relative">
                            <input
                                type="text"
                                value={accountSearch}
                                onChange={(e) => setAccountSearch(e.target.value)}
                                placeholder="Search for an account..."
                                className="border p-2 rounded w-full"
                            />
                            {filteredAccounts.length > 0 && (
                                <ul className="absolute bg-white border w-full mt-1 rounded shadow-lg">
                                    {filteredAccounts.map(account => (
                                        <li
                                            key={account.account_id}
                                            onClick={() => {
                                                setNewTask({ 
                                                    ...newTask, 
                                                    account_id: account.account_id, 
                                                    account_name: account.business_name 
                                                });
                                                setAccountSearch(account.business_name);
                                                setFilteredAccounts([]);
                                            }}
                                            className="p-2 hover:bg-gray-200 cursor-pointer"
                                        >
                                            {account.business_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateTask}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Create Task
                    </button>
                </div>

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
                            {tasks.map(task => (
                                <tr key={task.task_id} className="border text-center">
                                    <td className="p-2">{task.task_description}</td>
                                    <td className="p-2">{format(new Date(task.due_date), "EEE, MMMM dd, yyyy")}</td>
                                    <td className="p-2">
                                        {task.account_id ? (
                                            <button className="text-blue-600 underline" onClick={() => navigate(`/account/${task.account_id}`)}>
                                                {task.account_name || task.account_id}
                                            </button>
                                        ) : "None"}
                                    </td>
                                    <td className="p-2 flex justify-center gap-2">
                                        <FiEdit 
                                            className="text-[#1A6CFA] cursor-pointer" 
                                            onClick={() => handleEditTask(task)} 
                                            title="Edit Task"
                                        />
                                        <FiXCircle 
                                            className="text-red-600 cursor-pointer" 
                                            onClick={() => handleDeleteTask(task.task_id)} 
                                            title="Delete Task"
                                        />
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
                                </tr>
                            </thead>
                            <tbody>
                                {completedTasks.map(task => (
                                    <tr key={task.task_id} className="border text-center">
                                        <td className="p-2">{task.task_description}</td>
                                        <td className="p-2">{format(new Date(task.due_date), "EEE, MMMM dd, yyyy")}</td>
                                        <td className="p-2">{task.account_id || "None"}</td>
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

export default TasksPage;
