// tasksService.js
import api from "./api";

// Fetch Tasks
export const fetchTasks = async (userId) => {
    try {
        const response = await api.get(`/tasks?assigned_to=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};

// Create a Task
export const createTask = async (task) => {
    try {
        const response = await api.post("/tasks", task);
        return response.data;
    } catch (error) {
        console.error("Error creating task:", error);
        return null;
    }
};

// // Fetch Tasks
// export const fetchTasks = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/notes?assigned_to=${userId}`);
        
//         if (!response.ok) {
//             throw new Error("Failed to fetch tasks.");
//         }

//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching tasks:", error);
//         return []; // Return an empty array to prevent crashes
//     }
// };



// // Create Task
// export const createTask = async (task) => {
//     try {
//         const response = await fetch("http://127.0.0.1:5001/notes", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 user_id: task.user_id, // User who created the note
//                 note_text: task.text, // Task description
//                 assigned_to: task.assigned_to || task.user_id, // Default to self if not assigned
//                 completed: task.completed || false,
//                 note_type: "Task" // Helps differentiate from other notes
//             }),
//         });

//         if (!response.ok) throw new Error("Failed to create task.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error creating task:", error);
//         return null;
//     }
// };
