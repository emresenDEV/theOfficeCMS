import PropTypes from "prop-types";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

export function DashboardHeader({ userName, roleName }) {
    return (
        <div className="w-full rounded-lg border border-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {getGreeting()}, {userName}
                    </h1>
                    <p className="mt-0 text-sm text-muted-foreground">{roleName} Dashboard</p>
                </div>
            </div>
        </div>
    );
}

DashboardHeader.propTypes = {
    userName: PropTypes.string.isRequired,
    roleName: PropTypes.string.isRequired,
};
