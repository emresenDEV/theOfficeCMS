import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { format, isToday, isWithinInterval, addDays } from "date-fns";
import { updateTask, createTask, fetchTasks } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

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
                    updateTask(task.task_id, { is_completed: true })
                        .then(refreshTasks)
                        .catch(error => console.error("❌ Error updating task:", error));

                    return { ...prev, [task.task_id]: undefined };
                }
                return { ...prev, [task.task_id]: newTime };
            });
        }, 1000);
    };

    return (
        <div className={`bg-white shadow-lg rounded-lg transition-all duration-300 ${isCollapsed ? "h-14 overflow-hidden" : "h-auto"}`}>
            <div className="flex justify-between items-center px-4 py-3 cursor-pointer" onClick={() => setIsCollapsed(prev => !prev)}>
                <h3 className="text-lg font-bold text-gray-700">📋 My Tasks</h3>
                <button>
                    {isCollapsed ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronUpIcon className="w-6 h-6 text-gray-500" />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="p-4">
                    {/* New Task Inputs */}
                    <div className="grid grid-cols-12 gap-4 items-center mb-4">
                        <input
                            type="text"
                            placeholder="New task..."
                            className="border p-2 rounded-lg col-span-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border p-2 rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        <div className="relative col-span-4">
                            <input
                                type="text"
                                placeholder="Search by Business Name"
                                className="border p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchAccount}
                                onChange={(e) => setSearchAccount(e.target.value)}
                            />
                            {searchAccount.trim() && filteredAccounts.length > 0 && (
                                <div className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg max-h-40 overflow-y-scroll z-10">
                                    {filteredAccounts.map(acc => (
                                        <div key={acc.account_id}
                                            className="p-2 cursor-pointer hover:bg-gray-100"
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
                        <button
                            onClick={handleCreateTask}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors col-span-2"
                        >
                            Create
                        </button>
                    </div>

                    {/* Tasks Table */}
                    <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-100 shadow-sm">
                                <tr>
                                    <th className="p-3 border-b text-gray-700">Task</th>
                                    <th className="p-3 border-b text-gray-700">Due Date</th>
                                    <th className="p-3 border-b text-gray-700">Assigned By</th>
                                    <th className="p-3 border-b text-gray-700">Account</th>
                                    <th className="p-3 border-b text-gray-700 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleTasks.map(task => (
                                    <tr key={task.task_id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-gray-800">{task.task_description}</td>
                                        <td className="p-3 text-gray-700">{format(new Date(task.due_date), "MM/dd/yyyy")}</td>
                                        <td className="p-3 text-gray-700">{task.assigned_by_username || "N/A"}</td>
                                        <td className="p-3">
                                            {task.account_id && task.business_name ? (
                                                <button 
                                                    onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors">
                                                    {task.business_name}
                                                </button>
                                            ) : (
                                                <span className="text-gray-500">No Account</span>
                                            )}
                                        </td>

                                        <td className="p-3 text-center">
                                            <button onClick={() => handleTaskCompletion(task)}
                                                className={`px-3 py-1 rounded-lg transition-colors ${
                                                    completingTask[task.task_id] ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                                                }`}>
                                                {completingTask[task.task_id] ? `Undo (${completingTask[task.task_id]}s)` : "Complete"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
