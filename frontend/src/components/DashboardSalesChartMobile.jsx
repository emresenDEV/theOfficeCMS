import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import PropTypes from "prop-types";

const DashboardSalesChartMobile = ({ userData, userSalesData, allSalesReps }) => {
    const [selectedMetric, setSelectedMetric] = useState("company");
    const [selectedRep, setSelectedRep] = useState(null);

    // Filter data based on selected rep
    const filteredData = selectedRep
        ? userSalesData.filter(rep => rep.user_id === selectedRep)
        : userSalesData;

    // Get company, branch, and scranton totals
    const companyTotal = userSalesData.reduce((sum, rep) => sum + rep.total_sales, 0);
    const branchTotal = userSalesData
        .filter(rep => rep.branch_id === userData?.branch_id)
        .reduce((sum, rep) => sum + rep.total_sales, 0);
    const scrantonTotal = userSalesData
        .filter(rep => rep.branch_id === 1) // Scranton is branch_id 1
        .reduce((sum, rep) => sum + rep.total_sales, 0);

    const metricData = {
        company: { value: companyTotal, label: "Company" },
        branch: { value: branchTotal, label: "Branch" },
        scranton: { value: scrantonTotal, label: "Scranton" },
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Sales Overview</h2>

            {/* Metric Buttons - Smaller on Mobile */}
            <div className="flex gap-2 mb-4 flex-wrap">
                <button
                    onClick={() => setSelectedMetric("company")}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                        selectedMetric === "company"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Company
                </button>
                <button
                    onClick={() => setSelectedMetric("branch")}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                        selectedMetric === "branch"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Branch
                </button>
                <button
                    onClick={() => setSelectedMetric("scranton")}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded transition ${
                        selectedMetric === "scranton"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    Scranton
                </button>
            </div>

            {/* Current Metric Display */}
            <div className="bg-blue-50 rounded p-3 mb-4 border-l-4 border-blue-600">
                <p className="text-xs text-gray-600">Total Sales - {metricData[selectedMetric].label}</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    ${metricData[selectedMetric].value.toLocaleString()}
                </p>
            </div>

            {/* Sales Rep Selector - Dropdown on Mobile */}
            <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Filter by Sales Rep
                </label>
                <select
                    value={selectedRep || ""}
                    onChange={(e) => setSelectedRep(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full text-sm border rounded px-3 py-2 bg-white"
                >
                    <option value="">All Representatives</option>
                    {allSalesReps.map((rep) => (
                        <option key={rep.user_id} value={rep.user_id}>
                            {rep.first_name} {rep.last_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Scaled Down Chart */}
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
        </div>
    );
};

DashboardSalesChartMobile.propTypes = {
    userData: PropTypes.object,
    userSalesData: PropTypes.array.isRequired,
    allSalesReps: PropTypes.array.isRequired,
};

export default DashboardSalesChartMobile;
