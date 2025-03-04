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
import { fetchCompanySales, fetchUserSales, fetchBranchSales, fetchBranchUsersSales } from "../services/salesService";
import PropTypes from "prop-types";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CURRENT_YEAR = new Date().getFullYear();

const SalesChart = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState("company");
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [companySales, setCompanySales] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [branchSales, setBranchSales] = useState({});
    const [branchUsersSales, setBranchUsersSales] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.branch_id) {
            console.warn("⚠️ SalesChart: Waiting for `branch_id` before fetching data...");
            return;
        }
    
        async function fetchSalesData() {
            setLoading(true);
            try {
                const [companyData, userData, branchData, branchUsersData] = await Promise.all([
                    fetchCompanySales(selectedYear),
                    fetchUserSales(userProfile.user_id, selectedYear),
                    fetchBranchSales(selectedYear),
                    fetchBranchUsersSales(userProfile.branch_id, selectedYear)
                ]);
    
                console.log("✅ API Responses:", { companyData, userData, branchData, branchUsersData });
    
                setCompanySales(companyData || Array(12).fill(0));
                setUserSales(userData || Array(12).fill(0));
                setBranchSales(branchData || {});
                setBranchUsersSales(branchUsersData || {});
            } catch (error) {
                console.error("❌ Error fetching sales data:", error);
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
            return userProfile.branch_id
                ? [{ label: `${userProfile.branch_name} Sales`, data: branchSales[userProfile.branch_id] || Array(12).fill(0), borderColor: "green" }]
                : [];
        } else {
            return Object.keys(branchUsersSales).map(name => ({
                label: `${name}'s Sales`,
                data: branchUsersSales[name] || Array(12).fill(0),
                borderColor: name === userProfile.first_name ? "red" : "gray"
            }));
        }
    };

    if (!userProfile || !userProfile.branch_id) {
        return <p className="text-center text-gray-600">Waiting for user profile data...</p>;
    }

    if (loading) return <p className="text-center text-gray-600">Loading Sales Data...</p>;

    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <div className="mb-4">
                <label htmlFor="yearSelect" className="mr-2">Select Year:</label>
                <select
                    id="yearSelect"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border p-2 rounded-md"
                >
                    {[...Array(5)].map((_, i) => {
                        const year = CURRENT_YEAR - i;
                        return <option key={year} value={year}>{year}</option>;
                    })}
                </select>
            </div>

            <div className="flex space-x-4 mb-4">
                <button className={`px-4 py-2 rounded-md ${activeTab === "company" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("company")}>
                    Company-Wide Sales
                </button>

                <button className={`px-4 py-2 rounded-md ${activeTab === "branch" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("branch")}>
                    Branch-Specific Sales
                </button>

                <button className={`px-4 py-2 rounded-md ${activeTab === "branchUsers" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => setActiveTab("branchUsers")}>
                    {userProfile.branch_name ? `${userProfile.branch_name} Sales` : "Your Branch Sales"}
                </button>
            </div>

            <Line data={{ labels: MONTH_LABELS, datasets: renderChartData() }} options={{ responsive: true, plugins: { legend: { display: true }, tooltip: { enabled: true } } }} />
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
