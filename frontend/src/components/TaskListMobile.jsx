import { useState } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";

const TaskListMobile = ({
    tasks = [],
    completedTasks = [],
    onTaskComplete,
    onTaskUndo,
    onEditTask,
    onDeleteTask,
    onAccountClick,
    user
}) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const [completingTask, setCompletingTask] = useState({});
    const [editingTask, setEditingTask] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleTaskCompletion = (task) => {
        if (completingTask[task.task_id]) {
            clearTimeout(completingTask[task.task_id].timeoutId);
            clearInterval(completingTask[task.task_id].intervalId);
            setCompletingTask((prev) => ({ ...prev, [task.task_id]: undefined }));
            return;
        }

        if (!task.is_completed) {
            setCompletingTask((prev) => ({
                ...prev,
                [task.task_id]: { timeLeft: 5, timeoutId: null, intervalId: null }
            }));

            let timeLeft = 5;

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

            const timeoutId = setTimeout(() => {
                onTaskComplete(task);
                setCompletingTask((prev) => ({ ...prev, [task.task_id]: undefined }));
            }, 5000);

            setCompletingTask((prev) => ({
                ...prev,
                [task.task_id]: { timeLeft: 5, timeoutId, intervalId }
            }));

            return;
        }

        onTaskUndo(task);
    };

    const getPriorityColor = (dueDate) => {
        if (!dueDate) return "text-gray-600";
        const today = new Date();
        const taskDate = new Date(dueDate);
        const daysUntil = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return "text-red-600"; // Overdue
        if (daysUntil === 0) return "text-orange-600"; // Today
        if (daysUntil <= 3) return "text-yellow-600"; // Soon
        return "text-gray-600"; // Normal
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full">
            {/* Active Tasks Section */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.task_id}
                                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition"
                            >
                                {/* Task Name and Status Row */}
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="flex-1">
                                        {editingTask?.task_id === task.task_id ? (
                                            <input
                                                type="text"
                                                value={editingTask.task_description}
                                                onChange={(e) => {
                                                    setEditingTask((prev) => ({
                                                        ...prev,
                                                        task_description: e.target.value,
                                                    }));
                                                }}
                                                className="w-full border px-2 py-1 rounded text-sm font-semibold"
                                            />
                                        ) : (
                                            <h3 className="text-sm font-semibold text-gray-900 break-words">
                                                {task.task_description}
                                            </h3>
                                        )}
                                    </div>
                                    {editingTask?.task_id !== task.task_id && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {/* Due Date Row */}
                                <div className={`text-xs mb-3 font-medium ${getPriorityColor(task.due_date)}`}>
                                    {editingTask?.task_id === task.task_id ? (
                                        <input
                                            type="date"
                                            value={
                                                editingTask?.due_date
                                                    ? new Date(editingTask.due_date)
                                                        .toISOString()
                                                        .split("T")[0]
                                                    : new Date(task.due_date)
                                                        .toISOString()
                                                        .split("T")[0]
                                            }
                                            onChange={(e) => {
                                                setEditingTask((prev) => ({
                                                    ...prev,
                                                    due_date: new Date(e.target.value)
                                                        .toISOString()
                                                        .replace("T", " ")
                                                        .split(".")[0],
                                                }));
                                            }}
                                            className="w-full border px-2 py-1 rounded text-xs"
                                        />
                                    ) : (
                                        <>Due: {format(new Date(task.due_date), "MMM d, yyyy")}</>
                                    )}
                                </div>

                                {/* Account and Assigned By Row */}
                                <div className="flex justify-between items-center text-xs text-gray-600 mb-3 gap-2">
                                    <div className="flex-1">
                                        <span className="font-medium">Account:</span>{" "}
                                        {task.business_name !== "No Account" ? (
                                            <button
                                                onClick={() => onAccountClick(task.account_id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {task.business_name}
                                            </button>
                                        ) : (
                                            <span className="text-gray-500">No Account</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-gray-600 mb-3">
                                    <span className="font-medium">By:</span> {task.assigned_by_username}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {editingTask?.task_id === task.task_id ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onEditTask(task);
                                                    setEditingTask(null);
                                                }}
                                                className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 flex-1"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingTask(null)}
                                                className="text-xs px-3 py-1 rounded bg-gray-400 text-white hover:bg-gray-500 flex-1"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (task.assigned_by_username === user.username) {
                                                        setEditingTask({
                                                            task_id: task.task_id,
                                                            task_description: task.task_description,
                                                            due_date: task.due_date
                                                                ? new Date(task.due_date)
                                                                    .toISOString()
                                                                    .split("T")[0]
                                                                : "",
                                                        });
                                                    }
                                                }}
                                                disabled={task.assigned_by_username !== user.username}
                                                className={`text-xs px-3 py-1 rounded flex-1 ${
                                                    task.assigned_by_username === user.username
                                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                }`}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleTaskCompletion(task)}
                                                className={`text-xs px-3 py-1 rounded flex-1 text-white ${
                                                    completingTask[task.task_id]
                                                        ? "bg-red-600 hover:bg-red-700"
                                                        : "bg-green-600 hover:bg-green-700"
                                                }`}
                                            >
                                                {completingTask[task.task_id]
                                                    ? `Undo (${completingTask[task.task_id].timeLeft}s)`
                                                    : "Complete"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center py-4">No active tasks</p>
                )}
            </div>

            {/* Completed Tasks Section */}
            <div className="mt-6 pt-6 border-t">
                <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full flex justify-between items-center text-lg font-semibold mb-3"
                >
                    <span>Completed Tasks</span>
                    <span className="text-lg">
                        {showCompleted ? "−" : "+"}
                    </span>
                </button>

                {showCompleted && (
                    <div className="space-y-3">
                        {completedTasks.length > 0 ? (
                            completedTasks.map((task) => (
                                <div
                                    key={task.task_id}
                                    className="border rounded-lg p-4 bg-gray-50 opacity-75"
                                >
                                    {/* Task Name */}
                                    <h3 className="text-sm font-semibold text-gray-600 line-through break-words mb-2">
                                        {task.task_description}
                                    </h3>

                                    {/* Due Date */}
                                    <div className="text-xs text-gray-500 mb-2">
                                        {format(new Date(task.due_date), "MMM d, yyyy")}
                                    </div>

                                    {/* Account Info */}
                                    <div className="text-xs text-gray-600 mb-3">
                                        <span className="font-medium">Account:</span>{" "}
                                        {task.business_name !== "No Account" ? (
                                            <button
                                                onClick={() => onAccountClick(task.account_id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {task.business_name}
                                            </button>
                                        ) : (
                                            <span>No Account</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onTaskUndo(task)}
                                            className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 flex-1"
                                        >
                                            Undo
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirmDelete === task.task_id) {
                                                    onDeleteTask(task.task_id);
                                                    setConfirmDelete(null);
                                                } else {
                                                    setConfirmDelete(task.task_id);
                                                }
                                            }}
                                            className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex-1"
                                        >
                                            {confirmDelete === task.task_id ? "Sure?" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 text-center py-4">No completed tasks</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

TaskListMobile.propTypes = {
    tasks: PropTypes.array,
    completedTasks: PropTypes.array,
    onTaskComplete: PropTypes.func.isRequired,
    onTaskUndo: PropTypes.func.isRequired,
    onEditTask: PropTypes.func.isRequired,
    onDeleteTask: PropTypes.func.isRequired,
    onAccountClick: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
};

export default TaskListMobile;
