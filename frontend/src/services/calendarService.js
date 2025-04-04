// calendarService.js
import api from "./api";


// CRUD Operations for Calendar Events

// Create a New Calendar Event
export const createCalendarEvent = async (eventData) => {
    try {
        const response = await api.post("/calendar/events", eventData);
        return response.data;
    } catch (error) {
        console.error("Error creating event:", error);
        return null;
    }
};

// Get Calendar Events for a Specific User
export const fetchCalendarEvents = async (userId) => {
    try {
        const response = await api.get(`/calendar/events?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching calendar events:", error);
        return [];
    }
};


// Fetch Calendar Events (Meetings) for a User
// export const fetchMeetings = async (userId) => {
//     try {
//         const response = await api.get(`/calendar/events?user_id=${userId}`);
//         console.log("✅ Meetings Response:", response.data);  // 🔹 Debugging log
//         return response.data;
//     } catch (error) {
//         console.error("❌ Error fetching meetings:", error.response?.data || error.message);
//         return [];
//     }
// };

// Update an Existing Calendar Event
export const updateCalendarEvent = async (eventId, updatedData) => {
    try {
        const response = await api.put(`/calendar/events/${eventId}`, updatedData, {
            headers: {
                "Content-Type": "application/json"
            },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error updating event:", error.response?.data || error.message);
        return null;
    }
};


// Delete a Calendar Event
export const deleteCalendarEvent = async (eventId) => {
    try {
        await api.delete(`/calendar/events/${eventId}`); 
        return { success: true };
    } catch (error) {
        console.error("Error deleting event:", error.response?.data || error.message);
        return { success: false };
    }
};


// FILTER FOR DESIRED USER CALLS

// Fetch all departments
export const fetchDepartments = async () => {
    try {
        const response = await api.get("/departments");  I
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

// Fetch all roles
export const fetchRoles = async () => {
    try {
        const response = await api.get("/user_roles");
        console.log("✅ Fetched User Roles:", response.data);
        return response.data.map(role => ({
            role_id: role.role_id,
            role_name: role.role_name
        }));
    } catch (error) {
        console.error("Error fetching roles", error);
        return [];
    }
}

// Fetch Employees in a Specific Department and Include Department Name
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

// Fetch Users in a Specific Branch and Department and Include Department Name
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
