import PropTypes from "prop-types";

const SummaryCards = ({
    currentMonthCommission,
    currentYearCommission,
    lastYearCommission,
    projectedCommission,
}) => {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-100 dark:bg-emerald-900/40 p-4 rounded shadow text-slate-900 dark:text-slate-100">
                <p className="text-sm font-medium">This Month</p>
                <p className="text-xl font-bold">${currentMonthCommission.toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded shadow text-slate-900 dark:text-slate-100">
                <p className="text-sm font-medium">This Year</p>
                <p className="text-xl font-bold">${currentYearCommission.toFixed(2)}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded shadow text-slate-900 dark:text-slate-100">
                <p className="text-sm font-medium">Last Year</p>
                <p className="text-xl font-bold">${lastYearCommission.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/40 p-4 rounded shadow text-slate-900 dark:text-slate-100">
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
