import api from "./api"; 

// Fetch payments (optionally filter by account/invoice/sales rep)
export const fetchPayments = async (filters = {}) => {
    try {
        const response = await api.get("/payment", { params: filters });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching payments:", error.response?.data || error.message);
        return [];
    }
};

// Update payment by ID
export const updatePayment = async (paymentId, updatedData, actorUserId, actorEmail) => {
    try {
        const payload = {
            ...updatedData,
            actor_user_id: actorUserId,
            actor_email: actorEmail,
        };
        const response = await api.put(`/payment/${paymentId}`, payload);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating payment ${paymentId}:`, error.response?.data || error.message);
        return null;
    }
};

// Delete payment by ID
export const deletePayment = async (paymentId, actorUserId, actorEmail) => {
    try {
        const params = new URLSearchParams();
        if (actorUserId) params.append("actor_user_id", actorUserId);
        if (actorEmail) params.append("actor_email", actorEmail);
        const query = params.toString();
        const url = query ? `/payment/${paymentId}?${query}` : `/payment/${paymentId}`;
        const response = await api.delete(url);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting payment ${paymentId}:`, error.response?.data || error.message);
        return null;
    }
};
