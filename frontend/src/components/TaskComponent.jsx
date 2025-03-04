import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { format, isToday, isWithinInterval, addDays } from "date-fns";
import { updateTask, createTask } from "../services/tasksService";
import { fetchAssignedAccounts } from "../services/accountService";
import { useNavigate } from "react-router-dom";

const TasksComponent = ({ tasks = [], user = {}, users = [], refreshTasks = () => {} }) => {
    const navigate = useNavigate();

    const [visibleTasks, setVisibleTasks] = useState([]);
    const [completingTask, setCompletingTask] = useState({});
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState(user.id);
    const [searchUser, setSearchUser] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchAccount, setSearchAccount] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // ✅ Show only incomplete tasks due today or within 7 days
    useEffect(() => {
        if (!tasks.length) return;

        const today = new Date();
        const weekAhead = addDays(today, 7);

        const filteredTasks = tasks.filter(task => {
            const taskDate = new Date(task.due_date);
            return !task.is_completed && (isToday(taskDate) || isWithinInterval(taskDate, { start: today, end: weekAhead }));
        });

        setVisibleTasks(filteredTasks);
    }, [tasks]);

    // ✅ Fetch Assigned Accounts
    useEffect(() => {
        if (!user.id) return;
        fetchAssignedAccounts(user.id).then(setFilteredAccounts);
    }, [user]);

    // ✅ Search for Users to Assign Task
    const handleUserSearch = (query) => {
        setSearchUser(query);
        if (!query.trim()) {
            setFilteredUsers([]);
            return;
        }

        const results = users.filter(user =>
            `${user.first_name} ${user.last_name} (${user.username})`.toLowerCase().includes(query.toLowerCase())
        );

        setFilteredUsers(results);
    };

    // ✅ Search for Accounts by Business Name
    const handleAccountSearch = (query) => {
        setSearchAccount(query);
        if (!query.trim()) {
            setFilteredAccounts([]);
            return;
        }

        const results = filteredAccounts.filter(acc =>
            acc.business_name.toLowerCase().includes(query.toLowerCase())
        );

        setFilteredAccounts(results);
    };

    // ✅ Create a New Task
    const handleCreateTask = async () => {
        if (!newTaskDescription.trim()) return alert("❌ Task description cannot be empty.");

        const taskData = {
            user_id: user.id,
            assigned_to: assignedTo,
            task_description: newTaskDescription.trim(),
            due_date: dueDate || null,
            account_id: selectedAccount?.account_id || null,
        };

        try {
            await createTask(taskData);
            setNewTaskDescription("");
            setDueDate("");
            setAssignedTo(user.id);
            setSearchUser("");
            setFilteredUsers([]);
            setSearchAccount("");
            setSelectedAccount(null);
            refreshTasks();
        } catch (error) {
            console.error("❌ Error creating task:", error);
            alert("Failed to create task. Please try again.");
        }
    };

    // ✅ Task Completion with Undo Option
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
                    setVisibleTasks(prev => prev.filter(t => t.task_id !== task.task_id));

                    updateTask(task.task_id, { is_completed: true })
                        .then(() => refreshTasks())
                        .catch(error => console.error("❌ Error updating task:", error));

                    return { ...prev, [task.task_id]: undefined };
                }
                return { ...prev, [task.task_id]: newTime };
            });
        }, 1000);
    };

    return (
        <div className="bg-white shadow-lg p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">📋 My Tasks</h3>
    
        {/* Create Task Section */}
        <div className="sticky top-0 bg-white pb-4 z-10">
            <div className="grid grid-cols-6 gap-4 items-center mb-4">
                <input
                    type="text"
                    placeholder="New task..."
                    className="border p-2 rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <input
                    type="date"
                    className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
                <div className="relative col-span-2">
                    <input
                        type="text"
                        placeholder="Assign to Account"
                        className="border p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchAccount}
                        onChange={(e) => handleAccountSearch(e.target.value)}
                    />
                    {filteredAccounts.length > 0 && (
                        <div className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg max-h-40 overflow-y-scroll z-10">
                            {filteredAccounts.map((acc) => (
                                <div
                                    key={acc.account_id}
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
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Create
                </button>
            </div>
        </div>
    
        {/* Tasks Table */}
        <div className="overflow-y-auto max-h-[400px]">
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
                    {visibleTasks.slice(0, 6).map(task => (
                        <tr key={task.task_id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-gray-800">{task.task_description}</td>
                            <td className="p-3 text-gray-700">{format(new Date(task.due_date), "MM/dd/yyyy")}</td>
                            <td className="p-3 text-gray-700">{task.assigned_by || "N/A"}</td>
                            <td className="p-3">
                                {task.account_id ? (
                                    <button
                                        onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        View
                                    </button>
                                ) : "-"}
                            </td>
                            <td className="p-3 text-center">
                                {completingTask[task.task_id] ? (
                                    <button
                                        onClick={() => handleTaskCompletion(task)}
                                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Undo ({completingTask[task.task_id]}s)
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleTaskCompletion(task)}
                                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Complete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    );
};


// ✅ PropTypes Validation
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
        id: PropTypes.number.isRequired,
    }).isRequired,
    refreshTasks: PropTypes.func.isRequired,
};

export default TasksComponent;
