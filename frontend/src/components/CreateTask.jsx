// components/CreateTask.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const CreateTask = ({ onSave }) => {
    const [taskDescription, setTaskDescription] = useState("");
    const navigate = useNavigate();

    const handleSave = () => {
        if (!taskDescription.trim()) {
            alert("Task description cannot be empty!");
            return;
        }
        onSave(taskDescription);
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold">Create New Task</h2>
            <textarea 
                className="border p-2 w-full rounded mt-2"
                rows="4"
                placeholder="Describe the task..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
            ></textarea>
            <button 
                onClick={handleSave} 
                className="bg-green-500 text-white px-4 py-2 rounded mt-3"
            >
                Save Task
            </button>
        </div>
    );
};

// ✅ PropTypes Validation
CreateTask.propTypes = {
    onSave: PropTypes.func.isRequired, // Callback function to handle saving the task
};

export default CreateTask;
