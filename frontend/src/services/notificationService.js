import api from "./api";

export const fetchNotifications = async (userId, unreadOnly = false) => {
    try {
        const response = await api.get("/notifications", {
            params: { user_id: userId, unread_only: unreadOnly },
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching notifications:", error.response?.data || error.message);
        return [];
    }
};

export const markNotificationRead = async (notificationId) => {
    try {
        await api.put(`/notifications/${notificationId}/read`);
        return true;
    } catch (error) {
        console.error("❌ Error marking notification read:", error.response?.data || error.message);
        return false;
    }
};

export const markAllNotificationsRead = async (userId) => {
    try {
        await api.put("/notifications/read_all", null, {
            params: { user_id: userId },
        });
        return true;
    } catch (error) {
        console.error("❌ Error marking all notifications read:", error.response?.data || error.message);
        return false;
    }
};
