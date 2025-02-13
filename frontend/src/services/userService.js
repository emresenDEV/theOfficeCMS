// userService.js
import api from "./api";

// ✅ Fetch all users
export const fetchUsers = async () => {
    try {
        const response = await api.get("/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching user_roles:", error);
        return [];
    }
};

// ✅ Fetch all user roles
export const fetchUserRoles = async () => {
    try {
        const response = await api.get("/user_roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching user_roles:", error);
        return [];
    }
};

// ✅ Fetch user profile
export const fetchUserProfile = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};