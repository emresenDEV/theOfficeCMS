import { useState, useEffect, useCallback } from "react";
import { isToday, isWithinInterval, addDays, isPast } from "date-fns";
import PropTypes from "prop-types";
import { updateTask } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { useNavigate } from "react-router-dom";
import CreateTaskMobileForm from "./CreateTaskMobileForm";
import { formatDateInTimeZone } from "../utils/timezone";

const TasksMobileMini = ({ tasks = [], user = {}, refreshTasks = () => {} }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState([]);
    const [completingTask, setCompletingTask] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Get user full name from user_id
    const getUserFullName = useCallback((userId) => {
        const userObj = users.find(u => u.user_id === userId);
        return userObj ? `${userObj.first_name} ${userObj.last_name}` : "Unknown";
    }, [users]);

    // Get business name from account_id
    const getBusinessName = useCallback((accountId) => {
        if (!accountId) return null;
        const account = accounts.find(acc => acc.account_id === accountId);
        return account?.business_name || null;
    }, [accounts]);

    // Load accounts and users
    useEffect(() => {
        async function loadData() {
            if (!user || !user.user_id) return;

            try {
                const fetchedAccounts = await fetchAccounts();
                setAccounts(fetchedAccounts);

                const fetchedUsers = await fetchUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("❌ Error fetching data:", error);
            }
        }

        loadData();
    }, [user]);

    // Process and filter tasks - use same logic as standard TasksComponent
    useEffect(() => {
        console.log("📋 TasksMobileMini - Received tasks:", tasks);

        if (!tasks.length) {
            console.log("📋 No tasks provided");
            setVisibleTasks([]);
            return;
        }

        const today = new Date();
        const weekAhead = addDays(today, 7);

        console.log("📋 Filtering tasks - Today:", today, "Week Ahead:", weekAhead);

        let filteredTasks = tasks.filter(task => {
            if (!task.due_date) {
                console.log("⚠️ Task missing due_date:", task);
                return false;
            }

            // Use same date parsing as standard TasksComponent
            const taskDate = new Date(task.due_date);
            console.log(`📋 Task "${task.task_description}": due_date="${task.due_date}" → isToday=${isToday(taskDate)}, withinInterval=${isWithinInterval(taskDate, { start: today, end: weekAhead })}`);

            return !task.is_completed && (
                isToday(taskDate) || isWithinInterval(taskDate, { start: today, end: weekAhead })
            );
        });

        console.log("📌 Filtered Tasks Count:", filteredTasks.length);

        // Sort tasks by due date (ascending) - same as standard
        filteredTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        // Enrich task data
        const updatedTasks = filteredTasks.map(task => ({
            ...task,
            assigned_by_full_name: getUserFullName(task.user_id),
            business_name: getBusinessName(task.account_id),
            isPastDue: isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)),
        }));

        console.log("📌 Updated Visible Tasks (Mobile):", updatedTasks);
        setVisibleTasks(updatedTasks);
    }, [tasks, accounts, users, getUserFullName, getBusinessName]);

    // Handle task completion with undo timer
    const handleTaskCompletion = (task) => {
        if (completingTask[task.task_id]) {
            // Undo the completion
            setCompletingTask(prev => ({ ...prev, [task.task_id]: undefined }));
            return;
        }

        // Mark as completing with 5-second countdown
        setCompletingTask(prev => ({ ...prev, [task.task_id]: 5 }));

        const countdown = setInterval(() => {
            setCompletingTask(prev => {
                if (!prev[task.task_id]) {
                    clearInterval(countdown);
                    return prev;
                }
                const newTime = prev[task.task_id] - 1;
                if (newTime === 0) {
                    clearInterval(countdown);
                    updateTask(task.task_id, { is_completed: true, actor_user_id: user.user_id })
                        .then(refreshTasks)
                        .catch(error => console.error("❌ Error updating task:", error));

                    return { ...prev, [task.task_id]: undefined };
                }
                return { ...prev, [task.task_id]: newTime };
            });
        }, 1000);
    };

    // Check if current user created the task
    const canEditTask = (task) => {
        return task.user_id === user.user_id;
    };

    // Format due date with color indicator
    const getDueDateColor = (task) => {
        if (task.isPastDue) {
            return "text-red-600 font-semibold"; // Past due
        }
        return "text-green-600 font-semibold"; // Future date
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-md p-4">
            {/* Header with Title and Create Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">My Tasks</h2>
                <div className="flex items-center gap-2">
                    {!isCollapsed && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                            title="Create new task"
                        >
                            +
                        </button>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-xl cursor-pointer"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? "+" : "−"}
                    </button>
                </div>
            </div>

            {/* Task Cards List */}
            {!isCollapsed && (
                <div className="space-y-3">
                    {visibleTasks.length > 0 ? (
                        visibleTasks.map(task => (
                            <div
                                key={task.task_id}
                            className="border border-border rounded p-3 cursor-pointer hover:shadow-md transition bg-background hover:bg-muted flex justify-between items-start"
                            >
                                {/* Left Side - Task Details */}
                                <div className="flex-1">
                                    {/* Task Description - Bold */}
                                    <div className="text-sm font-bold text-foreground mb-2">
                                        {task.task_description}
                                    </div>

                                    {/* Due Date - Red if past due, Green if future */}
                                    <div className={`text-xs mb-1 ${getDueDateColor(task)}`}>
                                        Due: {formatDateInTimeZone(task.due_date, user, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>

                                    {/* Account - Button to navigate to account details or blank */}
                                    {task.account_id && task.business_name ? (
                                        <div className="text-xs mb-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/accounts/details/${task.account_id}`);
                                                }}
                                                className="text-primary hover:text-primary/80 hover:underline font-semibold"
                                            >
                                                Account: {task.business_name}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs mb-1 text-muted-foreground">
                                            Account: None
                                        </div>
                                    )}

                                    {/* Assigned By - Full name */}
                                    <div className="text-xs text-muted-foreground">
                                        Assigned by: {task.assigned_by_full_name}
                                    </div>
                                </div>

                                {/* Right Side - Checkbox and Edit Button */}
                                <div className="flex flex-col items-center gap-2 ml-3">
                                    {/* Checkbox with Undo Timer */}
                                    <button
                                        onClick={() => handleTaskCompletion(task)}
                                        className={`w-6 h-6 flex items-center justify-center rounded border-2 transition-colors ${
                                            completingTask[task.task_id]
                                                ? "bg-success border-success text-success-foreground"
                                                : "border-border hover:border-foreground/40"
                                        }`}
                                        title={completingTask[task.task_id] ? `Undo (${completingTask[task.task_id]}s)` : "Mark complete"}
                                    >
                                        {completingTask[task.task_id] && (
                                            <span className="text-xs font-bold">✓</span>
                                        )}
                                    </button>

                                    {/* Undo Timer Display */}
                                    {completingTask[task.task_id] && (
                                        <div className="text-xs text-red-600 font-semibold">
                                            {completingTask[task.task_id]}s
                                        </div>
                                    )}

                                    {/* Edit Button - Disabled if not created by current user */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (canEditTask(task)) {
                                                // TODO: Open edit modal for the task
                                                console.log("Edit task:", task.task_id);
                                            }
                                        }}
                                        disabled={!canEditTask(task)}
                                        className={`text-xs px-2 py-1 rounded transition-colors ${
                                            canEditTask(task)
                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                        }`}
                                        title={canEditTask(task) ? "Edit task" : "Only creator can edit"}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">No tasks scheduled</p>
                    )}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-card p-6 rounded-lg w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto border border-border">
                        <CreateTaskMobileForm
                            user={user}
                            closeForm={() => setShowCreateModal(false)}
                            refreshTasks={refreshTasks}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

TasksMobileMini.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string.isRequired,
            is_completed: PropTypes.bool.isRequired,
            account_id: PropTypes.number,
            user_id: PropTypes.number.isRequired,
        })
    ),
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
    }).isRequired,
    refreshTasks: PropTypes.func.isRequired,
};

export default TasksMobileMini;
