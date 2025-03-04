//  authService.js
import api from "./api";

// ✅ Fetch user session with proper credentials
export const fetchUserSession = async () => {
    try {
        const response = await api.get("/auth/session", { withCredentials: true });
        console.log("✅ Session Response:", response.data);

        if (!response.data || !response.data.user_id) {
            console.warn("⚠️ No user found in session.");
            return null;
        }
        return {
            id: response.data.user_id,
            username: response.data.username,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            role: response.data.role_name,
            branch_id: response.data.branch_id,
        };
    } catch (error) {
        console.error("❌ Error fetching user session:", error.response?.data || error.message);
        return null;
    }
};

// export const fetchUserSession = async () => {
//     try {
//         const response = await api.get("/auth/session", {
//             credentials: "include",  // ✅ Ensures cookies are included
//             headers: { "Cache-Control": "no-cache" }  // ✅ Prevents caching issues
//         });

//         console.log("✅ Session Response:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("❌ Error fetching user session:", error.response?.data || error.message);
//         return null;
//     }
// };




// export const fetchUserSession = async () => {
//     try {
//         const response = await fetch("http://127.0.0.1:5001/auth/session", {
//             credentials: "include",  // ✅ Ensures cookies are sent
//             method: "GET"
//         });

//         if (!response.ok) {
//             console.error("❌ Session fetch failed:", response.status);
//             return null;
//         }

//         const data = await response.json();
//         console.log("✅ Session Response:", data);
//         return data; // ✅ Returns full user data object
//     } catch (error) {
//         console.error("❌ Error fetching user session:", error);
//         return null;
//     }
// };

// ✅ Login User with proper session management
export const loginUser = async (username, password) => {
    try {
        const response = await fetch("http://127.0.0.1:5001/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",  // ✅ Ensures session cookies are stored
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) throw new Error("❌ Login failed");

        const data = await response.json();
        console.log("✅ Login Successful:", data);
        return data;
    } catch (error) {
        console.error("❌ Error logging in:", error);
        throw error;
    }
};


// ✅ Logout User
export const logoutUser = async () => {
    try {
        const response = await fetch("http://127.0.0.1:5001/auth/logout", {
            method: "POST",
            credentials: "include",  // ✅ Ensures session is properly destroyed
        });

        if (!response.ok) throw new Error("❌ Logout failed");

        console.log("✅ Logged out successfully");
        return true;
    } catch (error) {
        console.error("❌ Error logging out:", error);
        return false;
    }
};
