import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PropTypes from "prop-types";

const DashboardSalesChartMobile = ({ userData, userSalesData, allSalesReps }) => {
    const [selectedMetric, setSelectedMetric] = useState("company");
    const [selectedBranches, setSelectedBranches] = useState([userData?.branch_id || 1]);
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [showRepDropdown, setShowRepDropdown] = useState(false);

    // Get unique branches from sales data
    const uniqueBranches = [...new Set(userSalesData.map(rep => rep.branch_id))];
    const branches = uniqueBranches.map(branchId => {
        const firstRep = userSalesData.find(rep => rep.branch_id === branchId);
        return {
            id: branchId,
            name: firstRep?.branch_name || `Branch ${branchId}`,
        };
    });

    // Filter data based on selected metric
    let filteredData = [];
    let displayLabel = "";
    let totalSales = 0;

    if (selectedMetric === "company") {
        // Show all sales reps in the company
        filteredData = userSalesData;
        displayLabel = "Company Wide";
        totalSales = userSalesData.reduce((sum, rep) => sum + rep.total_sales, 0);
    } else if (selectedMetric === "branch") {
        // Show sales reps from selected branches
        filteredData = userSalesData.filter(rep => selectedBranches.includes(rep.branch_id));
        displayLabel = `${selectedBranches.length} Branch${selectedBranches.length > 1 ? "es" : ""}`;
        totalSales = filteredData.reduce((sum, rep) => sum + rep.total_sales, 0);
    } else if (selectedMetric === "sales-rep") {
        // Show selected sales representatives
        if (selectedSalesReps.length === 0) {
            filteredData = [];
            displayLabel = "No sales reps selected";
        } else {
            filteredData = userSalesData.filter(rep => selectedSalesReps.includes(rep.user_id));
            displayLabel = `${selectedSalesReps.length} Sales Rep${selectedSalesReps.length > 1 ? "s" : ""}`;
            totalSales = filteredData.reduce((sum, rep) => sum + rep.total_sales, 0);
        }
    }

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
                            <p className="text-xs font-semibold text-gray-700 mb-2">Select Branches:</p>
                            <div className="space-y-2">
                                {branches.map(branch => (
                                    <label key={branch.id} className="flex items-center text-sm cursor-pointer">
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
                            <p className="text-xs font-semibold text-gray-700 mb-2">Select Sales Representatives:</p>
                            <div className="space-y-2">
                                {allSalesReps.map(rep => (
                                    <label key={rep.user_id} className="flex items-center text-sm cursor-pointer">
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
                        <p className="text-xs text-gray-600">Total Sales - {displayLabel}</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            ${totalSales.toLocaleString()}
                        </p>
                    </div>

                    {/* Chart */}
                    <div className="w-full h-64 sm:h-80">
                        {filteredData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
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
                                    <Bar dataKey="total_sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
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
