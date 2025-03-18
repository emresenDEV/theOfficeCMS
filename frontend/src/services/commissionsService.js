// commissionsService.js
import api from "./api";

// ✅ Fetch User's Commissions
export const fetchCommissions = async (salesRepId) => {
    try {
        console.log(`🔍 Fetching commissions for user ${salesRepId}...`);
        
        const response = await api.get(`/commissions`, {
            params: { sales_rep_id: salesRepId }, // ✅ Corrected parameter name
        });

        if (!response.data || !Array.isArray(response.data)) {
            console.warn("⚠️ API returned no valid data:", response.data);
            return [];
        }

        // 🚀 Ensure `date_paid` is properly converted to a Date object
        const formattedData = response.data.map(com => ({
            ...com,
            date_paid: com.date_paid ? new Date(com.date_paid + "T00:00:00Z") : null,  // Convert string to Date object
        }));

        console.log("✅ Commissions Data Loaded:", formattedData);
        return formattedData;
    } catch (error) {
        console.error("❌ Error fetching commissions:", error.response?.data || error.message);
        return [];
    }
};

// ✅ Fetch Commissions for Current Month
export const fetchCurrentMonthCommissions = async (salesRepId) => {
    console.log(`🔍 Fetching Current Month Commissions for user ${salesRepId}...`);
    try {
        const response = await api.get(`/commissions/current_month`, {
            params: { sales_rep_id: salesRepId },
        });
        console.log("✅ Current Month Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching current month commissions:", error.response?.data || error.message);
        return { total_commissions: 0 };
    }
};

// ✅ Fetch Available Years
export const fetchAllYearsCommissions = async (salesRepId) => {
    console.log(`🔍 Fetching All Years for user ${salesRepId}...`);
    try {
        const response = await api.get(`/commissions/all_years`, {
            params: { sales_rep_id: salesRepId },
        });
        console.log("✅ Available Years:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching all years:", error.response?.data || error.message);
        return [];
    }
};

// ✅ Fetch Commissions for Current Year
export const fetchCurrentYearCommissions = async (salesRepId) => {
    try {
        const response = await api.get(`/commissions/current_year`, {
            params: { sales_rep_id: salesRepId },
        });
        console.log("✅ Fetched Current Year Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching current year commissions:", error.response?.data || error.message);
        return { total_commissions: 0 };
    }
};

// ✅ Fetch Last Year Commissions
export const fetchLastYearCommissions = async (salesRepId) => {
    try {
        const response = await api.get(`/commissions/last_year`, {
            params: { sales_rep_id: salesRepId },
        });
        console.log("✅ Fetched Last Year Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching last year commissions:", error.response?.data || error.message);
        return { total_commissions: 0 };
    }
};

// ✅ Fetch Projected Commissions
export const fetchProjectedCommissions = async (salesRepId) => {
    try {
        const response = await api.get(`/commissions/projected`, {
            params: { sales_rep_id: salesRepId },
        });
        console.log("✅ Projected Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching projected commissions:", error.response?.data || error.message);
        return { projected_commissions: 0 };
    }
};

// ✅ Fetch Monthly Commissions for a Specific Year
export const fetchMonthlyCommissions = async (salesRepId, year) => {
    console.log(`🔍 Fetching Monthly Commissions for ${year}...`);
    try {
        const response = await api.get(`/commissions/monthly/${year}`, {
            params: { sales_rep_id: salesRepId },
        });

        console.log("✅ Fetched Monthly Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching monthly commissions:", error.response?.data || error.message);
        return Array(12).fill(0); // Return an empty 12-month array
    }
};

// ✅ Fetch Weekly Commissions for a Specific Year & Month
export const fetchWeeklyCommissions = async (salesRepId, year, month) => {
    console.log(`🔍 Fetching Weekly Commissions for ${month}/${year}...`);
    try {
        const response = await api.get(`/commissions/weekly/${year}/${month}`, {
            params: { sales_rep_id: salesRepId },
        });

        console.log("✅ Fetched Weekly Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching weekly commissions:", error.response?.data || error.message);
        return Array(5).fill(0); // Default to 5 weeks
    }
};

// ✅ Fetch Yearly Commissions for a Date Range
export const fetchYearlyCommissions = async (salesRepId, fromYear, toYear) => {
    console.log(`🔍 Fetching Yearly Commissions for ${fromYear} to ${toYear}...`);
    try {
        const response = await api.get(`/commissions/yearly`, {
            params: {
                sales_rep_id: salesRepId,
                from_year: fromYear,
                to_year: toYear,
            },
        });

        console.log("✅ Fetched Yearly Commissions:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching yearly commissions:", error.response?.data || error.message);
        return {};
    }
};
