import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Protected Route Component - Redirects unauthenticated users to login
 */
const ProtectedRoute = ({ user, loading, children }) => {
    console.log("🔍 Checking Protected Route - User:", user);

    if (loading) {
        // Optional: return a loading spinner or null
        return <p className="ml-64 p-6">Loading session...</p>;
    }

    if (!user || !user.user_id && !user.id) {
        console.warn("⚠️ No user found, redirecting to login...");
        return <Navigate to="/login" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number,
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        role_id: PropTypes.number,
        role_name: PropTypes.string,
        department_id: PropTypes.number,
        department_name: PropTypes.string,
        branch_id: PropTypes.number,
        branch_name: PropTypes.string,
        commission_rate: PropTypes.number,
        extension: PropTypes.string,
        phone_number: PropTypes.string,
        reports_to: PropTypes.number,
        reports_to_name: PropTypes.string,
        receives_commission: PropTypes.bool,
        is_department_lead: PropTypes.bool,
        salary: PropTypes.number,
        date_created: PropTypes.string,
        date_updated: PropTypes.string,
    }),
    loading: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
