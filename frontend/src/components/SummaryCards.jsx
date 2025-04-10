import PropTypes from "prop-types";

const SummaryCards = ({
    currentMonthCommission,
    currentYearCommission,
    lastYearCommission,
    projectedCommission,
}) => {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-100 p-4 rounded shadow">
                <p className="text-sm font-medium">This Month</p>
                <p className="text-xl font-bold">${currentMonthCommission.toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded shadow">
                <p className="text-sm font-medium">This Year</p>
                <p className="text-xl font-bold">${currentYearCommission.toFixed(2)}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-sm font-medium">Last Year</p>
                <p className="text-xl font-bold">${lastYearCommission.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded shadow">
                <p className="text-sm font-medium">Projected</p>
                <p className="text-xl font-bold">${projectedCommission.toFixed(2)}</p>
            </div>
        </div>
    );
};

// Prop Validations
SummaryCards.propTypes = {
    currentMonthCommission: PropTypes.number.isRequired,
    currentYearCommission: PropTypes.number.isRequired,
    lastYearCommission: PropTypes.number.isRequired,
    projectedCommission: PropTypes.number.isRequired,
};

export default SummaryCards;
