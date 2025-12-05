import { useState, useEffect, useCallback } from "react";
import { format, isToday, isWithinInterval, addDays, isPast } from "date-fns";
import PropTypes from "prop-types";
import { updateTask, fetchTasks } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { useNavigate } from "react-router-dom";
import CreateTaskMobileForm from "./CreateTaskMobileForm";

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

    // Parse date string in format "YYYY-MM-DD HH:MM:SS" or ISO format
    const parseTaskDate = (dateString) => {
        if (!dateString) return null;
        // Replace space with T for ISO parsing
        const isoString = dateString.replace(" ", "T");
        return new Date(isoString);
    };

    // Process and filter tasks
    useEffect(() => {
        if (!tasks.length) {
            setVisibleTasks([]);
            return;
        }

        const today = new Date();
        const weekAhead = addDays(today, 7);

        let filteredTasks = tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = parseTaskDate(task.due_date);

            if (!taskDate || isNaN(taskDate.getTime())) {
                console.warn("⚠️ Invalid task date:", task.due_date);
                return false;
            }

            return !task.is_completed && (
                isToday(taskDate) || isWithinInterval(taskDate, { start: today, end: weekAhead })
            );
        });

        // Sort tasks by due date (ascending)
        filteredTasks.sort((a, b) => {
            const dateA = parseTaskDate(a.due_date) || new Date();
            const dateB = parseTaskDate(b.due_date) || new Date();
            return dateA - dateB;
        });

        // Enrich task data
        const updatedTasks = filteredTasks.map(task => ({
            ...task,
            assigned_by_full_name: getUserFullName(task.user_id),
            business_name: getBusinessName(task.account_id),
            isPastDue: isPast(parseTaskDate(task.due_date)) && !isToday(parseTaskDate(task.due_date)),
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
                    updateTask(task.task_id, { is_completed: true })
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
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Header with Title and Create Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">My Tasks</h2>
                <div className="flex items-center gap-2">
                    {!isCollapsed && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 font-bold"
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
                                className="border rounded p-3 cursor-pointer hover:shadow-md transition bg-gray-50 hover:bg-gray-100 flex justify-between items-start"
                            >
                                {/* Left Side - Task Details */}
                                <div className="flex-1">
                                    {/* Task Description - Bold */}
                                    <div className="text-sm font-bold text-gray-900 mb-2">
                                        {task.task_description}
                                    </div>

                                    {/* Due Date - Red if past due, Green if future */}
                                    <div className={`text-xs mb-1 ${getDueDateColor(task)}`}>
                                        Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                                    </div>

                                    {/* Account - Button to navigate to account details or blank */}
                                    {task.account_id && task.business_name ? (
                                        <div className="text-xs mb-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/accounts/details/${task.account_id}`);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                            >
                                                Account: {task.business_name}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs mb-1 text-gray-500">
                                            Account: None
                                        </div>
                                    )}

                                    {/* Assigned By - Full name */}
                                    <div className="text-xs text-gray-600">
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
                                                ? "bg-green-500 border-green-500 text-white"
                                                : "border-gray-300 hover:border-gray-400"
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
                                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                        title={canEditTask(task) ? "Edit task" : "Only creator can edit"}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-4">No tasks scheduled</p>
                    )}
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
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
