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
import { fetchCompanySales, fetchUserSales } from "../services/salesService";
import PropTypes from "prop-types";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const SalesChart = ({ user }) => {
    const [companySales, setCompanySales] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return; 

        async function fetchSalesData() {
            setLoading(true);
            try {
                const [companyData, userData] = await Promise.all([
                    fetchCompanySales().catch(() => Array(12).fill(0)),
                    fetchUserSales(user.id).catch(() => Array(12).fill(0))
                ]);

                setCompanySales(companyData);
                setUserSales(userData);
            } catch (error) {
                console.error("Error fetching sales data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSalesData();
    }, [user]);

    if (loading) return <p className="text-center text-gray-600">Loading Sales Data...</p>;

    const data = {
        labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        datasets: [
            {
                label: "Company Sales",
                data: companySales,
                fill: false,
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)",
                tension: 0.1,
            },
            {
                label: `${user.first_name}'s Sales`,
                data: userSales,
                fill: false,
                borderColor: "rgba(255,99,132,1)",
                backgroundColor: "rgba(255,99,132,0.2)",
                tension: 0.1,
            }
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                enabled: true,
            },
        },
    };

    return (
        <div style={{ maxWidth: "700px", margin: "auto" }}>
            <h3 className="text-xl font-bold text-center mb-4">Sales Overview</h3>
            <Line data={data} options={options} />
        </div>
    );
};

SalesChart.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired
    }).isRequired,
};

export default SalesChart;
