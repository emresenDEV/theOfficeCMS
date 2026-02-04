import { Bell, Search } from "lucide-react";
import PropTypes from "prop-types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

export function DashboardHeader({ userName, roleName }) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                    {getGreeting()}, {userName}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roleName} Dashboard</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search accounts, invoices..."
                        className="w-64 pl-9 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                    />
                </div>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        3
                    </span>
                </Button>
            </div>
        </div>
    );
}

DashboardHeader.propTypes = {
    userName: PropTypes.string.isRequired,
    roleName: PropTypes.string.isRequired,
};
