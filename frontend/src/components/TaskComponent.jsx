import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { isToday, isWithinInterval, addDays } from "date-fns";
import { formatDateInTimeZone } from "../utils/timezone";
import { updateTask, createTask, fetchTasks } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { Calendar, Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import CreateTaskModal from "./CreateTaskModal";

const TasksComponent = ({ tasks = [], user = {}, refreshTasks = () => {} }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState([]);
    const [completingTask, setCompletingTask] = useState({});
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const getUsername = useCallback((userId) => {
        const userObj = users.find(user => user.user_id === userId);
        return userObj ? userObj.username : "Unknown";
    }, [users]);

    useEffect(() => {
        async function loadData() {
            if (!user || !user.user_id) return;

            try {
                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
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

    /** Fetch & Process Tasks */
    useEffect(() => {
        if (!tasks.length) return;

        const today = new Date();
        const weekAhead = addDays(today, 7);

        let filteredTasks = tasks.filter(task => {
            if (!task.due_date) return false;  // Ensure `due_date` exists to prevent errors
            const taskDate = new Date(task.due_date);
            
            return !task.is_completed && (
                isToday(taskDate) || isWithinInterval(taskDate, { start: today, end: weekAhead })
            );
        });

        /** Sort tasks by due date (ascending order) */
        filteredTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        /** Map Business Name from Account ID */
        const updatedTasks = filteredTasks.map(task => ({
            ...task,
            assigned_by_username: getUsername(task.user_id),
            business_name: task.account_id
                ? accounts.find(acc => acc.account_id === task.account_id)?.business_name || "No Account"
                : "No Account",

        }));
        console.log("📌 Updated Visible Tasks:", updatedTasks);  //  Debugging log
        setVisibleTasks(updatedTasks);
    }, [tasks, accounts, users, getUsername]);

    /** Create a New Task */
    const handleCreateTask = async (taskPayload) => {
        if (!user?.user_id) {
            console.error("❌ Missing user ID when creating task:", user);
            alert("User ID is missing. Please refresh the page or log in again.");
            return;
        }

        try {
            await createTask({
                ...taskPayload,
                user_id: user.user_id,
                actor_user_id: user.user_id,
                actor_email: user.email,
            });
            if (typeof refreshTasks === "function") {
                await refreshTasks();
            }
        } catch (error) {
            console.error("❌ Error creating task:", error);
            alert("Failed to create task. Please try again.");
        }
    };
    
    // Task Completion Logic
    const handleTaskCompletion = (task) => {
        if (completingTask[task.task_id]) {
            setCompletingTask(prev => ({ ...prev, [task.task_id]: undefined }));
            return;
        }

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
                    updateTask(task.task_id, { is_completed: true, actor_user_id: user.user_id, actor_email: user.email })
                        .then(refreshTasks)
                        .catch(error => console.error("❌ Error updating task:", error));

                    return { ...prev, [task.task_id]: undefined };
                }
                return { ...prev, [task.task_id]: newTime };
            });
        }, 1000);
    };

    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-card shadow-card transition-all",
                isCollapsed && "overflow-hidden"
            )}
        >
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setIsCollapsed((prev) => !prev)}
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
                    <Badge variant="secondary" className="font-medium">
                        {visibleTasks.length} pending
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateModal(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                    </Button>
                    {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <div className="px-4 pb-4">
                    <div className="space-y-3">
                        {visibleTasks.slice(0, 6).map((task) => (
                            <div
                                key={task.task_id}
                                className="rounded-lg border border-border bg-background px-3 py-2 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground break-words">
                                            {task.task_description}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDateInTimeZone(task.due_date, user, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={completingTask[task.task_id] ? "destructive" : "success"}
                                        className={cn("min-w-[92px] text-xs px-2 py-1")}
                                        onClick={() => handleTaskCompletion(task)}
                                    >
                                        {completingTask[task.task_id] ? (
                                            `Undo (${completingTask[task.task_id]}s)`
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-1" />
                                                Complete
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span>
                                        <span className="font-semibold text-foreground">By:</span>{" "}
                                        {task.assigned_by_username || "N/A"}
                                    </span>
                                    <span>
                                        <span className="font-semibold text-foreground">Account:</span>{" "}
                                        {task.account_id && task.business_name ? (
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                                                onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                                            >
                                                {task.business_name}
                                            </Button>
                                        ) : (
                                            "No Account"
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {visibleTasks.length === 0 && (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No tasks scheduled
                            </div>
                        )}
                    </div>
                    {visibleTasks.length > 6 && (
                        <div className="mt-3 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
                                View all tasks
                            </Button>
                        </div>
                    )}
                </div>
            )}
            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateTask={handleCreateTask}
                accounts={accounts}
                employees={users}
                user={user}
            />
        </div>
    );
};

// PropTypes Validation
TasksComponent.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,
            date_created: PropTypes.string.isRequired,
            assigned_by: PropTypes.string,
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string.isRequired,
            is_completed: PropTypes.bool.isRequired,
            account_id: PropTypes.number,
        })
    ),
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
    }).isRequired,
    refreshTasks: PropTypes.func.isRequired,
};

export default TasksComponent;
