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
    const [formattedMonthlyData, setFormattedMonthlyData] = useState(Array(12).fill(0));
    const [weeklyCommissions, setWeeklyCommissions] = useState(Array(4).fill(0)); // Default to 4 weeks


    // useEffect(() => {
    //     if (user?.id) {
    //         fetchMonthlyCommissions(user.id, selectedYear)
    //             .then(data => {
    //                 console.log("📥 Fetched Monthly Commissions API Response:", data);
    //                 setFormattedMonthlyData(Array.isArray(data) ? data : Array(12).fill(0));
    //             })
    //             .catch(error => console.error("❌ Error Fetching Monthly Commissions:", error));
        
    //     // ✅ Fetch full commission data for related accounts
    //     fetchCommissions(user.id)
    //         .then(data => {
    //             console.log("🔍 Full Commissions Data Received:", data);
    //             setCommissions(Array.isArray(data) ? data : []);
    //         })
    //         .catch(error => console.error("❌ Error Fetching Full Commissions:", error));
    //     }

    //     console.log("🚀 Fetching commissions data for user ID:", user.id);
    //     Promise.all([
    //         fetchCommissions(user.id), // ✅ Fetch complete commissions data for RelatedAccounts
    //         fetchCurrentMonthCommissions(user.id),
    //         fetchCurrentYearCommissions(user.id),
    //         fetchLastYearCommissions(user.id),
    //         fetchProjectedCommissions(user.id),
    //         fetchMonthlyCommissions(user.id, selectedYear),
    //         fetchAllYearsCommissions(user.id)
    //     ]).then(([detailedCommissions, currentMonth, currentYear, lastYear, projected, allCommissions, allYears]) => {
    //         console.log("✅ API Responses Received:", { currentMonth, currentYear, lastYear, projected, allYears });

    //         setCurrentMonthCommission(currentMonth.total_commissions || 0);
    //         setCurrentYearCommission(currentYear.total_commissions || 0);
    //         setLastYearCommission(lastYear.total_commissions || 0);
    //         setProjectedCommission(projected.projected_commissions || 0);
    //         setCommissions(detailedCommissions); // ✅ Use detailed commissions for invoices/accounts

    //         if (Array.isArray(allYears) && allYears.length > 0) {
    //             setYearRange(prevYears => [...new Set([...prevYears, ...allYears])].sort((a, b) => a - b));
    //         } else {
    //             console.warn("⚠️ API failed or returned empty, keeping previous year range:", yearRange);
    //         }
    //     }).catch(error => console.error("❌ Error Fetching Commissions Data:", error));
    // }, [user?.id, selectedYear, viewMode]);

    useEffect(() => {
        if (user?.id) {
            console.log("🚀 Fetching commissions data for user ID:", user.id);
    
            Promise.all([
                fetchCommissions(user.id),
                fetchCurrentMonthCommissions(user.id),
                fetchCurrentYearCommissions(user.id),
                fetchLastYearCommissions(user.id),
                fetchProjectedCommissions(user.id),
                fetchMonthlyCommissions(user.id, selectedYear),
                fetchAllYearsCommissions(user.id)
            ])
            .then(([detailedCommissions, currentMonth, currentYear, lastYear, projected, allCommissions, allYears]) => {
                console.log("✅ API Responses Received:", { currentMonth, currentYear, lastYear, projected, allYears });
    
                setCurrentMonthCommission(currentMonth.total_commissions || 0);
                setCurrentYearCommission(currentYear.total_commissions || 0);
                setLastYearCommission(lastYear.total_commissions || 0);
                setProjectedCommission(projected.projected_commissions || 0);
    
                // ✅ Filter out only paid invoices within the selected time period
                const filteredCommissions = detailedCommissions.filter(com => {
                    // ✅ Ensure `invoice` and `date_paid` exist before processing
                    if (!com.invoice || !com.invoice.date_paid || !com.invoice.paid) return false;
                
                    const invoiceYear = new Date(com.invoice.date_paid).getFullYear();
                    const invoiceMonth = new Date(com.invoice.date_paid).getMonth() + 1;
                
                    if (viewMode === "yearly") {
                        return invoiceYear >= fromYear && invoiceYear <= toYear;
                    } 
                    if (viewMode === "monthly") {
                        return invoiceYear === selectedYear;
                    } 
                    if (viewMode === "weekly") {
                        return invoiceYear === selectedYear && invoiceMonth === selectedMonth;
                    }
                
                    return false;
                });
                
                
    
                console.log("✅ Filtered Commissions:", filteredCommissions);
                setCommissions(filteredCommissions);
    
                // ✅ Compute Monthly Data (Ensures only commissions for selectedYear are counted)
                const updatedMonthlyData = Array(12).fill(0);
                filteredCommissions.forEach(com => {
                    const invoiceDate = new Date(com.invoice.date_paid);
                    if (invoiceDate.getFullYear() === selectedYear) {
                        updatedMonthlyData[invoiceDate.getMonth()] += com.commission_amount;
                    }
                });
    
                // ✅ Update Monthly Data
                setFormattedMonthlyData(updatedMonthlyData);
    
                // ✅ Ensure yearRange contains all available years
                if (Array.isArray(allYears) && allYears.length > 0) {
                    setYearRange(prevYears => [...new Set([...prevYears, ...allYears])].sort((a, b) => a - b));
                } else {
                    console.warn("⚠️ API failed or returned empty, keeping previous year range:", yearRange);
                }
            })
            .catch(error => console.error("❌ Error Fetching Commissions Data:", error));
        }
    }, [user?.id, selectedYear, fromYear, toYear, selectedMonth, viewMode]);
    
    

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
                        return prevYears;
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
                    setWeeklyCommissions(Array.isArray(data) ? data : Array(4).fill(0)); // Default to 4 weeks
                })
                .catch(error => console.error("❌ Error Fetching Weekly Commissions:", error));
        }
    }, [user?.id, selectedYear, selectedMonth, viewMode]);
    

    // ✅ Debugging: View Mode Changes
    useEffect(() => {
        console.log("🖥️ View Mode Changed to:", viewMode);
        console.log("📊 Current Year Range Before View Change:", yearRange);
    }, [viewMode]);

    // ✅ Format Yearly Data
    const filteredYears = yearRange.filter(year => year >= fromYear && year <= toYear);
    const formattedYearlyData = filteredYears.reduce((acc, year) => {
        acc[year] = commissions
            .filter(com => new Date(com.invoice.date_paid).getFullYear() === year)
            .reduce((sum, com) => sum + com.commission_amount, 0);
        return acc;
    }, {});


    

    // ✅ Format Weekly Data
    const numWeeks = Math.ceil(new Date(selectedYear, selectedMonth, 0).getDate() / 7);
    const formattedWeeklyData = weeklyCommissions.length > 0 ? weeklyCommissions : Array(4).fill(0);


    // commissions.forEach(com => {
    //     const invoiceDate = new Date(com.invoice.date_paid);
    //     if (invoiceDate.getFullYear() === selectedYear && invoiceDate.getMonth() + 1 === selectedMonth) {
    //         const weekIndex = Math.floor(invoiceDate.getDate() / 7);
    //         formattedWeeklyData[weekIndex] += com.commission_amount;
    //     }
    // });

    console.log("📄 Related Accounts Data:", commissions);

    return (
        <div className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} p-6`}>
            <div className="flex min-h-screen">
                <div className="flex-1 ml-64">
                    <h1 className="text-2xl font-bold text-dark-cornflower dark:text-blue-300">Commissions</h1>

                    {/* Filters */}
                    <Filters {...{ viewMode, setViewMode, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, fromYear, setFromYear, toYear, setToYear, yearRange }} />

                    {/* Summary */}
                    <SummaryCards {...{ currentMonthCommission, currentYearCommission, lastYearCommission, projectedCommission }} />

                    {/* Bar Chart */}
                    <CommissionsChart {...{ viewMode, pastFiveYears: yearRange.slice(-5), yearlyData: formattedYearlyData, monthlyData: formattedMonthlyData, weeklyData: formattedWeeklyData, numWeeks: weeklyCommissions.length || 4 }} />

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
