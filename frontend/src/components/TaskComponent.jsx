import PropTypes from "prop-types";

const TasksComponent = ({ tasks, toggleTaskCompletion }) => {
    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <h3 className="text-lg font-bold text-dark-cornflower mb-3">My Tasks</h3>
            <ul className="space-y-2">
                {tasks.length > 0 ? (
                    tasks.slice(0, 4).map(task => (
                        <li key={task.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                            <span className={task.completed ? "line-through text-gray-500" : "text-black"}>
                                {task.text}
                            </span>
                            <input 
                                type="checkbox" 
                                checked={task.completed} 
                                onChange={() => toggleTaskCompletion(task.id)} 
                                className="cursor-pointer"
                            />
                        </li>
                    ))
                ) : (
                    <p className="text-gray-600">No tasks available.</p>
                )}
            </ul>
        </div>
    );
};

TasksComponent.propTypes = {
    tasks: PropTypes.array.isRequired,
    toggleTaskCompletion: PropTypes.func.isRequired
};

export default TasksComponent;
