import { useEffect, useState } from "react";
import { fetchTasks, createTask } from "../services/api";
import PropTypes from "prop-types";

const TasksPage = ({ user }) => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        if (user) {
            fetchTasks(user.id).then(setTasks);
        }
    }, [user]);

    const handleCreateTask = () => {
        if (newTask.trim()) {
            createTask({ user_id: user.id, text: newTask }).then(task => {
                setTasks([...tasks, task]);
                setNewTask("");
            });
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Tasks</h1>
            <ul className="mt-4">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <li key={task.id} className="bg-gray-100 p-2 rounded-md mb-2">
                            {task.text}
                        </li>
                    ))
                ) : (
                    <p>No tasks found.</p>
                )}
            </ul>
            <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter task description"
                className="border p-2 w-full mt-4"
            />
            <button onClick={handleCreateTask} className="mt-2 bg-blue-500 text-white p-2 rounded">
                Create Task
            </button>
        </div>
    );
};

TasksPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired
};

export default TasksPage;
