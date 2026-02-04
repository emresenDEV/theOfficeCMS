import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiSettings, FiLogOut, FiClipboard, FiTrendingUp } from "react-icons/fi";
import PropTypes from "prop-types";
import logo from "../assets/Dunder-Mifflin.svg";

const Sidebar = ({ user, handleLogout, isOpen, toggleSidebar }) => {
    const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "DM";

    const navItemClasses = ({ isActive }) =>
        [
            "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
            isActive
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-100",
        ].join(" ");

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed md:relative top-0 left-0 h-screen min-h-screen w-72 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                } z-40`}
            >
                {/* Upper Section */}
                <div className="flex h-full flex-col p-4 overflow-y-auto">
                    {/* Brand */}
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                                <img src={logo} alt="Dunder Mifflin Company Logo" className="h-8 w-8 object-contain" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Workspace</div>
                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">Sales Console</div>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                                {initials}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {user ? `${user.first_name} ${user.last_name}` : "Loading user..."}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {user?.department_name ? `${user.department_name} Department` : "Department pending"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="mt-6">
                        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Navigation
                        </div>
                        <nav className="space-y-2">
                            <NavItem to="/" icon={<FiHome />} label="Dashboard" onNavigate={toggleSidebar} className={navItemClasses} />
                            <NavItem to="/tasks" icon={<FiClipboard />} label="My Tasks" onNavigate={toggleSidebar} className={navItemClasses} />
                            {/* <NavItem to="/calendar" icon={<FiBriefcase />} label="Calendar" onNavigate={toggleSidebar} className={navItemClasses} /> */}
                            <NavItem to="/accounts" icon={<FiUsers />} label="Accounts" onNavigate={toggleSidebar} className={navItemClasses} />
                            <NavItem to="/commissions" icon={<FiTrendingUp />} label="Commissions" onNavigate={toggleSidebar} className={navItemClasses} />
                            {/* <NavItem to="/employee-info" icon={<FiUsers />} label="My Info" onNavigate={toggleSidebar} className={navItemClasses} /> */}
                            <NavItem to="/settings" icon={<FiSettings />} label="Settings" onNavigate={toggleSidebar} className={navItemClasses} />
                        </nav>
                    </div>
                </div>

                {/* Logout Button */}
                {handleLogout && (
                    <div className="p-4">
                        <button
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
                            onClick={handleLogout}
                        >
                            <FiLogOut size={18} />
                            Log Out
                        </button>
                    </div>
                )}
            </div>

        </>
    );
};

// Navigation Item Component
const NavItem = ({ to, icon, label, onNavigate, className }) => (
    <NavLink
        to={to}
        onClick={onNavigate}
        className={className}
    >
        <span className="text-lg text-slate-500 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-100">
            {icon}
        </span>
        <span>{label}</span>
    </NavLink>
);

// Prop Validations
Sidebar.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        department_name: PropTypes.string,
    }),
    handleLogout: PropTypes.func,
};


NavItem.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.element.isRequired,
    label: PropTypes.string.isRequired,
    onNavigate: PropTypes.func,
    className: PropTypes.func.isRequired,
};

export default Sidebar;
