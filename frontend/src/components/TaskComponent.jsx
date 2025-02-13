import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FiCheckSquare, FiSquare } from "react-icons/fi";

const TasksComponent = ({ tasks, toggleTaskCompletion }) => {
    const [visibleTasks, setVisibleTasks] = useState(tasks.slice(0, 4));

    useEffect(() => {
        setVisibleTasks(tasks.slice(0, 4));
    }, [tasks]);

    const handleTaskCompletion = (task) => {
        toggleTaskCompletion(task);

        // ✅ Remove task after 5 seconds if completed
        if (!task.is_completed) {
            setTimeout(() => {
                setVisibleTasks(prevTasks => prevTasks.filter(t => t.task_id !== task.task_id));
            }, 5000);
        }
    };

    return (
        <div className="bg-white shadow-lg p-4 rounded-lg">
            <h3 className="text-xl font-bold text-gray-700 mb-4">📋 My Tasks</h3>

            {visibleTasks.length > 0 ? (
                <ul className="space-y-3">
                    {visibleTasks.map(task => (
                        <li 
                            key={task.task_id} 
                            className={`flex items-center justify-between bg-gray-50 p-3 rounded-md shadow-sm transition-all duration-300 ${
                                task.is_completed ? "opacity-50" : "hover:bg-gray-100"
                            }`}
                        >
                            <span className={`text-lg text-left flex-1 ${task.is_completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                                {task.task_description}
                            </span>
                            <button 
                                className="flex items-center p-2 rounded-md transition-all duration-200 
                                    hover:shadow-md hover:bg-gray-100"
                                onClick={() => handleTaskCompletion(task)}
                            >
                                {task.is_completed ? (
                                    <FiCheckSquare className="text-green-600 text-xl" title="Undo" />
                                ) : (
                                    <FiSquare className="text-gray-600 text-xl" title="Mark Complete" />
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-sm italic text-center">No tasks available.</p>
            )}
        </div>
    );
};

// ✅ PropTypes Validation
TasksComponent.propTypes = {
    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,  
            assigned_to: PropTypes.number.isRequired,  
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string.isRequired, 
            is_completed: PropTypes.bool.isRequired, 
            account_id: PropTypes.number, 
        })
    ).isRequired,
    toggleTaskCompletion: PropTypes.func.isRequired, 
};

export default TasksComponent;
