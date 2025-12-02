import { Link } from "react-router-dom";
import { FiHome, FiUsers, FiSettings, FiBriefcase, FiLogOut, FiClipboard, FiTrendingUp } from "react-icons/fi";
import PropTypes from "prop-types";
import logo from "../assets/Dunder-Mifflin.svg";

const Sidebar = ({ user, handleLogout, isOpen, toggleSidebar }) => {
    console.log("🧠 Sidebar Received User:", user); // debugging


    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed md:relative top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                } z-40`}
            >
                {/* Upper Section */}
                <div>
                    {/* Logo */}
                    <div className="mb-6 flex items-center justify-center">
                        <img src={logo} alt="Dunder Mifflin Company Logo" className="w-11/12 max-w-[280px] object-contain" />
                    </div>
                    {/* User Info */}
                    {user ? (
                    <>
                        <h2 className="text-lg font-bold">{user.first_name} {user.last_name}</h2>
                        <h3 className="text-md font-semibold text-gray-400">
                        {user?.department_name ? `${user.department_name} Department` : "Unknown Department"}
                        </h3>
                    </>
                    ) : (
                    <h3 className="text-md font-semibold text-gray-400">Loading user...</h3>
                    )}
                    {/* Navigation */}
                    <nav className="mt-6 space-y-2">
                        <NavItem to="/" icon={<FiHome />} label="Dashboard" onNavigate={toggleSidebar} />
                        <NavItem to="/tasks" icon={<FiClipboard />} label="My Tasks" onNavigate={toggleSidebar} />
                        {/* <NavItem to="/calendar" icon={<FiBriefcase />} label="Calendar" onNavigate={toggleSidebar} /> */}
                        <NavItem to="/accounts" icon={<FiUsers />} label="Accounts" onNavigate={toggleSidebar} />
                        <NavItem to="/commissions" icon={<FiTrendingUp />} label="Commissions" onNavigate={toggleSidebar} />
                        {/* <NavItem to="/employee-info" icon={<FiUsers />} label="My Info" onNavigate={toggleSidebar} /> */}
                        <NavItem to="/settings" icon={<FiSettings />} label="Settings" onNavigate={toggleSidebar} />
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

        </>
    );
};

// Navigation Item Component
const NavItem = ({ to, icon, label, onNavigate }) => (
    <Link
        to={to}
        onClick={onNavigate}
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
    onNavigate: PropTypes.func,
};

export default Sidebar;
