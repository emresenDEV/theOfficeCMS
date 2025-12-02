import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PropTypes from "prop-types";
import {
    fetchCompanySales,
    fetchUserSales,
    fetchBranchSales,
    fetchBranchUsersSales,
} from "../services/salesService";

const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const DashboardSalesChartMobile = ({ userData, allSalesReps }) => {
    const [activeTab, setActiveTab] = useState("company");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Sales data from API
    const [companySales, setCompanySales] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [branchSales, setBranchSales] = useState({});
    const [branchUsersSales, setBranchUsersSales] = useState({});
    const [loading, setLoading] = useState(false);

    // Get unique branches from allSalesReps
    const allBranches = useMemo(() => {
        const branchMap = new Map();
        allSalesReps.forEach(rep => {
            if (rep.branch_id && rep.branch_name) {
                if (!branchMap.has(rep.branch_id)) {
                    branchMap.set(rep.branch_id, rep.branch_name);
                }
            }
        });
        return Array.from(branchMap.values()).sort();
    }, [allSalesReps]);


    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear, currentYear - 1, currentYear - 2];
    }, []);

    // Fetch company and user sales
    useEffect(() => {
        const loadCompanyData = async () => {
            setLoading(true);
            try {
                const company = await fetchCompanySales(selectedYear);
                setCompanySales(company || Array(12).fill(0));

                if (userData?.user_id) {
                    const user = await fetchUserSales(userData.user_id, selectedYear);
                    setUserSales(user || Array(12).fill(0));
                }
            } catch (error) {
                console.error("❌ Error loading company sales:", error);
                setCompanySales(Array(12).fill(0));
                setUserSales(Array(12).fill(0));
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === "company") {
            loadCompanyData();
        }
    }, [selectedYear, activeTab, userData?.user_id]);

    // Fetch branch sales
    useEffect(() => {
        const loadBranchData = async () => {
            setLoading(true);
            try {
                const branches = await fetchBranchSales(selectedYear);
                setBranchSales(branches || {});

                // Initialize selected branch if not set
                if (!selectedBranch && branches && Object.keys(branches).length > 0) {
                    setSelectedBranch(Object.keys(branches)[0]);
                }
            } catch (error) {
                console.error("❌ Error loading branch sales:", error);
                setBranchSales({});
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === "branch") {
            loadBranchData();
        }
    }, [selectedYear, activeTab, selectedBranch]);

    // Fetch branch users sales (for sales reps)
    useEffect(() => {
        const loadBranchUsersData = async () => {
            if (!userData?.branch_id) return;
            setLoading(true);
            try {
                const reps = await fetchBranchUsersSales(userData.branch_id, selectedYear);
                setBranchUsersSales(reps || {});
            } catch (error) {
                console.error("❌ Error loading branch users sales:", error);
                setBranchUsersSales({});
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === "branchUsers") {
            loadBranchUsersData();
        }
    }, [selectedYear, activeTab, userData?.branch_id]);

    // Build chart data based on active tab
    const chartData = useMemo(() => {
        const data = MONTH_LABELS.map((label) => ({ month: label }));

        if (activeTab === "company") {
            // Company tab: Company sales + User sales
            data.forEach((item, i) => {
                item["Company Sales"] = companySales[i] || 0;
                item[userData?.first_name || "You"] = userSales[i] || 0;
            });
        } else if (activeTab === "branch" && selectedBranch) {
            // Branch tab: Selected branch sales
            const branchData = branchSales[selectedBranch] || Array(12).fill(0);
            data.forEach((item, i) => {
                item[selectedBranch] = branchData[i] || 0;
            });
        } else if (activeTab === "branchUsers") {
            // Sales reps tab: Selected sales reps
            selectedSalesReps.forEach(repName => {
                const repData = branchUsersSales[repName];
                if (repData && repData.sales) {
                    data.forEach((item, i) => {
                        item[repName] = repData.sales[i] || 0;
                    });
                }
            });
        }

        return data;
    }, [activeTab, companySales, userSales, branchSales, selectedBranch, branchUsersSales, selectedSalesReps, userData]);

    // Guard: Only render when we have necessary data
    if (!userData || !userData.user_id || !allSalesReps || allSalesReps.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-3">Sales Overview</h2>
                <p className="text-center text-gray-500">Loading sales data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-between items-center mb-4"
            >
                <h2 className="text-lg font-semibold">Sales Overview</h2>
                <span className="text-xl">{isCollapsed ? "+" : "−"}</span>
            </button>

            {!isCollapsed && (
                <>
                    {/* Year Selector */}
                    <div className="mb-4 flex gap-2 items-center">
                        <label className="text-sm font-semibold text-gray-700">Year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="text-sm px-2 py-1 border rounded bg-white"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        <button
                            onClick={() => {
                                setActiveTab("company");
                                setSelectedSalesReps([]);
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                activeTab === "company"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Company
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("branch");
                                setSelectedSalesReps([]);
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                activeTab === "branch"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Branch
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("branchUsers");
                                setSelectedBranch("");
                            }}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                                activeTab === "branchUsers"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            Sales Reps
                        </button>
                    </div>

                    {/* Branch Dropdown */}
                    {activeTab === "branch" && (
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Select Branch:</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full text-sm px-2 py-1 border rounded bg-white"
                            >
                                <option value="">-- Select a branch --</option>
                                {allBranches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Sales Reps Toggle Buttons */}
                    {activeTab === "branchUsers" && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Select Sales Representatives:</p>
                            <div className="flex flex-wrap gap-1">
                                {Object.keys(branchUsersSales).map((repName) => (
                                    <button
                                        key={repName}
                                        onClick={() => {
                                            setSelectedSalesReps(prev =>
                                                prev.includes(repName)
                                                    ? prev.filter(r => r !== repName)
                                                    : [...prev, repName]
                                            );
                                        }}
                                        className={`text-xs px-2 py-1 rounded transition ${
                                            selectedSalesReps.includes(repName)
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        {repName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <p>Loading sales data...</p>
                        </div>
                    )}

                    {/* Chart */}
                    {!loading && (
                        <div className="w-full h-64 sm:h-80">
                            {chartData.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#fff",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                fontSize: "11px",
                                            }}
                                            formatter={(value) => `$${value.toLocaleString()}`}
                                        />
                                        <Legend />
                                        {activeTab === "company" && (
                                            <>
                                                <Line
                                                    type="monotone"
                                                    dataKey="Company Sales"
                                                    stroke={COLORS[0]}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={userData?.first_name || "You"}
                                                    stroke={COLORS[1]}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                />
                                            </>
                                        )}
                                        {activeTab === "branch" && selectedBranch && (
                                            <Line
                                                type="monotone"
                                                dataKey={selectedBranch}
                                                stroke={COLORS[0]}
                                                dot={false}
                                                strokeWidth={2}
                                                isAnimationActive={false}
                                            />
                                        )}
                                        {activeTab === "branchUsers" &&
                                            selectedSalesReps.map((repName, index) => (
                                                <Line
                                                    key={repName}
                                                    type="monotone"
                                                    dataKey={repName}
                                                    stroke={COLORS[index % COLORS.length]}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                />
                                            ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

DashboardSalesChartMobile.propTypes = {
    userData: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string,
        branch_id: PropTypes.number,
    }).isRequired,
    allSalesReps: PropTypes.array.isRequired,
};

export default DashboardSalesChartMobile;
