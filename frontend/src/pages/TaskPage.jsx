import { useEffect, useState } from "react";
import { fetchTasks, createTask, deleteTask, fetchDepartments, fetchEmployees, fetchUsers, updateTask } from "../services/tasksService";
import { fetchBranches } from "../services/branchService";
import { fetchAccounts } from "../services/accountService";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";
import { FiChevronDown, FiChevronUp, FiEdit2 } from "react-icons/fi";
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
const [taskToast, setTaskToast] = useState("");
const [createdSortOrder, setCreatedSortOrder] = useState("desc");
const [editModalTask, setEditModalTask] = useState(null);
const [editForm, setEditForm] = useState(null);
const [editSaving, setEditSaving] = useState(false);
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
    if (!taskToast) return;
    const timeoutId = setTimeout(() => setTaskToast(""), 3000);
    return () => clearTimeout(timeoutId);
}, [taskToast]);


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
    if (task.user_id !== currentUserId) {
        setEditError(`You can only edit tasks that you created`);
        setTimeout(() => setEditError(null), 5000);
        return;
    }
    const dueDate = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "";
    setEditForm({
        task_description: task.task_description || "",
        due_date: dueDate,
        assigned_to: task.assigned_to || "",
    });
    setEditModalTask(task);
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
        const created = await createTask({
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
        if (created?.task_id) {
            setTaskToast("Task created successfully.");
        }
        return created;
    } catch (error) {
        console.error("❌ Error creating task:", error);
        return null;
    }
};

const handleEditSave = async () => {
    if (!editModalTask) return;
    setEditSaving(true);
    const payload = {
        task_description: editForm.task_description,
        due_date: editForm.due_date
            ? new Date(editForm.due_date).toISOString().replace("T", " ").split(".")[0]
            : null,
        assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
        actor_user_id: currentUserId,
        actor_email: user.email,
    };
    const updated = await updateTask(editModalTask.task_id, payload);
    if (updated) {
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
        setEditModalTask(null);
        setEditForm(null);
    }
    setEditSaving(false);
};

const parseCreatedDate = (value) => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const sortedActiveTasks = [...tasks].sort((a, b) => {
    const diff = parseCreatedDate(a.date_created) - parseCreatedDate(b.date_created);
    return createdSortOrder === "asc" ? diff : -diff;
});

const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
    const diff = parseCreatedDate(a.date_created) - parseCreatedDate(b.date_created);
    return createdSortOrder === "asc" ? diff : -diff;
});

return (
    <div className="w-full">
    <div className="flex-1 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        {taskToast && (
            <div className="mt-3 inline-flex rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                {taskToast}
            </div>
        )}

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
                        tasks={sortedActiveTasks.map((task) => ({
                            ...task,
                            business_name: task.business_name || "No Account",
                        }))}
                        completedTasks={sortedCompletedTasks.map((task) => ({
                            ...task,
                            business_name: task.business_name || "No Account",
                        }))}
                        onTaskComplete={(task) => handleTaskCompletion(task)}
                        onTaskUndo={(task) => handleTaskCompletion(task)}
                        onEditTask={(task) => handleEditTaskClick(task)}
                        onDeleteTask={(taskId) => handleDeleteTask(taskId)}
                        onAccountClick={(accountId) => navigate(`/accounts/details/${accountId}`)}
                        onTaskClick={(taskId) => navigate(`/tasks/${taskId}`)}
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Active Tasks</h2>
            <button
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                onClick={() => setCreatedSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
                {createdSortOrder === "desc" ? "Newest First" : "Oldest First"}
            </button>
        </div>
        <table className="w-full border-collapse">
            <thead className="bg-muted text-foreground">
            <tr>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-center">Assigned By</th>
                <th className="p-3 text-center">Account</th>
                <th className="p-3 text-center">Actions</th>
            </tr>
            </thead>
            <tbody>
            {sortedActiveTasks.map((task) => (
                <tr
                    key={task.task_id}
                    id={`task-row-${task.task_id}`}
                    className={`border-b ${highlightTaskId === String(task.task_id) ? "bg-accent/40" : ""}`}
                >
                <td className="p-3 text-left">
                    <button
                        className="text-left text-primary hover:underline"
                        onClick={() => navigate(`/tasks/${task.task_id}`)}
                    >
                        {task.task_description}
                    </button>
                </td>
                <td className="p-3 text-left">
                    {task.date_created ? formatDateInTimeZone(task.date_created, user, {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                    }) : "—"}
                </td>
                <td className="p-3 text-left">
                    {formatDateInTimeZone(task.due_date, user, {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                    })}
                </td>


                <td className="p-3 text-center">{task.assigned_by_username}</td>
                <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                    <button
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                    >
                        {task.business_name}
                    </button>
                    ) : (
                    <span className="text-muted-foreground">No Account</span>
                    )}
                </td>
                <td className="p-3 text-center flex items-center justify-center gap-2">
                    <button
                        className={`h-9 w-9 rounded-full border border-border transition-colors ${
                            task.user_id === currentUserId
                                ? "bg-card text-foreground hover:bg-muted"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                        onClick={() => handleEditTaskClick(task)}
                        disabled={task.user_id !== currentUserId}
                        aria-label="Edit task"
                    >
                        <FiEdit2 />
                    </button>

                    <button
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
                </tr>
            ))}
            </tbody>
        </table>
        {editError && (
            <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-sm text-red-600">
                {editError}
            </div>
        )}
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
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-center">Assigned By</th>
                <th className="p-3 text-center">Account</th>
                <th className="p-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedCompletedTasks.map((task, index) => (
                    <tr
                        key={`completed-${task.task_id}-${index}`}
                        id={`task-row-${task.task_id}`}
                        className={`border-b ${highlightTaskId === String(task.task_id) ? "bg-accent/40" : ""}`}
                    >

                    <td className="p-3 text-left">
                        <button
                            className="text-left text-primary hover:underline"
                            onClick={() => navigate(`/tasks/${task.task_id}`)}
                        >
                            {task.task_description}
                        </button>
                    </td>
                    <td className="p-3 text-left">
                        {task.date_created ? formatDateInTimeZone(task.date_created, user, {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                        }) : "—"}
                    </td>
                    <td className="p-3 text-left">
                        {formatDateInTimeZone(task.due_date, user, {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                        })}
                    </td>
                    <td className="p-3 text-center">{task.assigned_by_username}</td>
                    {/* <td className="p-3 text-center">
                        {users.find((u) => u.user_id === task.user_id)?.username || "Unknown"}
                    </td> */}
                    <td className="p-3 text-center">
                    {task.business_name !== "No Account" ? (
                        <button
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
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
    {editModalTask && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
                        <p className="text-xs text-muted-foreground">Update task details.</p>
                    </div>
                    <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setEditModalTask(null);
                            setEditForm(null);
                        }}
                        aria-label="Close edit"
                    >
                        ✕
                    </button>
                </div>
                <div className="mt-4 space-y-3">
                    <input
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={editForm.task_description}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, task_description: e.target.value }))}
                        placeholder="Task description"
                    />
                    <input
                        type="date"
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, due_date: e.target.value }))}
                    />
                    <select
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={editForm.assigned_to}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                    >
                        <option value="">Assign to</option>
                        {employees.map((emp) => (
                            <option key={emp.user_id} value={emp.user_id}>
                                {emp.first_name} {emp.last_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => {
                            setEditModalTask(null);
                            setEditForm(null);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                        onClick={handleEditSave}
                        disabled={editSaving}
                    >
                        {editSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )}
    </div>
);
};

TasksPage.propTypes = {
user: PropTypes.object.isRequired,
};

export default TasksPage;
