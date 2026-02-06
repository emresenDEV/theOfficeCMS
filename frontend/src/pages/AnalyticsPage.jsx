import PropTypes from "prop-types";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const AnalyticsPage = ({ user }) => {
    return (
        <AnalyticsDashboard user={user} />
    );
};

AnalyticsPage.propTypes = {
    user: PropTypes.object,
};

export default AnalyticsPage;
