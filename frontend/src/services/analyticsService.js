import api from "./api";

export const fetchAnalyticsOverview = async ({
    userId,
    salesRepId,
    dateFrom,
    dateTo,
} = {}) => {
    try {
        const params = {};
        if (userId) params.user_id = userId;
        if (salesRepId) params.sales_rep_id = salesRepId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const response = await api.get("/analytics/overview", { params });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching analytics overview:", error.response?.data || error.message);
        return null;
    }
};
