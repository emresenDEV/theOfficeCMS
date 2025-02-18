import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import PropTypes from "prop-types";

// ✅ Register required elements for ChartJS
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CommissionsChart = ({ viewMode, pastFiveYears, yearlyData, monthlyData, weeklyData, numWeeks }) => {
    // **1️⃣ Format Data for Each View Mode**
    const yearlyChartData = {
        labels: pastFiveYears,
        datasets: [
            {
                label: "Total Commissions ($)",
                data: pastFiveYears.map(year => yearlyData[year] || 0),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
        ],
    };

    const monthlyChartData = {
        labels: Array.from({ length: 12 }, (_, i) =>
            new Date(0, i).toLocaleString("default", { month: "long" })
        ),
        datasets: [
            {
                label: "Monthly Commissions ($)",
                data: monthlyData.length > 0 ? monthlyData.map(value => value || 0) : Array(12).fill(0),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
        ],
    };

    const weeklyChartData = {
        labels: Array.from({ length: numWeeks || 4 }, (_, i) => `Week ${i + 1}`), // ✅ Dynamically set week labels
        datasets: [
            {
                label: "Weekly Commissions ($)",
                data: weeklyData.length > 0
                    ? weeklyData.map(value => Number(value || 0).toFixed(2))
                    : Array(numWeeks || 4).fill("0.00"), 
                backgroundColor: "rgba(255, 159, 64, 0.6)",
            },
        ],
    };
    

    // **2️⃣ Select Chart Data Based on View Mode**
    const chartData = viewMode === "yearly"
        ? yearlyChartData
        : viewMode === "monthly"
        ? monthlyChartData
        : weeklyChartData;

    // **3️⃣ Chart Options**
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => `$${tooltipItem.raw}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => `$${value}`,
                },
            },
        },
    };

    // **🔍 Debugging Chart Data Before Render**
    console.log("📊 Chart Data Before Render:", {
        viewMode,
        pastFiveYears,
        yearlyData,
        monthlyData,
        weeklyData,
        numWeeks,
        selectedChartData: chartData,
    });

    return (
        <div className="h-80 w-full">
            <Bar data={chartData} options={options} />
        </div>
    );
};

CommissionsChart.propTypes = {
    viewMode: PropTypes.string.isRequired,
    pastFiveYears: PropTypes.arrayOf(PropTypes.number).isRequired,
    yearlyData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    monthlyData: PropTypes.arrayOf(PropTypes.number).isRequired,
    weeklyData: PropTypes.arrayOf(PropTypes.number).isRequired,
    numWeeks: PropTypes.number,
};

export default CommissionsChart;
