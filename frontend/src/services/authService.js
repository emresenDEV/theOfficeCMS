//  authService.js
import api from "./api";


// Fetch full session user profile
export const fetchUserSession = async () => {
    try {
        const response = await api.get("/auth/session", { withCredentials: true });
        console.log("✅ Session Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching user session:", error.response?.data || error.message);
        return null;
    }
};


//  Login User with proper session management
export const loginUser = async (username, password) => {
    try {
        const response = await api.post("/auth/login", { username, password });
        console.log("✅ Login Successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error logging in:", error.response?.data || error.message);
        throw error;
    }
};

// Logout User
export const logoutUser = async () => {
    try {
        await api.post("/auth/logout");
        console.log("✅ Logged out successfully");
        return true;
    } catch (error) {
        console.error("❌ Error logging out:", error.response?.data || error.message);
        return false;
    }
};
