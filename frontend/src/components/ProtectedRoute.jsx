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

    if (!user || !user.id) {
        console.warn("⚠️ No user found, redirecting to login...");
        return <Navigate to="/login" replace />;
    }

    return children;
};

ProtectedRoute.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        username: PropTypes.string,
    }),
    loading: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
