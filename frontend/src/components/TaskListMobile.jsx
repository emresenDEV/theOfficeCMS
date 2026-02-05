import { useState } from "react";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";

const TaskListMobile = ({
    tasks = [],
    completedTasks = [],
    onTaskComplete,
    onTaskUndo,
    onEditTask,
    onDeleteTask,
    onAccountClick,
    user,
    highlightTaskId,
}) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const [completingTask, setCompletingTask] = useState({});
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
        if (!dueDate) return "text-muted-foreground";
        const today = new Date();
        const taskDate = new Date(dueDate);
        const daysUntil = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return "text-red-600"; // Overdue
        if (daysUntil === 0) return "text-orange-600"; // Today
        if (daysUntil <= 3) return "text-yellow-600"; // Soon
        return "text-muted-foreground"; // Normal
    };

    return (
        <div className="bg-card border border-border rounded-lg shadow-md p-4 w-full">
            {/* Active Tasks Section */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.task_id}
                                id={`task-row-${task.task_id}`}
                                className={`border border-border rounded-lg p-4 transition ${
                                    highlightTaskId === String(task.task_id)
                                        ? "bg-accent/40"
                                        : "bg-card hover:bg-muted/60"
                                }`}
                            >
                                {/* Task Name and Status Row */}
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-foreground break-words">
                                            {task.task_description}
                                        </h3>
                                    </div>
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded whitespace-nowrap">
                                        Active
                                    </span>
                                </div>

                                {/* Due Date Row */}
                                <div className={`text-xs mb-3 font-medium ${getPriorityColor(task.due_date)}`}>
                                    <>Due: {formatDateInTimeZone(task.due_date, user, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}</>
                                </div>

                                {/* Account and Assigned By Row */}
                                <div className="flex justify-between items-center text-xs text-muted-foreground mb-3 gap-2">
                                    <div className="flex-1">
                                        <span className="font-medium">Account:</span>{" "}
                                        {task.business_name !== "No Account" ? (
                                            <button
                                                onClick={() => onAccountClick(task.account_id)}
                                                className="text-primary hover:underline"
                                            >
                                                {task.business_name}
                                            </button>
                                        ) : (
                                            <span className="text-muted-foreground">No Account</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground mb-3">
                                    <span className="font-medium">By:</span> {task.assigned_by_username}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onEditTask(task)}
                                        disabled={task.assigned_by_username !== user.username}
                                        className={`text-xs px-3 py-1 rounded flex-1 ${
                                            task.assigned_by_username === user.username
                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                        }`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleTaskCompletion(task)}
                                        className={`text-xs px-3 py-1 rounded flex-1 ${
                                            completingTask[task.task_id]
                                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        }`}
                                    >
                                        {completingTask[task.task_id]
                                            ? `Undo (${completingTask[task.task_id].timeLeft}s)`
                                            : "Complete"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No active tasks</p>
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
                                    id={`task-row-${task.task_id}`}
                                    className={`border border-border rounded-lg p-4 opacity-75 ${
                                        highlightTaskId === String(task.task_id)
                                            ? "bg-accent/30"
                                            : "bg-background"
                                    }`}
                                >
                                    {/* Task Name */}
                                    <h3 className="text-sm font-semibold text-muted-foreground line-through break-words mb-2">
                                        {task.task_description}
                                    </h3>

                                    {/* Due Date */}
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {formatDateInTimeZone(task.due_date, user, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>

                                    {/* Account Info */}
                                    <div className="text-xs text-muted-foreground mb-3">
                                        <span className="font-medium">Account:</span>{" "}
                                        {task.business_name !== "No Account" ? (
                                            <button
                                                onClick={() => onAccountClick(task.account_id)}
                                                className="text-primary hover:underline"
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
                                            className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1"
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
                                            className="text-xs px-3 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1"
                                        >
                                            {confirmDelete === task.task_id ? "Sure?" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No completed tasks</p>
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
    highlightTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TaskListMobile;
