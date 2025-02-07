import { useEffect, useState } from "react";
import { fetchCommissions } from "../services/api";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import PropTypes from "prop-types";

const CommissionsPage = ({ user }) => {
    const navigate = useNavigate();
    const [commissions, setCommissions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [yearRange, setYearRange] = useState([]);
    const [monthlyData, setMonthlyData] = useState(Array(12).fill(0));

    useEffect(() => {
        if (user?.id) {
            fetchCommissions(user.id, "year").then(data => {
                console.log("Commissions API Response:", data);
                setCommissions(data);

                const years = [...new Set(data.map(com => new Date(com.date_paid).getFullYear()))];
                setYearRange(years.length ? years.sort() : [new Date().getFullYear()]);

                const groupedData = Array(12).fill(0);
                data.forEach(com => {
                    const monthIndex = new Date(com.date_paid).getMonth();
                    groupedData[monthIndex] += com.commission_amount;
                });
                setMonthlyData(groupedData);
            }).catch(error => console.error("Error fetching commissions:", error));
        }
    }, [user?.id]);

    const filteredCommissions = commissions.filter(com => {
        const comDate = new Date(com.date_paid);
        return comDate.getMonth() + 1 === selectedMonth && comDate.getFullYear() === selectedYear;
    });

    const totalMonthlyCommission = filteredCommissions.reduce((sum, com) => sum + com.commission_amount, 0);
    const totalYearlyCommission = commissions.reduce((sum, com) => (
        new Date(com.date_paid).getFullYear() === selectedYear ? sum + com.commission_amount : sum
    ), 0);
    const totalLastYearCommission = commissions.reduce((sum, com) => (
        new Date(com.date_paid).getFullYear() === selectedYear - 1 ? sum + com.commission_amount : sum
    ), 0);

    const commissionsByAccount = filteredCommissions.reduce((acc, com) => {
        if (!acc[com.account_id]) acc[com.account_id] = { total: 0, invoices: [] };
        acc[com.account_id].total += com.commission_amount;
        acc[com.account_id].invoices.push(com);
        return acc;
    }, {});

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Commissions</h1>

                <div className="relative flex gap-4 mb-6">
            <div className="relative">
                <select
                    className="border p-2 relative w-40 bg-white z-50 shadow-lg"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                        </option>
                    ))}
                </select>
            </div>

            <div className="relative">
                <select
                    className="border p-2 relative w-40 bg-white z-50 shadow-lg"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {yearRange.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>


                <div className="flex justify-between mb-6">
                    <h2 className="text-xl font-semibold text-green-700">This Month: ${totalMonthlyCommission.toFixed(2)}</h2>
                    <h2 className="text-xl font-semibold text-blue-700">This Year: ${totalYearlyCommission.toFixed(2)}</h2>
                    <h2 className="text-xl font-semibold text-gray-700">Last Year: ${totalLastYearCommission.toFixed(2)}</h2>
                </div>

                {/* Fixed Size Bar Graph with $50 Increments */}
                <h2 className="text-xl font-semibold mb-4">Commission Earnings by Month</h2>
                <div className="h-80 w-full">
                    <Bar
                        data={{
                            labels: Array.from({ length: 12 }, (_, i) => 
                                new Date(0, i).toLocaleString("default", { month: "long" })
                            ),
                            datasets: [{
                                label: "Earnings ($)",
                                data: monthlyData,
                                backgroundColor: "rgba(54, 162, 235, 0.6)"
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 50, // $50 increments
                                        callback: value => `$${value}`
                                    }
                                }
                            }
                        }}
                    />
                </div>

                <h2 className="text-xl font-semibold mt-6">Commission Breakdown by Account</h2>
                {Object.entries(commissionsByAccount).length > 0 ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {Object.entries(commissionsByAccount).map(([accountId, { total, invoices }]) => (
                            <div key={accountId} className="border-b p-4">
                                <h3 className="text-lg font-bold">Account #{accountId}: ${total.toFixed(2)}</h3>
                                <ul className="ml-6 mt-2">
                                    {invoices.map(inv => (
                                        <li key={inv.invoice_id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md my-2">
                                            <span>Invoice #{inv.invoice_id} - ${inv.commission_amount.toFixed(2)}</span>
                                            <button
                                                className="bg-blue-500 text-white px-3 py-1 rounded"
                                                onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                                            >
                                                View Invoice
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-gray-600">No commissions found for this selection.</p>
                )}
            </div>
        </div>
    );
};

CommissionsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default CommissionsPage;
