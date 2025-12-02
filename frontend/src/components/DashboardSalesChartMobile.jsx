import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PropTypes from "prop-types";
import {
    fetchCompanySales,
    fetchUserSales,
    fetchBranchSales,
    fetchBranchUsersSales,
} from "../services/salesService";
import { filterSalesRepsByRole } from "../utils/salesDataProcessor";

const DashboardSalesChartMobile = ({ userData, allSalesReps }) => {
    const [selectedMetric, setSelectedMetric] = useState("company");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedBranches, setSelectedBranches] = useState(
        userData?.branch_id ? [userData.branch_id] : []
    );
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [showRepDropdown, setShowRepDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    // Sales data from API
    const [companySalesData, setCompanySalesData] = useState([]);
    const [userSalesData, setUserSalesData] = useState([]);
    const [branchSalesData, setBranchSalesData] = useState({});
    const [branchUsersSalesData, setBranchUsersSalesData] = useState({});
    const [loading, setLoading] = useState(false);

    // Filter sales reps to only show those with "Sales Representative" role
    const salesRepresentatives = useMemo(
        () => filterSalesRepsByRole(allSalesReps),
        [allSalesReps]
    );

    // Get branch names from allSalesReps
    const branches = useMemo(() => {
        const branchMap = new Map();
        allSalesReps.forEach(rep => {
            if (rep.branch_id && rep.branch_name) {
                if (!branchMap.has(rep.branch_id)) {
                    branchMap.set(rep.branch_id, {
                        id: rep.branch_id,
                        name: rep.branch_name,
                    });
                }
            }
        });
        return Array.from(branchMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [allSalesReps]);

    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear, currentYear - 1, currentYear - 2];
    }, []);

    // Fetch company sales data
    useEffect(() => {
        const loadCompanySales = async () => {
            setLoading(true);
            try {
                const data = await fetchCompanySales(selectedYear);
                setCompanySalesData(data);
            } catch (error) {
                console.error("❌ Error loading company sales:", error);
                setCompanySalesData([]);
            } finally {
                setLoading(false);
            }
        };

        if (selectedMetric === "company") {
            loadCompanySales();
        }
    }, [selectedYear, selectedMetric]);

    // Fetch current user sales data
    useEffect(() => {
        const loadUserSales = async () => {
            setLoading(true);
            try {
                if (userData?.user_id) {
                    const data = await fetchUserSales(userData.user_id, selectedYear);
                    setUserSalesData(data);
                }
            } catch (error) {
                console.error("❌ Error loading user sales:", error);
                setUserSalesData([]);
            } finally {
                setLoading(false);
            }
        };

        if (selectedMetric === "company" && userData?.user_id) {
            loadUserSales();
        }
    }, [selectedYear, selectedMetric, userData?.user_id]);

    // Fetch branch sales data
    useEffect(() => {
        const loadBranchSales = async () => {
            setLoading(true);
            try {
                const data = await fetchBranchSales(selectedYear);
                setBranchSalesData(data);
            } catch (error) {
                console.error("❌ Error loading branch sales:", error);
                setBranchSalesData({});
            } finally {
                setLoading(false);
            }
        };

        if (selectedMetric === "branch") {
            loadBranchSales();
        }
    }, [selectedYear, selectedMetric]);

    // Fetch sales reps data (for selected branches)
    useEffect(() => {
        const loadBranchUsersSales = async () => {
            if (selectedBranches.length === 0) return;

            setLoading(true);
            try {
                const allData = {};
                for (const branchId of selectedBranches) {
                    const data = await fetchBranchUsersSales(branchId, selectedYear);
                    allData[branchId] = data;
                }
                setBranchUsersSalesData(allData);
            } catch (error) {
                console.error("❌ Error loading branch users sales:", error);
                setBranchUsersSalesData({});
            } finally {
                setLoading(false);
            }
        };

        if (selectedMetric === "branch" && selectedBranches.length > 0) {
            loadBranchUsersSales();
        }
    }, [selectedYear, selectedMetric, selectedBranches]);

    // Convert API data to chart format (month names + sales values)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = useMemo(() => {
        let dataToChart = [];
        let displayLabel = "";
        let totalSales = 0;

        if (selectedMetric === "company") {
            // Company view: Company average + current user
            if (companySalesData.length === 12 && userSalesData.length === 12) {
                dataToChart = monthNames.map((month, index) => ({
                    month,
                    "Company Total": companySalesData[index] || 0,
                    [userData?.first_name || "You"]: userSalesData[index] || 0,
                }));
                displayLabel = "Company Wide Sales";
                totalSales = companySalesData.reduce((a, b) => a + b, 0);
            }
        } else if (selectedMetric === "branch") {
            // Branch view: Show selected branches
            if (selectedBranches.length === 0) {
                displayLabel = "No branches selected";
            } else {
                // Get data for selected branches
                const selectedBranchNames = selectedBranches
                    .map(id => branches.find(b => b.id === id)?.name)
                    .filter(Boolean);

                if (selectedBranchNames.length > 0) {
                    dataToChart = monthNames.map((month, index) => {
                        const monthData = { month };
                        selectedBranchNames.forEach(branchName => {
                            monthData[branchName] = branchSalesData[branchName]?.[index] || 0;
                        });
                        return monthData;
                    });

                    displayLabel = `${selectedBranches.length} Branch${selectedBranches.length > 1 ? "es" : ""}`;
                    selectedBranchNames.forEach(branchName => {
                        totalSales += (branchSalesData[branchName] || []).reduce((a, b) => a + b, 0);
                    });
                }
            }
        } else if (selectedMetric === "sales-rep") {
            // Sales Rep view: Show selected sales reps
            if (selectedSalesReps.length === 0) {
                displayLabel = "No sales reps selected";
            } else {
                // Build chart data with selected reps
                const selectedRepData = {};
                selectedSalesReps.forEach(repId => {
                    const rep = salesRepresentatives.find(r => r.user_id === repId);
                    if (rep) {
                        selectedRepData[rep.first_name] = rep;
                    }
                });

                dataToChart = monthNames.map((month, index) => {
                    const monthData = { month };
                    Object.entries(selectedRepData).forEach(([name, rep]) => {
                        monthData[name] = 0; // Placeholder - would need individual rep sales data
                    });
                    return monthData;
                });

                displayLabel = `${selectedSalesReps.length} Sales Rep${selectedSalesReps.length > 1 ? "s" : ""}`;
            }
        }

        return { data: dataToChart, label: displayLabel, total: totalSales };
    }, [
        selectedMetric,
        companySalesData,
        userSalesData,
        branchSalesData,
        selectedBranches,
        selectedSalesReps,
        monthNames,
        userData,
        branches,
        salesRepresentatives,
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
                            ${chartData.total.toLocaleString()}
                        </p>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center h-64 sm:h-80 text-gray-500">
                            <p>Loading sales data...</p>
                        </div>
                    )}

                    {/* Chart */}
                    {!loading && (
                        <div className="w-full h-64 sm:h-80">
                            {chartData.data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
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
                                                    dataKey="Company Total"
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
                                        {selectedMetric === "branch" &&
                                            selectedBranches.map((branchId, index) => {
                                                const branch = branches.find(b => b.id === branchId);
                                                return (
                                                    <Line
                                                        key={branchId}
                                                        type="monotone"
                                                        dataKey={branch?.name}
                                                        stroke={
                                                            ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][
                                                                index % 4
                                                            ]
                                                        }
                                                        dot={false}
                                                        strokeWidth={2}
                                                    />
                                                );
                                            })}
                                        {selectedMetric === "sales-rep" &&
                                            selectedSalesReps.map((repId, index) => {
                                                const rep = salesRepresentatives.find(
                                                    r => r.user_id === repId
                                                );
                                                return (
                                                    <Line
                                                        key={repId}
                                                        type="monotone"
                                                        dataKey={rep?.first_name || `Rep ${repId}`}
                                                        stroke={
                                                            ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"][
                                                                index % 4
                                                            ]
                                                        }
                                                        dot={false}
                                                        strokeWidth={2}
                                                    />
                                                );
                                            })}
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                    No data available
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

DashboardSalesChartMobile.propTypes = {
    userData: PropTypes.object,
    allSalesReps: PropTypes.array.isRequired,
};

export default DashboardSalesChartMobile;
