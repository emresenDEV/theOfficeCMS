// commissionsService.js
import api from "./api";

// ✅ Fetch User's Commissions
export const fetchCommissions = async (userId) => {
    try {
        const response = await api.get(`/commissions/user?user_id=${userId}`);
        return response.data.map(com => ({
            commission_id: com.commission_id,
            invoice_id: com.invoice_id,
            commission_amount: parseFloat(com.commission_amount),
            date_paid: com.date_paid
        }));
    } catch (error) {
        console.error("Error fetching commissions:", error);
        return [];
    }
};




// Fetch all commissions
// export const fetchCommissions = async (userId, filter = "month", date = "") => {
//     try {
//         const url = new URL("http://127.0.0.1:5001/commissions");
//         url.searchParams.append("user_id", userId);
//         url.searchParams.append("filter", filter);
//         if (date) url.searchParams.append("date", date);

//         const response = await fetch(url);
//         if (!response.ok) throw new Error("Failed to fetch commissions.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching commissions:", error);
//         return [];
//     }
// };

// export const fetchCommissions = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/commissions?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch commissions.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching commissions:", error);
//         return [];
//     }
// };
