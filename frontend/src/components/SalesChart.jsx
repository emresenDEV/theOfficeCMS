// SalesChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
Chart as ChartJS,
LineElement,
PointElement,
CategoryScale,
LinearScale,
Tooltip,
Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const SalesChart = () => {
const data = {
    labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    datasets: [
    {
        label: "Sales",
        data: [65, 59, 80, 81, 56],
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
    },
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
    <div style={{ maxWidth: "600px", margin: "auto" }}>
    <h3>Sales Overview</h3>
    <Line data={data} options={options} />
    </div>
);
};

export default SalesChart;