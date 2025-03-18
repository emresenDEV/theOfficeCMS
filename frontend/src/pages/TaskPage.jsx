import { useEffect, useState } from "react";
import { fetchTasks, createTask, updateTask, deleteTask, fetchDepartments, fetchEmployees, fetchUsers } from "../services/tasksService";
import { fetchBranches } from "../services/branchService";
import { fetchAccounts } from "../services/accountService";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import CreateTaskComponent from "../components/CreateTaskComponent"; 

const TasksPage = ({ user }) => {
const navigate = useNavigate();
const [tasks, setTasks] = useState([]);
const [completedTasks, setCompletedTasks] = useState([]);
const [accounts, setAccounts] = useState([]);
const [branches, setBranches] = useState([]);
const [departments, setDepartments] = useState([]);
const [employees, setEmployees] = useState([]);
const [showCompleted, setShowCompleted] = useState(false);
// const [users, setUsers] = useState([]);
const [editError, setEditError] = useState(null);
const [editingTask, setEditingTask] = useState(null);
const [completingTask, setCompletingTask] = useState({});
const [confirmDelete, setConfirmDelete] = useState(null);

useEffect(() => {
    if (!user || !user.id) return;

    async function loadData() {
        try {
            const [fetchedTasks, fetchedAccounts, fetchedUsers] = await Promise.all([
                fetchTasks(user.id),
                fetchAccounts(),
                fetchUsers(),
            ]);

            // setUsers(fetchedUsers);

            // Use fetchedUsers directly instead of referencing `users`
            const updatedTasks = fetchedTasks.map((task) => ({
                ...task,
                business_name: task.account_id
                    ? fetchedAccounts.find((acc) => acc.account_id === task.account_id)?.business_name || "No Account"
                    : "No Account",
                assigned_by_username: fetchedUsers.find((u) => u.user_id === task.user_id)?.username || "Unknown",
            }));

            setTasks(updatedTasks.filter((task) => !task.is_completed));
            setCompletedTasks(updatedTasks.filter((task) => task.is_completed));
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

const handleTaskCompletion = (task) => {
    if (completingTask[task.task_id]) {
        // User clicked "Undo" before the countdown finished, cancel completion.
        clearTimeout(completingTask[task.task_id].timeoutId);
        clearInterval(completingTask[task.task_id].intervalId);
        setCompletingTask((prev) => ({ ...prev, [task.task_id]: undefined }));
        return;
    }

    // Toggle `is_completed` value
    // const newCompletionStatus = !task.is_completed;

    // Start a 5-second countdown for Active Tasks
    if (!task.is_completed) {
        setCompletingTask((prev) => ({
            ...prev,
            [task.task_id]: { timeLeft: 5, timeoutId: null, intervalId: null }
        }));

        let timeLeft = 5;

        // Start countdown timer
        const intervalId = setInterval(() => {
            timeLeft -= 1;
            setCompletingTask((prev) => {
                if (timeLeft <= 0) {
                    clearInterval(intervalId);
                    return { ...prev, [task.task_id]: undefined };
                }
                return { ...prev, [task.task_id]: { ...prev[task.task_id], timeLeft } };
            });
        }, 1000);

        // After 5 seconds, finalize completion
        const timeoutId = setTimeout(async () => {
            try {
                const updatedTask = { ...task, is_completed: true };
                await updateTask(task.task_id, updatedTask);

                setTasks((prevTasks) => prevTasks.filter((t) => t.task_id !== task.task_id));
                setCompletedTasks((prevCompletedTasks) => [...prevCompletedTasks, updatedTask]);

                console.log(`✅ Task ${task.task_id} marked as Completed`);
            } catch (error) {
                console.error("❌ Error updating task completion:", error);
            } finally {
                setCompletingTask((prev) => ({ ...prev, [task.task_id]: undefined })); // Clear timer state
            }
        }, 5000);

        // Store timeout ID so we can cancel it if user clicks "Undo"
        setCompletingTask((prev) => ({
            ...prev,
            [task.task_id]: { timeLeft: 5, timeoutId, intervalId }
        }));

        return;
    }

    // If task is already completed, Undo instantly
    (async () => {
        try {
            const updatedTask = { ...task, is_completed: false };
            await updateTask(task.task_id, updatedTask);

            setCompletedTasks((prevCompletedTasks) => prevCompletedTasks.filter((t) => t.task_id !== task.task_id));
            setTasks((prevTasks) => [...prevTasks, updatedTask]);

            console.log(`✅ Task ${task.task_id} marked as Active`);
        } catch (error) {
            console.error("❌ Error undoing task completion:", error);
        }
    })();
};




const handleEditTaskClick = (task) => {
    if (task.assigned_by_username !== user.username) {
        setEditError(`You can only edit tasks that you created`);
        setTimeout(() => setEditError(null), 5000);
        return;
    }

    setEditError(`You can only edit tasks that you created`);
    setTimeout(() => setEditError(null), 5000);

    console.log("✏️ Editing Task:", task);  // Debugging Log

    setEditingTask({
        task_id: task.task_id,
        task_description: task.task_description,
        due_date: task.due_date
            ? new Date(task.due_date).toISOString().split("T")[0]  // Convert to YYYY-MM-DD format for input field
            : ""
    });
};


const handleEditTask = async () => {
    if (!editingTask) return;

    try {
        const updatedTask = {
            ...editingTask,  // ✅ Preserve all existing properties
            due_date: editingTask.due_date 
                ? new Date(editingTask.due_date).toISOString().replace("T", " ").split(".")[0]
                : null,
        };

        console.log("📤 Sending Update to DB:", updatedTask);

        await updateTask(editingTask.task_id, updatedTask);

        setEditingTask(null);

        // ✅ Update UI Immediately
        setTasks((prevTasks) =>
            prevTasks.map((t) =>
                t.task_id === updatedTask.task_id
                    ? { ...updatedTask, business_name: t.business_name } // Preserve business_name
                    : t
            )
        );
        

        setCompletedTasks((prevCompletedTasks) =>
            prevCompletedTasks.map((t) =>
                t.task_id === updatedTask.task_id
                    ? { ...updatedTask, business_name: t.business_name } // Preserve business_name
                    : t
            )
        );
        

        console.log("✅ Task Updated Successfully");
    } catch (error) {
        console.error("❌ Error updating task:", error);
    }
};


const handleDeleteTask = async (taskId) => {
    if (confirmDelete === taskId) {
        try {
            const deleted = await deleteTask(taskId);
            if (deleted) {
                setTasks((prevTasks) => prevTasks.filter((task) => task.task_id !== taskId));
                setCompletedTasks((prevCompletedTasks) => prevCompletedTasks.filter((task) => task.task_id !== taskId));
                setConfirmDelete(null);  // Reset confirmation state
            }
        } catch (error) {
            console.error("❌ Error deleting task:", error);
        }
    } else {
        setConfirmDelete(taskId);
    }
    
};


return (
    <div className="flex bg-gray-100 min-h-screen">
    <Sidebar user={user} />
    <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>

        <CreateTaskComponent
        user={user}
        branches={branches}
        departments={departments}
        employees={employees}
        accounts={accounts}
        onCreateTask={createTask}
        />

        {/* Active Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
        <table className="w-full border-collapse">
            <thead className="bg-gray-200">
            <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-center">Assigned By</th>
                <th className="p-3 text-center">Account</th>
                <th className="p-3 text-center">Actions</th>
            </tr>
            </thead>
            <tbody>
            {tasks.map((task) => (
                <tr key={task.task_id} className="border-b">
                <td className="p-3 text-left">
                    {editingTask?.task_id === task.task_id ? (
                        <input
                            type="text"
                            value={editingTask.task_description}
                            onClick={(e) => e.stopPropagation()} // Prevents unwanted clicks outside
                            onChange={(e) => {
                                setEditingTask((prev) => ({
                                    ...prev,
                                    task_description: e.target.value,
                                }));
                            }}
                            onInput={(e) => {
                                e.target.style.height = "auto"; // Reset height before recalculating
                                e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height dynamically
                            }}
                            onFocus={(e) => {
                                e.target.style.height = "auto"; // Reset height before expanding
                                e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height dynamically
                            }}  // Selects all text when clicked
                            className="border px-3 py-2 rounded w-full resize-none overflow-auto text-wrap break-words"
                            style={{
                                minHeight: "60px",     
                                maxHeight: "300px",    
                                height: "auto",        
                                whiteSpace: "pre-wrap", 
                                wordWrap: "break-word",
                                overflowY: "hidden"
                            }}
                        />
                    ) : (
                        task.task_description
                    )}
                </td>
                <td className="p-3 text-left">
                    {editingTask?.task_id === task.task_id ? (
                        <input
                            type="date"
                            value={
                                editingTask?.due_date 
                                    ? new Date(editingTask.due_date).toISOString().split("T")[0]  
                                    : new Date(task.due_date).toISOString().split("T")[0]  
                            }
                            onClick={(e) => e.stopPropagation()}  
                            onChange={(e) => {
                                setEditingTask((prev) => ({
                                    ...prev,
                                    due_date: new Date(e.target.value).toISOString().replace("T", " ").split(".")[0]  
                                }));
                            }}
                            className="border px-2 py-1 rounded w-full"
                        />
                    ) : (
                        format(new Date(task.due_date), "MM/dd/yyyy")
                    )}
                </td>


                <td className="p-3 text-center">{task.assigned_by_username}</td>
                <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                    <button
                        className="bg-gray-800 text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition-colors"
                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                    >
                        {task.business_name}
                    </button>
                    ) : (
                    <span className="text-gray-500">No Account</span>
                    )}
                </td>
                <td className="p-3 text-center flex gap-2">
                    {editingTask?.task_id === task.task_id ? (
                        <>
                            {/* ✅ Save Button */}
                            <button
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleEditTask()} // Save changes
                            >
                                Save
                            </button>

                            {/* ✅ Cancel Button */}
                            <button
                                className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => setEditingTask(null)} // Cancels edit mode
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Edit Button */}
                            <button
                                className={`px-3 py-1 rounded-lg transition-colors ${
                                    task.assigned_by_username === user.username
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                }`}
                                onClick={() => handleEditTaskClick(task)}
                                disabled={task.assigned_by_username !== user.username}
                            >
                                Edit
                            </button>

                            {/* Complete Button with Countdown */}
                            <button
                                className={`px-3 py-1 rounded-lg transition-colors ${
                                    completingTask[task.task_id]
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-green-500 hover:bg-green-600 text-white"
                                }`}
                                onClick={() => handleTaskCompletion(task)}
                            >
                                {completingTask[task.task_id] && !isNaN(completingTask[task.task_id].timeLeft)
                                    ? `Undo (${completingTask[task.task_id].timeLeft}s)`
                                    : "Complete"}
                            </button>
                        </>
                    )}
                </td>
                {editError && (
                    <div className="text-red-600 text-sm mt-2 bg-gray-100 p-2 rounded shadow-lg">
                        {editError}
                    </div>
                )}


                </tr>
            ))}
            </tbody>
        </table>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <button
            className="flex items-center text-lg font-semibold w-full text-left"
            onClick={() => setShowCompleted(!showCompleted)}
        >
            {showCompleted ? <FiChevronUp className="mr-2" /> : <FiChevronDown className="mr-2" />}
            Completed Tasks
        </button>
        {showCompleted && (
            <table className="w-full border-collapse mt-4">
            <thead className="bg-gray-200">
                <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-center">Assigned By</th>
                <th className="p-3 text-center">Account</th>
                <th className="p-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {completedTasks.map((task, index) => (
                    <tr key={`completed-${task.task_id}-${index}`} className="border-b">

                    <td className="p-3 text-left">{task.task_description}</td>
                    <td className="p-3 text-left">{format(new Date(task.due_date), "MM/dd/yyyy")}</td>
                    <td className="p-3 text-center">{task.assigned_by_username}</td>
                    {/* <td className="p-3 text-center">
                        {users.find((u) => u.user_id === task.user_id)?.username || "Unknown"}
                    </td> */}
                    <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                        <button
                        className="bg-gray-800 text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition-colors"
                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                        >
                        {task.business_name}
                        </button>
                    ) : (
                        <span className="text-gray-500">No Account</span>
                    )}
                    </td>
                    <td className="p-3 text-center flex gap-2">
                        <button
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                            onClick={() => handleTaskCompletion(task)}
                        >
                            Undo
                        </button>
                        <button
                            className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                            onClick={() => handleDeleteTask(task.task_id)}
                        >
                            {confirmDelete === task.task_id ? "Are you sure?" : "Delete"}
                        </button>
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
