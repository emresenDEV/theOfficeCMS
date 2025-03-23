// userService.js
import api from "./api";

// ✅ Fetch all users
export const fetchUsers = async () => {
    try {
        const response = await api.get("/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
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
        console.log("✅ User Profile Fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching user profile:", error);
        return null;
    }
};

// Fetch Sales Representatives
export const fetchSalesReps = async () => {
    try {
        const response = await api.get("/users", {
            params: { role_id: 3 },
        });
        console.log("✅ Fetched Sales Representatives:", response.data);
        return response.data.map(user => ({
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            extension: user.extension,
            branch_id: user.branch_id, // If needed to match with branches
        }));
    } catch (error) {
        console.error("❌ Error fetching sales representatives:", error.response?.data || error.message);
        return [];
    }
};
