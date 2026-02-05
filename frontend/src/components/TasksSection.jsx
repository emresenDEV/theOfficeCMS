import { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { createTask, updateTask } from "../services/tasksService";

const TasksSection = ({ tasks, users, userId, accountId, setTasks, refreshTasks }) => {
    const [searchTasks, setSearchTasks] = useState("");
    const [taskFilter, setTaskFilter] = useState("all");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState(null);
    const [assignedToSearch, setAssignedToSearch] = useState(""); // For user search input
    const [filteredUsers, setFilteredUsers] = useState([]); // Filtered list based on input
    const [dueDate, setDueDate] = useState("");

    // Helper: Get Username from `created_by`
    const getCreatedByUsername = (creator) => {
        if (typeof creator === "string") return creator;
        if (!users || users.length === 0) return "Unknown Creator";
        const user = users.find((u) => Number(u.user_id) === Number(creator));
        return user ? user.username : "Unknown Creator";
    };

    // Helper: Get Username from `assigned_to`
    const getAssignedToUsername = (assignedToId) => {
        if (!users || users.length === 0 || !assignedToId) return "Unassigned";
        const user = users.find((u) => Number(u.user_id) === Number(assignedToId));
        return user ? user.username : "Unassigned";
    };

    // Filter Tasks
    const filteredTasks = tasks.filter((task) => {
        const createdByUsername = (getCreatedByUsername(task.created_by) || "").toLowerCase();
        const assignedToUsername = (getAssignedToUsername(task.assigned_to) || "").toLowerCase();

        return (
            (searchTasks === "" ||
                createdByUsername.includes(searchTasks.toLowerCase()) ||
                assignedToUsername.includes(searchTasks.toLowerCase())) &&
            (taskFilter === "all" ||
                (taskFilter === "completed" && task.is_completed) ||
                (taskFilter === "incomplete" && !task.is_completed))
        );
    });

    // Format Date (MM/DD/YYYY)
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MM/dd/yyyy");
    };

    // Create a New Task
    const handleCreateTask = async () => {
        if (!newTaskDescription.trim()) return alert("❌ Task description cannot be empty.");

        const taskData = {
            account_id: accountId,
            user_id: userId,
            assigned_to: assignedTo || userId,
            task_description: newTaskDescription.trim(),
            due_date: dueDate || null,
            actor_user_id: userId,
        };

        try {
            const response = await createTask(taskData);
            if (response && response.success) {
                setNewTaskDescription(""); // Clear form inputs
                setAssignedTo(null);
                setAssignedToSearch("");
                setDueDate("");
                await refreshTasks(); // Refresh tasks list
            }
        } catch (error) {
            console.error("❌ Error creating task:", error);
            alert("Failed to create task. Please try again.");
        }
    };

    // Handle searching through users
    const handleAssigneeSearch = (input) => {
        setAssignedToSearch(input);
        if (input.trim() === "") {
            setFilteredUsers([]);
            return;
        }
        const searchTerm = input.toLowerCase();
        const results = users.filter((user) => {
            const usernameLower = (user.username || "").toLowerCase();
            const firstNameLower = (user.first_name || "").toLowerCase();
            const lastNameLower = (user.last_name || "").toLowerCase();
            return (
                usernameLower.includes(searchTerm) ||
                firstNameLower.includes(searchTerm) ||
                lastNameLower.includes(searchTerm)
            );
        });
        setFilteredUsers(results);
    };

    // Handle Assignee Select
    const handleAssigneeSelect = (user) => {
        setAssignedTo(user.user_id); // Save selected user's ID for backend
        setAssignedToSearch(`${user.first_name} ${user.last_name} (${user.username})`);
        setFilteredUsers([]); // Clear the dropdown
    };

    // Toggle Task Completion Status
    const toggleTaskStatus = async (taskId, currentStatus) => {
        try {
            await updateTask(taskId, { is_completed: !currentStatus, actor_user_id: userId });
            await refreshTasks();
        } catch (error) {
            console.error("❌ Error updating task status:", error);
        }
    };

    // Clear Filters
    const clearFilters = () => {
        setTaskFilter("all");
        setSearchTasks("");
    };

    return (
        <div className="mt-6 border border-border p-4 rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-foreground">Tasks</h2>

            {/* Task Filter/Search */}
            <div className="flex justify-between items-center mb-3">
                <input
                    type="text"
                    placeholder="Search tasks..."
                    className="border border-border bg-card text-foreground p-2 rounded w-1/3 flex-grow"
                    value={searchTasks}
                    onChange={(e) => setSearchTasks(e.target.value)}
                />
                <div>
                    <button 
                        onClick={() => setTaskFilter("completed")} 
                        className="bg-emerald-100 text-emerald-700 px-3 py-2 mx-1 rounded shadow-sm hover:bg-emerald-200 transition-colors"
                    >
                        Completed
                    </button>
                    <button 
                        onClick={() => setTaskFilter("incomplete")} 
                        className="bg-rose-100 text-rose-700 px-3 py-2 mx-1 rounded shadow-sm hover:bg-rose-200 transition-colors"
                    >
                        Incomplete
                    </button>
                    <button 
                        onClick={clearFilters} 
                        className="bg-secondary text-secondary-foreground px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Create New Task Section */}
            <div className="grid items-center gap-2 mb-4 md:grid-cols-[2fr,2fr,1fr,auto]">
                <input
                    type="text"
                    placeholder="New task..."
                    className="border border-border bg-card text-foreground p-2 rounded w-full"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Assigned To (search by name/username)"
                        className="border border-border bg-card text-foreground p-2 rounded w-full"
                        value={assignedToSearch}
                        onChange={(e) => handleAssigneeSearch(e.target.value)}
                    />
                    {filteredUsers.length > 0 && (
                        <div className="absolute bg-card border border-border w-full mt-1 rounded-lg shadow-lg z-50 max-h-40 overflow-y-scroll">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.user_id}
                                    className="p-2 cursor-pointer hover:bg-muted text-foreground"
                                    onClick={() => handleAssigneeSelect(user)}
                                >
                                    {user.first_name} {user.last_name} ({user.username})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <input
                    type="date"
                    className="border border-border bg-card text-foreground p-2 rounded w-full"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
                <button
                    onClick={handleCreateTask}
                    className="bg-primary text-primary-foreground px-3 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
                >
                    Create
                </button>
            </div>

            {/* ✅ Tasks Table */}
            <div className="overflow-y-auto h-48 border border-border rounded-lg">
                {filteredTasks.length > 0 ? (
                    <table className="w-full text-foreground">
                        <thead className="sticky top-0 bg-card shadow-sm">
                            <tr>
                                <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Date</th>
                                <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Created By</th>
                                <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Assigned To</th>
                                <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Description</th>
                                <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Due Date</th>
                                <th className="font-bold p-2 border-b text-center text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task, index) => (
                                <tr
                                    key={task.task_id}
                                    className={`hover:bg-muted/60 ${
                                        index % 2 === 0 ? "bg-muted/40" : "bg-card"
                                    }`}
                                >
                                    <td className="p-2 border-b border-r text-left">{formatDate(task.date_created)}</td>
                                    <td className="p-2 border-b border-r text-left">{getCreatedByUsername(task.created_by || task.user_id)}</td>
                                    <td className="p-2 border-b border-r text-left">{getAssignedToUsername(task.assigned_to)}</td>
                                    <td className="p-2 border-b border-r text-left">{task.task_description}</td>
                                    <td className="p-2 border-b border-r text-left">{formatDate(task.due_date)}</td>
                                    <td
                                        className="p-2 border-b text-center cursor-pointer"
                                        onClick={() => toggleTaskStatus(task.task_id, task.is_completed)}
                                    >
                                        {task.is_completed ? "✅ Completed" : "❌ Incomplete"}
                                        <span className="block text-xs text-muted-foreground">Click to update</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-muted-foreground text-center mt-2">
                        No tasks available. Create a task to add one.
                    </p>
                )}
            </div>
        </div>
    );
};

TasksSection.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,
            date_created: PropTypes.string,
            created_by: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            assigned_to: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string,
            is_completed: PropTypes.bool.isRequired,
        })
    ).isRequired,
    users: PropTypes.arrayOf(
        PropTypes.shape({
            user_id: PropTypes.number.isRequired,
            username: PropTypes.string.isRequired,
            first_name: PropTypes.string.isRequired,
            last_name: PropTypes.string.isRequired,
        })
    ).isRequired,
    userId: PropTypes.number.isRequired,
    accountId: PropTypes.number.isRequired,
    setTasks: PropTypes.func.isRequired,
    refreshTasks: PropTypes.func.isRequired,
};

export default TasksSection;
