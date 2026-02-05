import { useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Building2,
    UserRound,
    FileText,
    CreditCard,
    DollarSign,
    BarChart3,
    Calendar,
    CheckSquare,
    UserCog,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Separator } from "./ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const mainNavItems = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Accounts", href: "/accounts", icon: Building2 },
    { title: "Contacts", href: "/contacts", icon: UserRound },
    { title: "Invoices", href: "/invoices", icon: FileText },
    { title: "Payments", href: "/payments", icon: CreditCard },
    { title: "Commissions", href: "/commissions", icon: DollarSign },
];

const toolsNavItems = [
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
    { title: "Calendar", href: "/calendar", icon: Calendar },
    { title: "Tasks", href: "/tasks", icon: CheckSquare },
];

const adminNavItems = [
    { title: "Admin", href: "/admin", icon: Users },
    { title: "Settings", href: "/settings", icon: UserCog },
];

const Sidebar = ({ user, handleLogout, isOpen, toggleSidebar }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "DM";

    const NavSection = ({ items, label }) => (
        <div className="space-y-1">
            {label && !collapsed && (
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                    {label}
                </p>
            )}
            {items.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                const link = (
                    <NavLink
                        to={item.href}
                        onClick={toggleSidebar}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground/80",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <Icon
                            className={cn(
                                "h-5 w-5 shrink-0",
                                isActive ? "text-sidebar-primary" : ""
                            )}
                        />
                        {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                );

                if (!collapsed) {
                    return <div key={item.href}>{link}</div>;
                }

                return (
                    <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            {item.title}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );

    return (
        <aside
            className={cn(
                "fixed md:relative top-0 left-0 z-40 flex h-screen min-h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
                collapsed ? "w-16" : "w-64",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
        >
            {/* Logo */}
            <div
                className={cn(
                    "flex h-16 items-center border-b border-sidebar-border px-4",
                    collapsed ? "justify-center" : "gap-3"
                )}
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                    <span className="text-lg font-bold text-sidebar-primary-foreground">
                        DM
                    </span>
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-sidebar-foreground">
                            Dunder Mifflin
                        </span>
                        <span className="text-xs text-sidebar-muted">CRM System</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                <NavSection items={mainNavItems} />
                <Separator className="bg-sidebar-border" />
                <NavSection items={toolsNavItems} label="Tools" />
                <Separator className="bg-sidebar-border" />
                <NavSection items={adminNavItems} label="Admin" />
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-3 space-y-2">
                <div
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2",
                        collapsed && "justify-center px-2"
                    )}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground">
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                            </p>
                            <p className="text-xs text-sidebar-muted truncate">
                                {user?.role_name || "Sales"}
                            </p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "rounded-md border border-sidebar-border bg-sidebar-accent p-1 text-sidebar-foreground/80 hover:text-sidebar-foreground",
                            collapsed ? "ml-0" : "ml-auto"
                        )}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {handleLogout && (
                    <button
                        className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive",
                            "hover:bg-destructive/20"
                        )}
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && "Log Out"}
                    </button>
                )}
            </div>
        </aside>
    );
};

Sidebar.propTypes = {
    user: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        role_name: PropTypes.string,
    }),
    handleLogout: PropTypes.func,
    isOpen: PropTypes.bool,
    toggleSidebar: PropTypes.func,
};

Sidebar.defaultProps = {
    isOpen: false,
    toggleSidebar: () => {},
};

export default Sidebar;
