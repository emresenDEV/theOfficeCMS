import { Link } from "react-router-dom";
import { useState } from "react";
import { FiHome, FiUsers, FiSettings, FiBriefcase, FiLogOut, FiMenu, FiClipboard, FiTrendingUp } from "react-icons/fi";
import PropTypes from "prop-types";

const Sidebar = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    console.log("🧠 Sidebar Received User:", user); // debugging


    return (
        <>
            {/* Mobile Hamburger Menu */}
            <button
                className="md:hidden fixed top-4 left-4 bg-gray-800 text-white p-2 rounded-md z-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <FiMenu size={24} />
            </button>

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen w-1/4 bg-gray-900 text-white flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out md:w-1/4 ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}
            >
                {/* Upper Section */}
                <div>
                    {/* Logo */}
                    <div className="mb-6 flex items-center justify-center">
                        <img src="./public/Dunder-Mifflin.svg" alt="Dunder Mifflin Company Logo" className="w-11/12 max-w-[280px] object-contain" />
                    </div>

                    {/* User Info */}
                    <h2 className="text-lg font-bold">{user.first_name} {user.last_name}</h2>
                    <h3 className="text-md font-semibold text-gray-400">
                        {user?.department_name ? `${user.department_name} Department` : "Unknown Department"}
                    </h3>

                    {/* Navigation */}
                    <nav className="mt-6 space-y-2">
                        <NavItem to="/" icon={<FiHome />} label="Dashboard" />
                        <NavItem to="/tasks" icon={<FiClipboard />} label="My Tasks" />
                        {/* <NavItem to="/calendar" icon={<FiBriefcase />} label="Calendar" /> */}
                        <NavItem to="/accounts" icon={<FiUsers />} label="Accounts" />
                        <NavItem to="/commissions" icon={<FiTrendingUp />} label="Commissions" />
                        {/* <NavItem to="/employee-info" icon={<FiUsers />} label="My Info" /> */}
                        <NavItem to="/settings" icon={<FiSettings />} label="Settings" />
                    </nav>
                </div>

                {/* Logout Button */}
                <button
                    className="bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-center w-full hover:bg-red-600 transition"
                    onClick={handleLogout}
                >
                    <FiLogOut size={20} className="mr-2" />
                    Log Out
                </button>
            </div>

            {/* Overlay when menu is open (Mobile) */}
            {isOpen && (
                <div
                    className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </>
    );
};

// Navigation Item Component
const NavItem = ({ to, icon, label }) => (
    <Link
        to={to}
        className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
    >
        {icon}
        <span>{label}</span>
    </Link>
);

// Prop Validations
Sidebar.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        department_name: PropTypes.string,
    }).isRequired,
    handleLogout: PropTypes.func.isRequired,
};


NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
};

export default Sidebar;
