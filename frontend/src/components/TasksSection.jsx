// components/TasksSection.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const TasksSection = ({ tasks, users = [] }) => {
    const [searchTasks, setSearchTasks] = useState("");
    const [taskFilter, setTaskFilter] = useState("all");
    const navigate = useNavigate();

    // ✅ Helper to get the creator's username from `created_by` field
    const getCreatedByUsername = (createdById) => {
        if (!users || users.length === 0) return "Unknown Creator";
        const user = users.find((u) => u.user_id === createdById);
        return user ? user.username : "Unknown Creator";
    };
    
    // ✅ Helper to get the assignee's username from `assigned_to` field
    const getAssignedToUsername = (assignedToId) => {
        if (!users || users.length === 0) return "Unassigned";
        const user = users.find((u) => u.user_id === assignedToId);
        return user ? user.username : "Unassigned";
    };
    
    // ✅ Filter Tasks
    const filteredTasks = tasks.filter((task) => {
        const createdByUsername = getCreatedByUsername(task.created_by).toLowerCase();
        const assignedToUsername = getAssignedToUsername(task.assigned_to).toLowerCase();
    
        return (
            (searchTasks === "" ||
                createdByUsername.includes(searchTasks.toLowerCase()) ||
                assignedToUsername.includes(searchTasks.toLowerCase())) &&
            (taskFilter === "all" ||
                (taskFilter === "completed" && task.completed) ||
                (taskFilter === "incomplete" && !task.completed))
            );
        });
        

    // ✅ Helper to format date to MM/DD/YYYY hh:mm AM/PM
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MM/dd/yyyy hh:mm a");
    };

    // ✅ Helper to format date to MM-DD-YYYY
    const formatDueDate = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MM-dd-yyyy");
    };

    return (
        <div className="mt-6 border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    className="border p-2 rounded w-1/3"
                    value={searchTasks}
                    onChange={(e) => setSearchTasks(e.target.value)}
                />
                <div>
                    <button onClick={() => setTaskFilter("completed")} className="bg-green-500 text-white px-2 mx-1">Completed</button>
                    <button onClick={() => setTaskFilter("incomplete")} className="bg-red-500 text-white px-2 mx-1">Incomplete</button>
                    <button onClick={() => navigate("/create-task")} className="bg-blue-500 text-white px-4 ml-2">Create Task</button>
                </div>
            </div>
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
                        <td className="border p-2">
                            {formatDateTime(task.date_created)}
                        </td>
                        <td className="border p-2">{getCreatedByUsername(task.created_by)}</td>
                        <td className="border p-2">
                            {getAssignedToUsername(task.assigned_to)}
                        </td>
                        <td className="border p-2">{task.task_description}</td>
                        <td className="border p-2">{formatDueDate(task.due_date)}</td>
                        <td className="border p-2">
                            {task.completed
                            ? "✅ Completed"
                            : "❌ Incomplete"}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                ) : (
                <p className="text-gray-500 text-center mt-2">
                    No tasks available.
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
        date_created: PropTypes.string, // Date timestamp from the DB
        created_by: PropTypes.number,   // User ID (should map to username)
        assigned_to: PropTypes.number,  // User ID (should map to username)
        task_description: PropTypes.string.isRequired,
        due_date: PropTypes.string,     // Due date timestamp
        completed: PropTypes.bool.isRequired,
    })
    ).isRequired,

    // ✅ Pass users for mapping user_id to username
    users: PropTypes.arrayOf(
    PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
    })
    ).isRequired,
};


export default TasksSection;
