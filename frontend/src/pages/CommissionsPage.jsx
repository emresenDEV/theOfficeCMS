import { useEffect, useState } from "react";
import {
    fetchCurrentMonthCommissions,
    fetchCurrentYearCommissions,
    fetchLastYearCommissions,
    fetchAllYearsCommissions,
    fetchProjectedCommissions,
    fetchMonthlyCommissions,
    fetchWeeklyCommissions
} from "../services/commissionsService";
import CommissionsChart from "../components/CommissionsChart";
import SummaryCards from "../components/SummaryCards";
import Filters from "../components/Filters";
import RelatedAccounts from "../components/RelatedAccounts";
import { useTheme } from "../components/ThemeContext";
import PropTypes from "prop-types";

const CommissionsPage = ({ user }) => {
    const { theme } = useTheme();
    const [commissions, setCommissions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [yearRange, setYearRange] = useState([new Date().getFullYear()]);
    const [viewMode, setViewMode] = useState("yearly");
    const [fromYear, setFromYear] = useState(new Date().getFullYear() - 4);
    const [toYear, setToYear] = useState(new Date().getFullYear());

    // Define state for commission values
    const [currentMonthCommission, setCurrentMonthCommission] = useState(0);
    const [currentYearCommission, setCurrentYearCommission] = useState(0);
    const [lastYearCommission, setLastYearCommission] = useState(0);
    const [projectedCommission, setProjectedCommission] = useState(0);
    const [formattedMonthlyData, setFormattedMonthlyData] = useState(Array(12).fill(0));

    useEffect(() => {
        if (user?.id) {
            fetchMonthlyCommissions(user.id, selectedYear)
                .then(data => {
                    console.log("📥 Fetched Monthly Commissions API Response:", data);
                    setFormattedMonthlyData(Array.isArray(data) ? data : Array(12).fill(0));
                })
                .catch(error => console.error("❌ Error Fetching Monthly Commissions:", error));
        }

        console.log("🚀 Fetching commissions data for user ID:", user.id);

        Promise.all([
            fetchCurrentMonthCommissions(user.id),
            fetchCurrentYearCommissions(user.id),
            fetchLastYearCommissions(user.id),
            fetchProjectedCommissions(user.id),
            fetchMonthlyCommissions(user.id, selectedYear),
            fetchAllYearsCommissions(user.id)
        ]).then(([currentMonth, currentYear, lastYear, projected, allCommissions, allYears]) => {
            console.log("✅ API Responses Received:", { currentMonth, currentYear, lastYear, projected, allYears });

            setCurrentMonthCommission(currentMonth.total_commissions || 0);
            setCurrentYearCommission(currentYear.total_commissions || 0);
            setLastYearCommission(lastYear.total_commissions || 0);
            setProjectedCommission(projected.projected_commissions || 0);
            setCommissions(allCommissions);

            // ✅ Ensure yearRange contains all available years
            if (Array.isArray(allYears) && allYears.length > 0) {
                setYearRange(prevYears => [...new Set([...prevYears, ...allYears])].sort((a, b) => a - b));
            } else {
                console.warn("⚠️ API failed or returned empty, keeping previous year range:", yearRange);
            }
        }).catch(error => console.error("❌ Error Fetching Commissions Data:", error));
    }, [user?.id, selectedYear, viewMode]);

    // ✅ Fetch ALL available years for dropdown
    useEffect(() => {
        if (user?.id) {
            fetchAllYearsCommissions(user.id)
                .then(data => {
                    console.log("📅 Fetched All Years API Response:", data);

                    setYearRange(prevYears => {
                        if (Array.isArray(data) && data.length > 0) {
                            const updatedYears = [...new Set([...prevYears, ...data])].sort((a, b) => a - b);
                            console.log("✅ Ensuring Year Range Stays Consistent:", updatedYears);
                            return updatedYears;
                        }
                        console.warn("⚠️ API failed or returned empty, keeping previous year range:", prevYears);
                        return prevYears; // ✅ Keeps previous state instead of overwriting
                    });
                })
                .catch(error => console.error("❌ Error Fetching All Years:", error));
        }
    }, [user?.id]);

    // ✅ Fetch Weekly Data Based on Selected Month and Year
    useEffect(() => {
        if (user?.id && viewMode === "weekly") {
            fetchWeeklyCommissions(user.id, selectedYear, selectedMonth)
                .then(data => {
                    console.log("📥 Fetched Weekly Commissions API Response:", data);
                    setCommissions(Array.isArray(data) ? data : []);
                })
                .catch(error => console.error("❌ Error Fetching Weekly Commissions:", error));
        }
    }, [user?.id, selectedYear, selectedMonth, viewMode]);

    // ✅ Get Current Year Commissions
    useEffect(() => {
        if (user?.id && viewMode === "yearly") {
            fetchCurrentYearCommissions(user.id)
                .then(data => {
                    console.log("📥 Fetched Yearly Commissions API Response:", data);
                    setCurrentYearCommission(data.total_commissions || 0);
                })
                .catch(error => console.error("❌ Error Fetching Yearly Commissions:", error));
        }
    }, [user?.id, viewMode]);

    // ✅ Debugging: View Mode Changes
    useEffect(() => {
        console.log("🖥️ View Mode Changed to:", viewMode);
        console.log("📊 Current Year Range Before View Change:", yearRange);
    }, [viewMode]);

    // ✅ Format Yearly Data
    const filteredYears = yearRange.filter(year => year >= fromYear && year <= toYear);
    const formattedYearlyData = filteredYears.reduce((acc, year) => {
        acc[year] = year === selectedYear ? currentYearCommission : 0;
        return acc;
    }, {});

    // ✅ Format Weekly Data
    const numWeeks = Math.ceil(new Date(selectedYear, selectedMonth, 0).getDate() / 7);
    const formattedWeeklyData = Array.from({ length: numWeeks }, (_, i) => {
        return i < commissions.length ? Number(commissions[i] || 0).toFixed(2) : "0.00";
    });

    console.log("📊 Chart Data:", {
        formattedYearlyData,
        formattedMonthlyData,
        formattedWeeklyData
    });

    return (
        <div className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} p-6`}>
            <div className="flex min-h-screen">
                <div className="flex-1 ml-64">
                    <h1 className="text-2xl font-bold text-dark-cornflower dark:text-blue-300">Commissions</h1>

                    {/* Filters */}
                    <Filters
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        fromYear={fromYear}
                        setFromYear={setFromYear}
                        toYear={toYear}
                        setToYear={setToYear}
                        yearRange={yearRange}
                    />

                    {/* Summary */}
                    <SummaryCards
                        currentMonthCommission={currentMonthCommission}
                        currentYearCommission={currentYearCommission}
                        lastYearCommission={lastYearCommission}
                        projectedCommission={projectedCommission}
                    />

                    {/* Bar Chart */}
                    <CommissionsChart
                        viewMode={viewMode}
                        pastFiveYears={yearRange.slice(-5)}
                        yearlyData={formattedYearlyData}
                        monthlyData={formattedMonthlyData}
                        weeklyData={formattedWeeklyData}
                        numWeeks={numWeeks}
                    />

                    {/* Related Accounts & Invoices */}
                    <RelatedAccounts commissions={commissions} />
                </div>
            </div>
        </div>
    );
};



CommissionsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        commission_rate: PropTypes.number,
        receives_commission: PropTypes.bool,
    }).isRequired,
    commissions: PropTypes.arrayOf(
        PropTypes.shape({
            commission_id: PropTypes.number.isRequired,
            user_id: PropTypes.number.isRequired,
            invoice_id: PropTypes.number, // 🔹 Can be `null` if no invoice
            commission_amount: PropTypes.number.isRequired,
            date_paid: PropTypes.string.isRequired, // 🔹 Ensure this is always a string (from API)
            invoice: PropTypes.shape({
                invoice_id: PropTypes.number,
                final_total: PropTypes.number,
                status: PropTypes.string,
                paid: PropTypes.bool,
                date_paid: PropTypes.string,
                account: PropTypes.shape({
                    account_id: PropTypes.number,
                    business_name: PropTypes.string,
                    contact_name: PropTypes.string,
                    email: PropTypes.string,
                    phone_number: PropTypes.string,
                }),
            }),
        })
    ),
};

export default CommissionsPage;
