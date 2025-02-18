// commissionsService.js
import api from "./api";

// ✅ Fetch User's Commissions
// export const fetchCommissions = async (userId) => {
//     try {
//         console.log(`🔍 Fetching commissions for user ${userId}...`);
        
//         const response = await api.get(`/commissions?user_id=${userId}`);
        
//         if (!response.data || !Array.isArray(response.data)) {
//             console.warn("⚠️ API returned no valid data:", response.data);
//             return [];
//         }

//         // 🚀 Ensure `date_paid` is properly converted to a Date object
//         const formattedData = response.data.map(com => ({
//             ...com,
//             date_paid: com.date_paid ? new Date(com.date_paid + "T00:00:00Z") : null,  // Convert string to Date object
//         }));

//         console.log("✅ Commissions Data Loaded:", formattedData);
//         return formattedData;
//     } catch (error) {
//         console.error("❌ Error fetching commissions:", error);
//         return [];
//     }
// };

// export const fetchCurrentMonthCommissions = (userId) =>
//     api.get(`/commissions/current_month?user_id=${userId}`).then(res => res.data);

// export const fetchCurrentYearCommissions = (userId) =>
//     api.get(`/commissions/current_year?user_id=${userId}`).then(res => res.data);

// export const fetchLastYearCommissions = (userId) =>
//     api.get(`/commissions/last_year?user_id=${userId}`).then(res => res.data);

// export const fetchProjectedCommissions = (userId) =>
//     api.get(`/commissions/projected?user_id=${userId}`).then(res => res.data);

export const fetchCurrentMonthCommissions = async (userId) => {
    console.log(`🔍 Fetching Current Month Commissions for user ${userId}...`);
    try {
        const response = await api.get(`/commissions/current_month?user_id=${userId}`);
        console.log("✅ Current Month Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching current month commissions:", error);
        return { total_commissions: 0 };
    }
};

export const fetchAllYearsCommissions = async (userId) => {
    console.log(`🔍 Fetching All Years for user ${userId}...`);
    try {
        const response = await api.get(`/commissions/all_years?user_id=${userId}`);
        console.log("✅ Available Years:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching all years:", error);
        return [];
    }
};


export const fetchCurrentYearCommissions = async (userId) => {
    console.log(`🔍 Fetching Current Year Commissions for user ${userId}...`);
    const response = await api.get(`/commissions/current_year?user_id=${userId}`);
    console.log("✅ Current Year Commissions:", response.data);
    return response.data;
};

export const fetchLastYearCommissions = async (userId) => {
    console.log(`🔍 Fetching Last Year Commissions for user ${userId}...`);
    const response = await api.get(`/commissions/last_year?user_id=${userId}`);
    console.log("✅ Last Year Commissions:", response.data);
    return response.data;
};

export const fetchProjectedCommissions = async (userId) => {
    console.log(`🔍 Fetching Projected Commissions for user ${userId}...`);
    const response = await api.get(`/commissions/projected?user_id=${userId}`);
    console.log("✅ Projected Commissions:", response.data);
    return response.data;
};


export async function fetchMonthlyCommissions(userId, year) {
    const url = `http://localhost:5001/commissions/monthly/${year}?user_id=${userId}`;

    console.log(`🔍 Fetching Monthly Commissions from: ${url}`); // ✅ Debugging log

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const textResponse = await response.text(); // ✅ Read raw response (debugging)
        console.log("📥 Raw Response:", textResponse); // ✅ Log what API is sending

        const data = JSON.parse(textResponse);
        console.log("📥 Parsed JSON Response:", data);
        
        return data;
    } catch (error) {
        console.error("❌ Error Fetching Monthly Commissions:", error);
        return [];
    }
}





export const fetchWeeklyCommissions = (userId, year, month) =>
    api.get(`/commissions/weekly/${year}/${month}?user_id=${userId}`).then(res => res.data);


