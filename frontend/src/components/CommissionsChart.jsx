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

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CommissionsChart = ({
    viewMode,
    pastFiveYears,
    yearlyData,
    monthlyData,
    weeklyData,
    selectedYear,
    selectedMonth
}) => {

    // ✅ Dynamically calculate the number of weeks in the month
    function getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const used = firstDay.getDay() + lastDay.getDate();
        return Math.ceil(used / 7);
    }

    const weeksInMonth = Math.min(getWeeksInMonth(selectedYear, selectedMonth), 5);
    const weekLabels = Array.from({ length: weeksInMonth }, (_, i) => `Week ${i + 1}`);

    // 🎯 CHART DATA SETUP
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
                data: monthlyData.map(value => value || 0),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
        ],
    };

    const weeklyChartData = {
        labels: weekLabels,
        datasets: [
            {
                label: "Weekly Commissions ($)",
                data: weeklyData.map(value => Number(value || 0).toFixed(2)),
                backgroundColor: "rgba(255, 159, 64, 0.6)",
            },
        ],
    };

    const chartData =
        viewMode === "yearly"
            ? yearlyChartData
            : viewMode === "monthly"
            ? monthlyChartData
            : weeklyChartData;

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

    // Debug logging
    console.log("📊 Chart Data Before Render:", {
        viewMode,
        selectedYear,
        selectedMonth,
        weeklyData,
        weekLabels,
        chartData,
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
    selectedYear: PropTypes.number.isRequired,
    selectedMonth: PropTypes.number.isRequired,
};

export default CommissionsChart;
