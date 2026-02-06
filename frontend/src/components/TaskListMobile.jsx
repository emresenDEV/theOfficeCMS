import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiEdit2 } from "react-icons/fi";
import { formatDateInTimeZone } from "../utils/timezone";

const TaskListMobile = ({
    tasks = [],
    completedTasks = [],
    onTaskComplete,
    onTaskUndo,
    onEditTask,
    onDeleteTask,
    onAssociationClick,
    onTaskClick,
    user,
    highlightTaskId,
    showActive = true,
    showCompletedByDefault = false,
}) => {
    const [showCompleted, setShowCompleted] = useState(showCompletedByDefault);
    const [completingTask, setCompletingTask] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        setShowCompleted(showCompletedByDefault);
    }, [showCompletedByDefault]);

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
            {showActive && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Active Tasks</h2>
                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.task_id}
                                    id={`task-row-${task.task_id}`}
                                    className={`border border-border rounded-lg p-4 transition cursor-pointer ${
                                        highlightTaskId === String(task.task_id)
                                            ? "bg-accent/40"
                                            : "bg-card hover:bg-muted/60"
                                    }`}
                                    onClick={() => onTaskClick(task.task_id)}
                                >
                                {/* Task Name and Status Row */}
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="flex-1">
                                        <button
                                            className="text-left text-sm font-semibold text-primary hover:underline break-words"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick(task.task_id);
                                            }}
                                        >
                                            {task.task_description}
                                        </button>
                                    </div>
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded whitespace-nowrap">
                                        Active
                                    </span>
                                </div>

                                {/* Due Date Row */}
                                <div className={`text-xs mb-2 font-medium ${getPriorityColor(task.due_date)}`}>
                                    <>Due: {formatDateInTimeZone(task.due_date, user, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}</>
                                </div>
                                <div className="text-xs text-muted-foreground mb-3">
                                    Created: {task.date_created ? formatDateInTimeZone(task.date_created, user, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    }) : "—"}
                                </div>

                                {/* Association Row */}
                                <div className="flex justify-between items-center text-xs text-muted-foreground mb-3 gap-2">
                                    <div className="flex-1">
                                        <span className="font-medium">Associated With:</span>{" "}
                                        {task.associations && task.associations.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {task.associations.map((association) => (
                                                    <button
                                                        key={`${association.type}-${association.id}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAssociationClick?.(association);
                                                        }}
                                                        className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                                                    >
                                                        {association.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground mb-3">
                                    <span className="font-medium">By:</span> {task.assigned_by_username}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditTask(task);
                                        }}
                                        disabled={(user?.user_id ?? user?.id) !== task.user_id}
                                        className={`flex items-center justify-center text-xs px-3 py-1 rounded flex-1 ${
                                            (user?.user_id ?? user?.id) === task.user_id
                                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                        }`}
                                        aria-label="Edit task"
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTaskCompletion(task);
                                        }}
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
            )}

            {/* Completed Tasks Section */}
            <div className={`mt-6 pt-6 border-t ${showActive ? "" : "mt-0 pt-0 border-t-0"}`}>
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
                                    className={`border border-border rounded-lg p-4 opacity-75 cursor-pointer ${
                                        highlightTaskId === String(task.task_id)
                                            ? "bg-accent/30"
                                            : "bg-background"
                                    }`}
                                    onClick={() => onTaskClick(task.task_id)}
                                >
                                    {/* Task Name */}
                                    <h3 className="text-sm font-semibold text-muted-foreground line-through break-words mb-2">
                                        <button
                                            className="text-left text-sm font-semibold text-primary hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick(task.task_id);
                                            }}
                                        >
                                            {task.task_description}
                                        </button>
                                    </h3>
                                    <div className="text-xs text-muted-foreground mb-2">
                                        Created: {task.date_created ? formatDateInTimeZone(task.date_created, user, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        }) : "—"}
                                    </div>

                                    {/* Due Date */}
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {formatDateInTimeZone(task.due_date, user, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>

                                    {/* Associations */}
                                    <div className="text-xs text-muted-foreground mb-3">
                                        <span className="font-medium">Associated With:</span>{" "}
                                        {task.associations && task.associations.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {task.associations.map((association) => (
                                                    <button
                                                        key={`${association.type}-${association.id}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAssociationClick?.(association);
                                                        }}
                                                        className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                                                    >
                                                        {association.label}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskUndo(task);
                                            }}
                                            className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1"
                                        >
                                            Undo
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
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
    onAssociationClick: PropTypes.func,
    onTaskClick: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    highlightTaskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    showActive: PropTypes.bool,
    showCompletedByDefault: PropTypes.bool,
};

export default TaskListMobile;
