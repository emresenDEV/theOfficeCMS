import PropTypes from "prop-types";

const Filters = ({
    viewMode,
    setViewMode,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    fromYear,
    setFromYear,
    toYear,
    setToYear,
    yearRange,
}) => {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
                {viewMode === "weekly" && (
                    <>
                        <label className="text-sm font-medium">Month</label>
                        <select
                            className="border p-2 w-40 shadow-lg rounded"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                                </option>
                            ))}
                        </select>
                    </>
                )}

                {viewMode === "yearly" ? (
                    <div className="flex gap-4">
                        <div>
                            <label className="text-sm font-medium p-2">From Year</label>
                            <select
                                className="border p-2 w-40 shadow-lg rounded"
                                value={fromYear}
                                onChange={(e) => setFromYear(parseInt(e.target.value))}
                            >
                                {yearRange.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium p-2">To Year</label>
                            <select
                                className="border p-2 w-40 shadow-lg rounded"
                                value={toYear}
                                onChange={(e) => setToYear(parseInt(e.target.value))}
                            >
                                {yearRange
                                    .filter((year) => year >= fromYear)
                                    .map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium">Year</label>
                        <select
                            className="border p-2 w-40 shadow-lg rounded"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {yearRange.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    className={`px-4 py-2 rounded ${
                        viewMode === "yearly" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setViewMode("yearly")}
                >
                    Yearly
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        viewMode === "monthly" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setViewMode("monthly")}
                >
                    Monthly
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        viewMode === "weekly" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setViewMode("weekly")}
                >
                    Weekly
                </button>
            </div>
        </div>
    );
};

// Prop Validations
Filters.propTypes = {
    viewMode: PropTypes.string.isRequired,
    setViewMode: PropTypes.func.isRequired,
    selectedYear: PropTypes.number.isRequired,
    setSelectedYear: PropTypes.func.isRequired,
    selectedMonth: PropTypes.number.isRequired,
    setSelectedMonth: PropTypes.func.isRequired,
    fromYear: PropTypes.number.isRequired,
    setFromYear: PropTypes.func.isRequired,
    toYear: PropTypes.number.isRequired,
    setToYear: PropTypes.func.isRequired,
    yearRange: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default Filters;
