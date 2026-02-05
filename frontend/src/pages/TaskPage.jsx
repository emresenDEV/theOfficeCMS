import { useEffect, useState } from "react";
import { fetchTasks, createTask, updateTask, deleteTask, fetchDepartments, fetchEmployees, fetchUsers } from "../services/tasksService";
import { fetchBranches } from "../services/branchService";
import { fetchAccounts } from "../services/accountService";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import CreateTaskComponent from "../components/CreateTaskComponent";
import TaskListMobile from "../components/TaskListMobile";
import CreateTaskModal from "../components/CreateTaskModal"; 

const TasksPage = ({ user }) => {
const navigate = useNavigate();
const location = useLocation();
const [tasks, setTasks] = useState([]);
const [completedTasks, setCompletedTasks] = useState([]);
const [accounts, setAccounts] = useState([]);
const [branches, setBranches] = useState([]);
const [departments, setDepartments] = useState([]);
const [employees, setEmployees] = useState([]);
const [showCompleted, setShowCompleted] = useState(false);
// const [users, setUsers] = useState([]);
const [editError, setEditError] = useState(null);
const [completingTask, setCompletingTask] = useState({});
const [confirmDelete, setConfirmDelete] = useState(null);
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [showCreateModal, setShowCreateModal] = useState(false);
const [highlightTaskId, setHighlightTaskId] = useState(null);
const currentUserId = user?.user_id ?? user?.id ?? null;

// Handle window resize for mobile detection
useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
}, []);

useEffect(() => {
    if (!user || !currentUserId) return;

    async function loadData() {
        try {
            // Fetch sequentially to avoid overwhelming Cloudflare tunnel
            const fetchedTasks = await fetchTasks(currentUserId);
            const fetchedAccounts = await fetchAccounts();
            const fetchedUsers = await fetchUsers();

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
}, [user, currentUserId]); 

useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskId");
    if (!taskId) return;
    setHighlightTaskId(taskId);
    const targetId = `task-row-${taskId}`;
    const timeoutId = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 150);
    const clearId = setTimeout(() => setHighlightTaskId(null), 10000);
    return () => {
        clearTimeout(timeoutId);
        clearTimeout(clearId);
    };
}, [location.search, tasks, completedTasks]);


