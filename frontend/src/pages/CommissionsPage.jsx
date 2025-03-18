import { useEffect, useState } from "react";
import {
    fetchCommissions,
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

    // Chart Data
    const [yearlyData, setYearlyData] = useState({});
    const [monthlyData, setMonthlyData] = useState(Array(12).fill(0));
    const [weeklyData, setWeeklyData] = useState(Array(4).fill(0));

    // Fetch all available years for filtering
    useEffect(() => {
        if (user?.id) {
            fetchAllYearsCommissions(user.id)
                .then(data => {
                    setYearRange(data.length ? [...new Set(data)].sort((a, b) => a - b) : [selectedYear]);
                })
                .catch(error => console.error("❌ Error Fetching All Years:", error));
        }
    }, [user?.id, selectedYear]);


// Fetch commissions and summary data
    useEffect(() => {
        if (!user?.id) return;

        console.log("🚀 Fetching commissions for user ID:", user.id);
        
        Promise.all([
            fetchCommissions(user.id),
            fetchCurrentMonthCommissions(user.id),
            fetchCurrentYearCommissions(user.id),
            fetchLastYearCommissions(user.id),
            fetchProjectedCommissions(user.id),
            fetchMonthlyCommissions(user.id, selectedYear),
            fetchWeeklyCommissions(user.id, selectedYear, selectedMonth),
        ])
        .then(([detailedCommissions, currentMonth, currentYear, lastYear, projected, monthly, weekly]) => {
            console.log("✅ API Responses Received:", { currentMonth, currentYear, lastYear, projected }); //debugging

            setCurrentMonthCommission(currentMonth.total_commissions || 0);
            setCurrentYearCommission(currentYear.total_commissions || 0);
            setLastYearCommission(lastYear.total_commissions || 0);
            setProjectedCommission(projected.projected_commissions || 0);

            setMonthlyData(monthly || Array(12).fill(0));
            setWeeklyData(weekly || Array(4).fill(0));

            // ✅ Filter out only paid invoices within the selected time period
            const filteredCommissions = detailedCommissions.filter(com => {
                if (!com.invoice?.date_paid || !com.invoice.paid) return false;

                const invoiceYear = new Date(com.invoice.date_paid).getFullYear();
                const invoiceMonth = new Date(com.invoice.date_paid).getMonth() + 1;

                if (viewMode === "yearly") return invoiceYear >= fromYear && invoiceYear <= toYear;
                if (viewMode === "monthly") return invoiceYear === selectedYear;
                if (viewMode === "weekly") return invoiceYear === selectedYear && invoiceMonth === selectedMonth;

                return false;
            });

            console.log("✅ Filtered Commissions:", filteredCommissions);  //debugging
            setCommissions(filteredCommissions);

            // ✅ Compute Yearly Data
            const yearlyDataMap = {};
            filteredCommissions.forEach(com => {
                const year = new Date(com.invoice.date_paid).getFullYear();
                yearlyDataMap[year] = (yearlyDataMap[year] || 0) + com.commission_amount;
            });

            setYearlyData(yearlyDataMap);
        })
        .catch(error => console.error("❌ Error Fetching Commissions Data:", error));  //debugging

    }, [user?.id, viewMode, selectedYear, fromYear, toYear, selectedMonth]);

    console.log("📄 Related Accounts Data:", commissions);  //debugging

return (
    <div className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} p-6`}>
        <div className="flex min-h-screen">
            <div className="flex-1 ml-64">
                <h1 className="text-2xl font-bold text-gray-900 pb-4">Commissions</h1>

                {/* Filters */}
                <Filters {...{ viewMode, setViewMode, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, fromYear, setFromYear, toYear, setToYear, yearRange }} />

                {/* Summary */}
                <SummaryCards {...{
                    currentMonthCommission,
                    currentYearCommission,
                    lastYearCommission,
                    projectedCommission,
                }} />

                {/* Bar Chart */}
                <CommissionsChart {...{
                    viewMode,
                    pastFiveYears: yearRange.slice(-5),
                    yearlyData,
                    monthlyData,
                    weeklyData,
                    numWeeks: weeklyData.length || 4,
                }} />

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
            sales_rep_id: PropTypes.number.isRequired,
            invoice_id: PropTypes.number,
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
