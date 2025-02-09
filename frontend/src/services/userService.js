// userService.js
import api from "./api";

// Fetch all user_roles
export const fetchUserRoles = async () => {
    try {
        const response = await api.get("/user_roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching user_roles:", error);
        return [];
    }
}

// Fetch all users
export const fetchUsers = async () => {
    try {
        const response = await api.get("/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

// Fetch all departments
export const fetchDepartments = async () => {
    try {
        const response = await api.get("/departments");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}

// Fetch all roles
export const fetchRoles = async () => {
    try {
        const response = await api.get("/roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching roles", error);
        return [];
    }
}