useEffect(() => {
    async function loadDropdownData() {
    try {
        // Fetch sequentially to avoid overwhelming Cloudflare tunnel
        const fetchedBranches = await fetchBranches();
        setBranches(fetchedBranches);

        const fetchedDepartments = await fetchDepartments();
        setDepartments(fetchedDepartments);

        const fetchedEmployees = await fetchEmployees();
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
            const updatedTask = { ...task, is_completed: true, actor_user_id: currentUserId, actor_email: user.email };
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
        const updatedTask = { ...task, is_completed: false, actor_user_id: currentUserId, actor_email: user.email };
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

    navigate(`/tasks/${task.task_id}`);
};


const handleDeleteTask = async (taskId) => {
    if (confirmDelete === taskId) {
        try {
            const deleted = await deleteTask(taskId, currentUserId, user.email);
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


// Transform tasks to include business names
const transformedTasks = tasks.map((task) => ({
    ...task,
    business_name: task.business_name || "No Account",
}));

const transformedCompletedTasks = completedTasks.map((task) => ({
    ...task,
    business_name: task.business_name || "No Account",
}));

const handleCreateTask = async (taskPayload) => {
    try {
        await createTask({
            ...taskPayload,
            user_id: currentUserId,
            actor_user_id: currentUserId,
            actor_email: user.email,
        });

        // Reload tasks
        const fetchedTasks = await fetchTasks(currentUserId);
        const fetchedAccounts = await fetchAccounts();
        const fetchedUsers = await fetchUsers();

        const updatedTasks = fetchedTasks.map((task) => ({
            ...task,
            business_name: task.account_id
                ? fetchedAccounts.find((acc) => acc.account_id === task.account_id)?.business_name || "No Account"
                : "No Account",
            assigned_by_username: fetchedUsers.find((u) => u.user_id === task.user_id)?.username || "Unknown",
        }));

        setTasks(updatedTasks.filter((task) => !task.is_completed));
        setCompletedTasks(updatedTasks.filter((task) => task.is_completed));
    } catch (error) {
        console.error("❌ Error creating task:", error);
    }
};

return (
    <div className="w-full">
    <div className="flex-1 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>

        {isMobile ? (
            <>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded font-medium mt-4 hover:bg-primary/90 transition"
                >
                    + New Task
                </button>
                <div className="mt-6">
                    <TaskListMobile
                        tasks={transformedTasks}
                        completedTasks={transformedCompletedTasks}
                        onTaskComplete={(task) => handleTaskCompletion(task)}
                        onTaskUndo={(task) => handleTaskCompletion(task)}
                        onEditTask={(task) => handleEditTaskClick(task)}
                        onDeleteTask={(taskId) => handleDeleteTask(taskId)}
                        onAccountClick={(accountId) => navigate(`/accounts/details/${accountId}`)}
                        user={user}
                        highlightTaskId={highlightTaskId}
                    />
                </div>
                <CreateTaskModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreateTask={handleCreateTask}
                    accounts={accounts}
                    employees={employees}
                    user={user}
                />
            </>
        ) : (
            <CreateTaskComponent
            user={user}
            branches={branches}
            departments={departments}
            employees={employees}
            accounts={accounts}
            onCreateTask={handleCreateTask}
            />
        )}

        {!isMobile && (
        <>
        {/* Active Tasks */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Active Tasks</h2>
        <table className="w-full border-collapse">
            <thead className="bg-muted text-foreground">
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
                <tr
                    key={task.task_id}
                    id={`task-row-${task.task_id}`}
                    className={`border-b ${highlightTaskId === String(task.task_id) ? "bg-accent/40" : ""}`}
                >
                <td className="p-3 text-left">
                    {task.task_description}
                </td>
                <td className="p-3 text-left">
                    {format(new Date(task.due_date), "MM/dd/yyyy")}
                </td>


                <td className="p-3 text-center">{task.assigned_by_username}</td>
                <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                    <button
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-lg hover:bg-secondary/80 transition-colors"
                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                    >
                        {task.business_name}
                    </button>
                    ) : (
                    <span className="text-muted-foreground">No Account</span>
                    )}
                </td>
                <td className="p-3 text-center flex gap-2">
                    <button
                        className={`px-3 py-1 rounded-lg transition-colors ${
                            task.assigned_by_username === user.username
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                        onClick={() => handleEditTaskClick(task)}
                        disabled={task.assigned_by_username !== user.username}
                    >
                        Edit
                    </button>

                    <button
                        className={`px-3 py-1 rounded-lg transition-colors ${
                            completingTask[task.task_id]
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        onClick={() => handleTaskCompletion(task)}
                    >
                        {completingTask[task.task_id] && !isNaN(completingTask[task.task_id].timeLeft)
                            ? `Undo (${completingTask[task.task_id].timeLeft}s)`
                            : "Complete"}
                    </button>
                </td>
                {editError && (
                    <div className="text-red-600 text-sm mt-2 bg-muted p-2 rounded shadow-lg">
                        {editError}
                    </div>
                )}


                </tr>
            ))}
            </tbody>
        </table>
        </div>

        {/* Completed Tasks */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-md mt-6">
        <button
            className="flex items-center text-lg font-semibold w-full text-left text-foreground"
            onClick={() => setShowCompleted(!showCompleted)}
        >
            {showCompleted ? <FiChevronUp className="mr-2" /> : <FiChevronDown className="mr-2" />}
            Completed Tasks
        </button>
        {showCompleted && (
            <table className="w-full border-collapse mt-4">
            <thead className="bg-muted text-foreground">
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
                    <tr
                        key={`completed-${task.task_id}-${index}`}
                        id={`task-row-${task.task_id}`}
                        className={`border-b ${highlightTaskId === String(task.task_id) ? "bg-accent/40" : ""}`}
                    >

                    <td className="p-3 text-left">{task.task_description}</td>
                    <td className="p-3 text-left">{format(new Date(task.due_date), "MM/dd/yyyy")}</td>
                    <td className="p-3 text-center">{task.assigned_by_username}</td>
                    {/* <td className="p-3 text-center">
                        {users.find((u) => u.user_id === task.user_id)?.username || "Unknown"}
                    </td> */}
                    <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                        <button
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-lg hover:bg-secondary/80 transition-colors"
                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                        >
                        {task.business_name}
                        </button>
                    ) : (
                        <span className="text-muted-foreground">No Account</span>
                    )}
                    </td>
                    <td className="p-3 text-center flex gap-2">
                        <button
                            className="bg-secondary text-secondary-foreground px-3 py-1 rounded-lg hover:bg-secondary/80"
                            onClick={() => handleTaskCompletion(task)}
                        >
                            Undo
                        </button>
                        <button
                            className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg hover:bg-destructive/90"
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
        </>
        )}
    </div>
    </div>
);
};

TasksPage.propTypes = {
user: PropTypes.object.isRequired,
};

export default TasksPage;
