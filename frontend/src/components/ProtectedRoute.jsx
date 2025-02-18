import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Protected Route Component - Redirects unauthenticated users to login
 */
const ProtectedRoute = ({ user, children }) => {
    console.log("🔍 Checking Protected Route - User:", user);
    if (!user || !user.id) {
    // if (!user) {
        console.warn("⚠️ No user found, redirecting to login...");
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Define Prop Types
ProtectedRoute.propTypes = {
    user: PropTypes.object,
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
