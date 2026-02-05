import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import SalesChart from "../components/SalesChart";
import { fetchUserProfile } from "../services/userService";

const AnalyticsPage = ({ user }) => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!user?.id) return;
        fetchUserProfile(user.id).then((data) => setProfile(data));
    }, [user]);

    if (!profile) {
        return <p className="px-4 py-4 text-muted-foreground sm:px-6 sm:py-6">Loading analytics...</p>;
    }

    return (
        <div className="w-full">
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Sales performance, trends, and rep activity.
                    </p>
                </div>
                <SalesChart userProfile={profile} />
            </div>
        </div>
    );
};

AnalyticsPage.propTypes = {
    user: PropTypes.object,
};

export default AnalyticsPage;
