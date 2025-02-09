import { Link } from "react-router-dom";
import { FiHome, FiUsers, FiSettings, FiBriefcase, FiLogOut } from "react-icons/fi";
import PropTypes from "prop-types";

const Sidebar = ({ user, handleLogout }) => {

return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col justify-between p-4 fixed">
    {/* Upper Sidebar Content */}
    <div>
        <h1 className="text-xl font-bold">Dunder Mifflin Paper Company</h1>
        <h2 className="text-xl font-bold">Hello, {user.firstName}</h2>
        <h3 className="text-xl font-bold">{user.department_id}</h3> {/* FIXME: change to department name */}
        {/* Navigation Links */}
        <nav className="space-y-4 mt-4">
            <NavItem to="/" icon={<FiHome />} label="Dashboard" />
            <NavItem to="/tasks" icon={<FiBriefcase />} label="My Tasks" />
            <NavItem to="/calendar" icon={<FiBriefcase />} label="Calendar" />
            <NavItem to="/accounts" icon={<FiBriefcase />} label="Accounts" />
            <NavItem to="/commissions" icon={<FiBriefcase />} label="Commissions" />
            <NavItem to="/employee-info" icon={<FiUsers />} label="My Info" />
            <NavItem to="/settings" icon={<FiSettings />} label="Settings" />
        </nav>
    </div>

    {/* Logout Button (Always at the Bottom) */}
    <button
        className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 w-full"
        onClick={handleLogout}
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
