import { Link } from "react-router-dom";
import { FiHome, FiUsers, FiSettings, FiBriefcase, FiLogOut } from "react-icons/fi";
import PropTypes from "prop-types";

const Sidebar = ({ user, handleLogout }) => {

return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4 fixed">
    {/* User Info */}
    <div className="mb-6">
        <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
    </div>

    {/* Navigation Links */}
    <nav className="space-y-4">
        <NavItem to="/" icon={<FiHome />} label="Dashboard" />
        <NavItem to="/accounts" icon={<FiBriefcase />} label="Accounts" />
        <NavItem to="/settings" icon={<FiSettings />} label="Settings" />
        <NavItem to="/employees" icon={<FiUsers />} label="Employee Info" />
    </nav>

    <button
        className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        onClick={handleLogout} // ✅ Now handleLogout is passed correctly
    >
        <FiLogOut />
        <span>Log Out</span>
    </button>

    </div>
);
};

// Helper Component for Sidebar Links
const NavItem = ({ to, label }) => (
    <Link to={to} className="block p-2 hover:text-gray-300">
        {label}
    </Link>
);

Sidebar.propTypes = {
    user: PropTypes.object.isRequired,
    handleLogout: PropTypes.func.isRequired,
    };

NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
};

export default Sidebar;
