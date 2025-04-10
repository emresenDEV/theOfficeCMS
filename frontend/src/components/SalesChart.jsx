import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
import { 
    fetchCompanySales, 
    fetchUserSales, 
    fetchBranchSales, 
    fetchBranchUsersSales 
} from "../services/salesService";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid"; 
import PropTypes from "prop-types";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();
const COLORS = ["red", "blue", "green", "purple", "orange", "teal", "pink", "yellow", "gray"];

const SalesChart = ({ userProfile }) => {
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState("company");
    const [companySales, setCompanySales] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [branchSales, setBranchSales] = useState({});
    const [branchUsersSales, setBranchUsersSales] = useState({});
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.branch_id) return;

        async function fetchSalesData() {
            setLoading(true);
            try {
                const year = selectedYear;
                const branchId = userProfile.branch_id;

                const [company, user, branches, reps] = await Promise.all([
                    fetchCompanySales(year),
                    fetchUserSales(userProfile.user_id, year),
                    fetchBranchSales(year),
                    fetchBranchUsersSales(branchId, year)
                ]);

                setCompanySales(company || Array(12).fill(0));
                setUserSales(user || Array(12).fill(0));
                setBranchSales(branches || {});
                setBranchUsersSales(reps || {});

                const branchNames = Object.keys(branches || {});
                setAllBranches(branchNames);

                if (!branchNames.includes(selectedBranch)) {
                    setSelectedBranch(branchNames[0] || "");
                }

                const filteredReps = Object.entries(reps || {})
                    .filter(([_, rep]) => rep.role_id === 3 && rep.branch_id === branchId)
                    .map(([name, rep]) => ({ name, sales: rep.sales || Array(12).fill(0) }));

                setSalesReps(filteredReps);
            } catch (err) {
                console.error("❌ Error loading sales chart data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchSalesData();
    }, [userProfile, selectedYear]);

    const renderChartData = () => {
        if (activeTab === "company") {
            return [
                { label: "Company-Wide Sales", data: companySales, borderColor: "blue" },
                { label: `${userProfile.first_name}'s Sales`, data: userSales, borderColor: "red" }
            ];
        } else if (activeTab === "branch") {
            return selectedBranch ? [{
                label: `${selectedBranch} Sales`,
                data: branchSales[selectedBranch] || Array(12).fill(0),
                borderColor: "green"
            }] : [];
        } else {
            return selectedSalesReps.map((rep, i) => {
                const found = salesReps.find(r => r.name === rep);
                return {
                    label: rep,
                    data: found?.sales || Array(12).fill(0),
                    borderColor: COLORS[i % COLORS.length]
                };
            });
        }
    };

    if (!userProfile || !userProfile.branch_id) return <p className="text-center text-gray-600">Waiting for user profile data...</p>;
    if (loading) return <p className="text-center text-gray-600">Loading Sales Data...</p>;

    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">📈 Sales Chart</h3>
                <button onClick={() => setIsCollapsed(prev => !prev)}>
                    {isCollapsed ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronUpIcon className="w-6 h-6 text-gray-500" />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex justify-start items-center mb-4">
                        <label htmlFor="yearSelect" className="mr-2 text-lg font-bold">Select Year:</label>
                        <select
                            id="yearSelect"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="border p-2 rounded-md text-lg"
                        >
                            {[...Array(5)].map((_, i) => {
                                const year = CURRENT_YEAR - i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>

                    <div className="flex space-x-4 mb-4">
                        <button className={`px-4 py-2 rounded-md text-lg ${activeTab === "company" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("company")}>Company</button>
                        <button className={`px-4 py-2 rounded-md text-lg ${activeTab === "branch" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("branch")}>Branch</button>
                        <button className={`px-4 py-2 rounded-md text-lg ${activeTab === "branchUsers" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("branchUsers")}>{userProfile.branch_name} Sales</button>
                    </div>

                    {activeTab === "branch" && (
                        <div className="mb-4">
                            <label htmlFor="branchSelect" className="font-bold text-lg">Select Branch:</label>
                            <select
                                id="branchSelect"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="border p-2 rounded-md text-lg"
                            >
                                {allBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                            </select>
                        </div>
                    )}

                    {activeTab === "branchUsers" && (
                        <div className="mb-4">
                            <p className="font-bold text-lg">Select Sales Representatives:</p>
                            <div className="flex flex-wrap">
                                {salesReps.map((rep, i) => (
                                    <button
                                        key={rep.name}
                                        className={`m-1 px-3 py-1 rounded-md ${selectedSalesReps.includes(rep.name) ? "bg-purple-500 text-white" : "bg-gray-200"}`}
                                        onClick={() => setSelectedSalesReps(prev => prev.includes(rep.name) ? prev.filter(r => r !== rep.name) : [...prev, rep.name])}
                                    >
                                        {rep.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Line data={{ labels: MONTH_LABELS, datasets: renderChartData() }} options={{ responsive: true, plugins: { legend: { display: true }, tooltip: { enabled: true } } }} />
                </>
            )}
        </div>
    );
};

SalesChart.propTypes = {
    userProfile: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        branch_id: PropTypes.number.isRequired,
        branch_name: PropTypes.string.isRequired,
        role_id: PropTypes.number.isRequired,
        role_name: PropTypes.string.isRequired,
        department_id: PropTypes.number.isRequired,
        department_name: PropTypes.string.isRequired,
    }).isRequired,
};

export default SalesChart;
