// tasksService.js
import api from "./api";


// CRUD Operations for Task Events

// ✅ Create a Task
export const createTask = async (task) => {
    try {
        const response = await api.post("tasks", task, {

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });
        console.log("✅ Task Created:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error creating task:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Fetch Tasks (Assigned to a User)
export const fetchTasks = async (userId) => {
    try {
        const response = await api.get(`/tasks?user_id=${userId}`, {
            params: { assigned_to: userId },
        });
        console.log("✅ Fetched Tasks:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching tasks:", error.response?.data || error.message);
        return [];
    }
};


// ✅ Update a Task (Mark Complete / Edit)
export const updateTask = async (taskId, updatedData) => {
    try {
        const response = await api.put(`/tasks/${taskId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("❌ Error updating task:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Delete a Task
export const deleteTask = async (taskId) => {
    try {
        await api.delete(`/tasks/${taskId}`);
        return true;
    } catch (error) {
        console.error("❌ Error deleting task:", error.response?.data || error.message);
        return false;
    }
};

// FILTER FOR DESIRED USER CALLS

// ✅ Fetch All Branches
export const fetchBranches = async () => {
    try {
        const response = await api.get("/branches");
        console.log("✅ Fetched Branches:", response.data);
        return response.data.map(branch => ({
            branch_id: branch.branch_id,
            branch_name: branch.branch_name
        }));
    } catch (error) {
        console.error("❌ Error fetching branches:", error.response?.data || error.message);
        return [];
    }
};

// export const fetchBranches = async () => {
//     try {
//         const response = await api.get("/branches");
//         console.log("✅ Fetched Branches:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("❌ Error fetching branches:", error.response?.data || error.message);
//         return [];
//     }
// };

// ✅ Fetch All Departments 
export const fetchDepartments = async () => {
    try {
        const response = await api.get("/departments");
        console.log("✅ Fetched Departments:", response.data);
        return response.data.map(dept => ({
            department_id: dept.department_id,
            department_name: dept.department_name
        }));
    } catch (error) {
        console.error("❌ Error fetching departments:", error.response?.data || error.message);
        return [];
    }
};
// ✅ Fetch All Departments (No Filtering by Branch-Completed on Frontend)
// export const fetchDepartments = async () => {
//     try {
//         const response = await api.get("/departments");
//         console.log("✅ Fetched Departments:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("❌ Error fetching departments:", error.response?.data || error.message);
//         return [];
//     }
// };


// ✅ Fetch Employees in a Specific Department and Include Department Name
export const fetchEmployees = async (departmentId) => {
    try {
        const response = await api.get("/employees", {
            params: departmentId ? { department_id: departmentId } : {},
        });
        console.log("✅ Fetched Employees:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching employees:", error.response?.data || error.message);
        return [];
    }
};
// ✅ Fetch Users in a Specific Branch and Department and Include Department Name
export const fetchUsers = async (branchId = null, departmentId = null) => {
    try {
        const params = {};
        if (branchId) params.branch_id = branchId;
        if (departmentId) params.department_id = departmentId;

        const response = await api.get("/users", { params });
        console.log("✅ Fetched Users:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching users:", error.response?.data || error.message);
        return [];
    }
};



// Fetch all departments
// export const fetchDepartments = async () => {
//     try {
//         const response = await api.get("/departments.department_name");
//         return response.data;
//     }
//     catch (error) {
//         console.error("Error fetching departments:", error);
//         return [];
//     }
// }

// Fetch all roles
export const fetchRoles = async () => {
    try {
        const response = await api.get("/user_roles.role_name");
        return response.data;
    } catch (error) {
        console.error("Error fetching roles", error);
        return [];
    }
}

// ✅ Fetch All Branches
// export const fetchBranches = async () => {
//     try {
//         const response = await api.get("/branches");
//         console.log("✅ Fetched Branches:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("❌ Error fetching branches:", error.response?.data || error.message);
//         return [];
//     }
// };


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
