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
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const TasksComponent = ({ tasks = [], user = {}, refreshTasks = () => {} }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState([]);
    const [completingTask, setCompletingTask] = useState({});
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchAccount, setSearchAccount] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);

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

    // Dynamic Account Search
    useEffect(() => {
        if (!searchAccount.trim()) {
            // setFilteredAccounts(accounts); 
            setFilteredAccounts([]);
            return;
        }
    
        setFilteredAccounts(
            accounts.filter(acc =>
                acc.business_name.toLowerCase().includes(searchAccount.toLowerCase().trim())
            )
        );
    }, [searchAccount, accounts]);
    
    /** Create a New Task */
    const handleCreateTask = async () => {
        if (!newTaskDescription.trim()) return alert("❌ Task description cannot be empty.");
        if (!user.user_id) {
            console.error("❌ Missing user ID when creating task:", user);
            alert("User ID is missing. Please refresh the page or log in again.");
            return;
        }

        const formattedDueDate = dueDate ? new Date(dueDate).toISOString().slice(0, 19).replace("T", " ") : null;

        const taskData = {
            user_id: user.user_id,
            assigned_to: user.user_id,
            task_description: newTaskDescription.trim(),
            due_date: formattedDueDate,
            is_completed: false,
            account_id: selectedAccount?.account_id || null,
            actor_user_id: user.user_id,
            actor_email: user.email,
        };

        console.log("📤 Creating Task:", taskData); // Debugging log

        try {
            await createTask(taskData);
            setNewTaskDescription("");
            setDueDate("");
            setSelectedAccount(null);
            setSearchAccount("");

            // Fetch the latest tasks after creation
            const updatedTasks = await fetchTasks(user.user_id);
            console.log("✅ Fetched Updated Tasks:", updatedTasks);

            // Ensure `tasks` are correctly updated
            if (updatedTasks.length > 0) {
                setVisibleTasks(updatedTasks);
            }

            if (typeof refreshTasks === "function") {
                await refreshTasks();
            } else {
                console.warn("⚠️ `refreshTasks` is not a function.");
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
                    {/* New Task Inputs */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center mb-4">
                        <Input
                            type="text"
                            placeholder="New task..."
                            className="md:col-span-4"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                        />
                        <Input
                            type="date"
                            className="md:col-span-2"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        <div className="relative md:col-span-4">
                            <Input
                                type="text"
                                placeholder="Search by account"
                                value={searchAccount}
                                onChange={(e) => setSearchAccount(e.target.value)}
                            />
                            {searchAccount.trim() && filteredAccounts.length > 0 && (
                                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                                    {filteredAccounts.map((acc) => (
                                        <div
                                            key={acc.account_id}
                                            className="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-muted/60"
                                            onClick={() => {
                                                setSelectedAccount(acc);
                                                setSearchAccount(acc.business_name);
                                                setFilteredAccounts([]);
                                            }}
                                        >
                                            {acc.business_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={handleCreateTask}
                            className="md:col-span-2"
                        >
                            Create
                        </Button>
                    </div>

                    {/* Tasks Table */}
                    <div className="max-h-[350px] overflow-auto">
                        <table className="min-w-[800px] w-full">
                            <thead className="sticky top-0 bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Task
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Due Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Assigned By
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Account
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {visibleTasks.map((task) => (
                                    <tr key={task.task_id} className="hover:bg-muted/60 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                                            {task.task_description}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatDateInTimeZone(task.due_date, user, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {task.assigned_by_username || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {task.account_id && task.business_name ? (
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                                                    onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                                                >
                                                    {task.business_name}
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No Account</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm"
                                                variant={completingTask[task.task_id] ? "destructive" : "success"}
                                                className={cn("min-w-[110px]")}
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {visibleTasks.length === 0 && (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                No tasks scheduled
                            </div>
                        )}
                    </div>
                </div>
            )}
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
