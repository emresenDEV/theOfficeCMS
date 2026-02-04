import api from "./api";

export const createUser = async (data) => {
  try {
    const response = await api.post("/users", data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating user:", error.response?.data || error.message);
    throw error;
  }
};

export const updateUser = async (userId, data) => {
  try {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating user:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteUser = async (userId, actorUserId, actorEmail) => {
  try {
    const params = new URLSearchParams();
    if (actorUserId) params.append("actor_user_id", actorUserId);
    if (actorEmail) params.append("actor_email", actorEmail);
    const query = params.toString();
    const url = query ? `/users/${userId}?${query}` : `/users/${userId}`;
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting user:", error.response?.data || error.message);
    throw error;
  }
};
