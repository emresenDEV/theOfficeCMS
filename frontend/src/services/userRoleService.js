import api from "./api";

// ✅ Fetch all roles
export const fetchAllRoles = async () => {
    try {
        const response = await api.get("/user_roles/roles");
        console.log("✅ Fetched All Roles:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching all roles:", error.response?.data || error.message);
        return [];
    }
};

// ✅ Fetch role by ID
export const fetchRoleById = async (roleId) => {
    try {
        const response = await api.get(`/user_roles/roles/${roleId}`);
        console.log("✅ Fetched Role:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching role by ID:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Create a new role
export const createRole = async (roleData) => {
    try {
        const response = await api.post("/user_roles/roles", roleData);
        console.log("✅ Created Role:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error creating role:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Update role
export const updateRole = async (roleId, roleData) => {
    try {
        const response = await api.put(`/user_roles/roles/${roleId}`, roleData);
        console.log("✅ Updated Role:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error updating role:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Delete role
export const deleteRole = async (roleId) => {
    try {
        const response = await api.delete(`/user_roles/roles/${roleId}`);
        console.log("✅ Deleted Role:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error deleting role:", error.response?.data || error.message);
        return null;
    }
};
