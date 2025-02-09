//  authService.js
import api from "./api";

// Fetch user session
export const fetchUserSession = async () => {
    try {
        const response = await api.get("/session", { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Error fetching user session:", error);
        return null;
    }
};

// Login User
export const loginUser = async (username, password) => {
    try {
        const response = await api.post("/login", { username, password }, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

// **Logout User**
export const logoutUser = async () => {
    try {
        await api.post("/logout");
        return true;
    } catch (error) {
        return false;
    }
};

// // Fetch user session
// export const fetchUserSession = async () => {
//     try {
//         const response = await fetch("http://127.0.0.1:5001/session", {
//             credentials: "include",  // ✅ Ensures cookies are sent
//             method: "GET"
//         });
//         if (!response.ok) return null;
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching user session:", error);
//         return null;
//     }
// };


// // Login User
// export const loginUser = async (username, password) => {
//     try {
//         const response = await fetch("http://127.0.0.1:5001/login", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             credentials: "include", // Ensure cookies are sent
//             body: JSON.stringify({ username, password }),
//         });

//         if (!response.ok) throw new Error("Login failed");
//         return await response.json(); // Returns user data
//     } catch (error) {
//         console.error("Error logging in:", error);
//         throw error;
//     }
// };