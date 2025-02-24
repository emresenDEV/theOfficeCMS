import { useState } from "react";
import PropTypes from "prop-types";
// import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { createTask, updateTask, fetchTasksByAccount } from "../services/tasksService";

const TasksSection = ({ tasks, users, userId, accountId, setTasks, refreshTasks }) => {
const [searchTasks, setSearchTasks] = useState("");
const [taskFilter, setTaskFilter] = useState("all");
const [newTaskDescription, setNewTaskDescription] = useState("");
const [assignedTo, setAssignedTo] = useState(null);
const [assignedToSearch, setAssignedToSearch] = useState(""); // For user search input
const [filteredUsers, setFilteredUsers] = useState([]); // Filtered list based on input

const [dueDate, setDueDate] = useState("");
// const navigate = useNavigate();


// ✅ Helper: Get Username from `created_by`
const getCreatedByUsername = (creator) => {
    if (typeof creator == "string") return creator;
    if (!users || users.length === 0) return "Unknown Creator";
    const user = users.find((u) => Number(u.user_id) === Number(creator));
    return user ? user.username : "Unknown Creator";
};

// ✅ Helper: Get Username from `assigned_to`
const getAssignedToUsername = (assignedToId) => {
    if (!users || users.length === 0 || !assignedToId) return "Unassigned";
    const user = users.find((u) => Number(u.user_id) === Number(assignedToId));
    return user ? user.username : "Unassigned";
};

// ✅ Filter Tasks
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
// ✅ Format Date (MM/DD/YYYY)
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MM/dd/yyyy");
};

// ✅ Create a New Task
const handleCreateTask = async () => {
    if (!newTaskDescription.trim()) return alert("❌ Task description cannot be empty.");

    const taskData = {
        account_id: accountId,
        user_id: userId,
        assigned_to: assignedTo || null,
        task_description: newTaskDescription.trim(),
        due_date: dueDate || null,
    };

    try {
    const response = await createTask(taskData);
    if (response && response.success) {
        // await refreshTasks(); //option 1
        setNewTaskDescription(""); //option 2 (this and next 3 lines)
        setAssignedTo(null);
        setAssignedToSearch("");
        setDueDate("");
    }
    } catch (error) {
    console.error("❌ Error creating task:", error);
    alert("Failed to create task. Please try again.");
    }
};

// ✅ Handle searching through users
const handleAssigneeSearch = (input) => {
    setAssignedToSearch(input);
    console.log("Searching for:", input, "Users prop:", users); //debugging

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
            usernameLower.toLowerCase().includes(searchTerm) ||
            firstNameLower.toLowerCase().includes(searchTerm) ||
            lastNameLower.toLowerCase().includes(searchTerm)
            );
    });
    console.log("Found results:", results); // Debugging log
    setFilteredUsers(results);
    
};

// ✅ Handle Assignee Select
const handleAssigneeSelect = (user) => {
    setAssignedTo(user.user_id); // ✅ Save selected user's ID for backend
    setAssignedToSearch(`${user.first_name} ${user.last_name} (${user.username})`);
    setFilteredUsers([]); // Clear the dropdown
    };
    


// ✅ Toggle Task Completion Status
const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
    await updateTask(taskId, { is_completed: !currentStatus });
    await refreshTasks();
    } catch (error) {
    console.error("❌ Error updating task status:", error);
    }
};


return (
    <div className="mt-6 border p-4 rounded-lg">
    <h2 className="text-xl font-semibold">Tasks</h2>

    {/* ✅ Task Filter/Search */}
    <div className="flex justify-between items-center mb-3">
        <input
        type="text"
        placeholder="Search tasks..."
        className="border p-2 rounded w-1/3 flex-grow"
        value={searchTasks}
        onChange={(e) => setSearchTasks(e.target.value)}
        />
        <div>
        <button onClick={() => setTaskFilter("completed")} className="bg-green-500 text-white px-3 py-2 mx-1 rounded shadow-lg">
            Completed
        </button>
        <button onClick={() => setTaskFilter("incomplete")} className="bg-red-500 text-white px-3 py-2 mx-1 rounded shadow-lg">
            Incomplete
        </button>
        </div>
    </div>

    {/* ✅ Create New Task Section */}
    <div className="flex items-center mb-4 space-x-2">
        <input
        type="text"
        placeholder="New task..."
        className="border p-2 rounded flex-grow"
        value={newTaskDescription}
        onChange={(e) => setNewTaskDescription(e.target.value)}
        />
        {/* Wrap assigned-to input in a relative container */}
        <div className="relative w-full">
        <input
        type="text"
        placeholder="Assigned To (search by name/username)"
        className="border p-2 rounded w-full"
        value={assignedToSearch}
        onChange={(e) => handleAssigneeSearch(e.target.value)}
        />
        {filteredUsers.length > 0 && (
            <div className="absolute bg-white border w-full mt-1 rounded-lg shadow-lg z-50 max-h-40 overflow-y-scroll">
                {filteredUsers.map((user) => (
                <div
                    key={user.user_id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
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
            className="border p-2 rounded w-1/4"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
        />
        <button
            onClick={handleCreateTask}
            className="bg-blue-600 text-white px-3 py-2 rounded shadow-lg hover:bg-blue-600 transition-colors"
        >
            Create Task
        </button>
    </div>

    {/* ✅ Tasks Table */}
    <div className="overflow-y-scroll h-48 border">
        {filteredTasks.length > 0 ? (
        <table className="w-full table-auto border-collapse border">
            <thead>
            <tr>
                <th className="border p-2">Date</th>
                <th className="border p-2">Created By</th>
                <th className="border p-2">Assigned To</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Due Date</th>
                <th className="border p-2">Status</th>
            </tr>
            </thead>
            <tbody>
            {filteredTasks.map((task) => (
                <tr key={task.task_id} className="text-center">
                <td className="border p-2">{formatDate(task.date_created)}</td>
                <td className="border p-2">{getCreatedByUsername(task.created_by || task.user_id)}</td>
                <td className="border p-2">{getAssignedToUsername(task.assigned_to)}</td>
                <td className="border p-2">{task.task_description}</td>
                <td className="border p-2">{formatDate(task.due_date)}</td>
                <td
                    className="border p-2 cursor-pointer"
                    onClick={() => toggleTaskStatus(task.task_id, task.is_completed)}
                >
                    {task.is_completed ? "✅ Completed" : "❌ Incomplete"}
                    <span className="block text-xs text-gray-400">Click to update</span>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        ) : (
        <p className="text-gray-500 text-center mt-2">
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
