import api from "./api"; 

// Update payment by ID
export const updatePayment = async (paymentId, updatedData) => {
    try {
        const response = await api.put(`/payment/${paymentId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error(`❌ Error updating payment ${paymentId}:`, error.response?.data || error.message);
        return null;
    }
};

// Delete payment by ID
export const deletePayment = async (paymentId) => {
    try {
        const response = await api.delete(`/payment/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error deleting payment ${paymentId}:`, error.response?.data || error.message);
        return null;
    }
};
