import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PropTypes from "prop-types";
import {
    generateMonthlySalesData,
    getCurrentYear,
    getAvailableYears,
    filterSalesRepsByRole,
    filterBranchesByNames,
} from "../utils/salesDataProcessor";

const DashboardSalesChartMobile = ({ userData, userSalesData, allSalesReps }) => {
    const [selectedMetric, setSelectedMetric] = useState("company");
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [selectedBranches, setSelectedBranches] = useState(
        userData?.branch_id ? [userData.branch_id] : []
    );
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [showRepDropdown, setShowRepDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    // Filter sales reps to only show those with "Sales Representative" role
    const salesRepresentatives = useMemo(
        () => filterSalesRepsByRole(allSalesReps),
        [allSalesReps]
    );

    // Get available branches from sales data
    const branches = useMemo(
        () => filterBranchesByNames(userSalesData),
        [userSalesData]
    );

    // Get available years
    const availableYears = useMemo(
        () => getAvailableYears([]),
        []
    );

    // Determine which data to display based on selected metric
    const chartData = useMemo(() => {
        let dataToChart = [];
        let displayLabel = "";

        if (selectedMetric === "company") {
            // Company view: Company-wide total + current user's sales
            const companyTotal = userSalesData.reduce(
                (sum, rep) => sum + (rep.total_sales || 0),
                0
            );
            const currentUserTotal = userSalesData.find(
                (rep) => rep.user_id === userData?.user_id
            )?.total_sales || 0;

            // For simplicity, show 2 lines: company average per rep and current user
            const monthlyCompany = generateMonthlySalesData(
                userSalesData.map(rep => ({
                    date: new Date(),
                    amount: (rep.total_sales || 0) / 12, // Distribute across months
                })),
                selectedYear
            );

            dataToChart = monthlyCompany.map(month => ({
                month: month.month,
                "Company Average": Math.round(
                    (companyTotal / userSalesData.length / 12) * 100
                ) / 100,
                [userData?.first_name || "You"]: Math.round(
                    (currentUserTotal / 12) * 100
                ) / 100,
            }));

            displayLabel = "Company Wide Sales";
        } else if (selectedMetric === "branch") {
            // Branch view: Show selected branches
            if (selectedBranches.length === 0) {
                displayLabel = "No branches selected";
            } else {
                const branchSalesData = userSalesData.filter(rep =>
                    selectedBranches.includes(rep.branch_id)
                );

                dataToChart = generateMonthlySalesData(
                    branchSalesData.map(rep => ({
                        date: new Date(),
                        amount: (rep.total_sales || 0) / 12,
                    })),
                    selectedYear
                ).map(month => ({
                    month: month.month,
                    sales: Math.round(month.sales * 100) / 100,
                }));

                displayLabel = `${selectedBranches.length} Branch${selectedBranches.length > 1 ? "es" : ""}`;
            }
        } else if (selectedMetric === "sales-rep") {
            // Sales Rep view: Show selected sales representatives
            if (selectedSalesReps.length === 0) {
                displayLabel = "No sales reps selected";
            } else {
                const repNames = selectedSalesReps
                    .map(
                        repId =>
                            allSalesReps.find(rep => rep.user_id === repId)?.first_name ||
                            `Rep ${repId}`
                    )
                    .slice(0, 2); // Show up to 2 names

                const repSalesData = userSalesData.filter(rep =>
                    selectedSalesReps.includes(rep.user_id)
                );

                // Create a line for each selected rep
                dataToChart = [];
                const monthlyData = generateMonthlySalesData([], selectedYear);

                monthlyData.forEach(month => {
                    const monthEntry = { month: month.month };
                    selectedSalesReps.forEach(repId => {
                        const rep = repSalesData.find(r => r.user_id === repId);
                        const repName =
                            allSalesReps.find(r => r.user_id === repId)?.first_name ||
                            `Rep ${repId}`;
                        monthEntry[repName] = Math.round(
                            ((rep?.total_sales || 0) / 12) * 100
                        ) / 100;
                    });
                    dataToChart.push(monthEntry);
                });

                displayLabel = `${selectedSalesReps.length} Sales Rep${selectedSalesReps.length > 1 ? "s" : ""}`;
            }
        }

        return { data: dataToChart, label: displayLabel };
    }, [
        selectedMetric,
        selectedYear,
        selectedBranches,
        selectedSalesReps,
        userSalesData,
        userData,
        allSalesReps,
    ]);

    const toggleBranch = (branchId) => {
        setSelectedBranches(prev =>
            prev.includes(branchId)
                ? prev.filter(id => id !== branchId)
                : [...prev, branchId]
        );
    };

    const toggleSalesRep = (userId) => {
        setSelectedSalesReps(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const totalSales = chartData.data.reduce((sum, month) => {
        const values = Object.values(month).filter(
            v => typeof v === "number"
        );
        return sum + values.reduce((a, b) => a + b, 0);
    }, 0);

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center mb-3"
            >
                <h2 className="text-lg font-semibold">Sales Overview</h2>
                <span className="text-xl">{isExpanded ? "−" : "+"}</span>
            </button>

            {isExpanded && (
                <>
                    {/* Year Selector */}
                    <div className="mb-4 flex gap-2">
                        <label className="text-xs font-semibold text-gray-700">Year:</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowYearDropdown(!showYearDropdown)}
                                className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                {selectedYear}
                            </button>
                            {showYearDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10">
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                setSelectedYear(year);
                                                setShowYearDropdown(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metric Buttons */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        <button
                            onClick={() => {
                                setSelectedMetric("company");
                                setShowBranchDropdown(false);
                                setShowRepDropdown(false);
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                selectedMetric === "company"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Company
                        </button>
                        <button
                            onClick={() => {
                                setSelectedMetric("branch");
                                setShowRepDropdown(false);
                                setShowBranchDropdown(!showBranchDropdown);
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                selectedMetric === "branch"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Branch
                        </button>
                        <button
                            onClick={() => {
                                setSelectedMetric("sales-rep");
                                setShowBranchDropdown(false);
                                setShowRepDropdown(!showRepDropdown);
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                selectedMetric === "sales-rep"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Sales Reps
                        </button>
                    </div>

                    {/* Branch Dropdown */}
                    {showBranchDropdown && selectedMetric === "branch" && (
                        <div className="mb-4 p-3 bg-gray-50 rounded border">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                Select Branches:
                            </p>
                            <div className="space-y-2">
                                {branches.map(branch => (
                                    <label
                                        key={branch.id}
                                        className="flex items-center text-sm cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBranches.includes(branch.id)}
                                            onChange={() => toggleBranch(branch.id)}
                                            className="mr-2"
                                        />
                                        {branch.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sales Rep Dropdown */}
                    {showRepDropdown && selectedMetric === "sales-rep" && (
                        <div className="mb-4 p-3 bg-gray-50 rounded border max-h-48 overflow-y-auto">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                Select Sales Representatives:
                            </p>
                            <div className="space-y-2">
                                {salesRepresentatives.map(rep => (
                                    <label
                                        key={rep.user_id}
                                        className="flex items-center text-sm cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSalesReps.includes(rep.user_id)}
                                            onChange={() => toggleSalesRep(rep.user_id)}
                                            className="mr-2"
                                        />
                                        {rep.first_name} {rep.last_name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Current Metric Display */}
                    <div className="bg-blue-50 rounded p-3 mb-4 border-l-4 border-blue-600">
                        <p className="text-xs text-gray-600">
                            {chartData.label} - {selectedYear}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            ${totalSales.toLocaleString()}
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="w-full h-64 sm:h-80">
                        {chartData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                        }}
                                        formatter={(value) => `$${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                    {selectedMetric === "company" && (
                                        <>
                                            <Line
                                                type="monotone"
                                                dataKey="Company Average"
                                                stroke="#3b82f6"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={userData?.first_name || "You"}
                                                stroke="#10b981"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        </>
                                    )}
                                    {selectedMetric === "branch" && (
                                        <Line
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#3b82f6"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                    )}
                                    {selectedMetric === "sales-rep" &&
                                        selectedSalesReps.map((_, index) => (
                                            <Line
                                                key={index}
                                                type="monotone"
                                                dataKey={
                                                    allSalesReps.find(
                                                        r =>
                                                            r.user_id ===
                                                            selectedSalesReps[index]
                                                    )?.first_name ||
                                                    `Rep ${selectedSalesReps[index]}`
                                                }
                                                stroke={
                                                    ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][
                                                        index % 4
                                                    ]
                                                }
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                        ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                No data available
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

DashboardSalesChartMobile.propTypes = {
    userData: PropTypes.object,
    userSalesData: PropTypes.array.isRequired,
    allSalesReps: PropTypes.array.isRequired,
};

export default DashboardSalesChartMobile;
