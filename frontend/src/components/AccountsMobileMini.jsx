import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAssignedAccounts, fetchAccountMetrics } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const AccountsMobileMini = ({ user }) => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [accountMetrics, setAccountMetrics] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("business_name_asc");
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Fetch accounts and metrics
    useEffect(() => {
        if (!user || !user.user_id) return;

        console.log("🔍 Fetching accounts for sales_rep_id:", user.user_id);

        fetchAssignedAccounts(user.user_id)
            .then((data) => {
                console.log("✅ Fetched Accounts:", data);
                setAccounts(data);
            })
            .catch((error) => console.error("❌ Error fetching accounts:", error));

        fetchAccountMetrics(user.user_id)
            .then((metrics) => {
                console.log("📊 Account Metrics:", metrics);
                setAccountMetrics(metrics);
            })
            .catch((error) => console.error("❌ Error fetching account metrics:", error));
    }, [user]);

    // Merge accounts with metrics
    const mergedAccounts = accounts.map(acc => {
        const metrics = accountMetrics.find(m => m.account_id === acc.account_id) || {};
        return { ...acc, ...metrics };
    });

    // Search filter - supports business, phone (with/without dashes), city, state, contact, address, industry
    const normalizePhoneNumber = (phone) => {
        return phone ? phone.replace(/\D/g, "") : "";
    };

    const filteredAccounts = mergedAccounts.filter(acc => {
        const searchText = searchQuery.toLowerCase();
        const searchTextNoFormatting = normalizePhoneNumber(searchQuery);

        return (
            acc.business_name.toLowerCase().includes(searchText) ||
            (acc.contact_name && acc.contact_name.toLowerCase().includes(searchText)) ||
            (acc.phone_number && (
                acc.phone_number.toLowerCase().includes(searchText) ||
                normalizePhoneNumber(acc.phone_number).includes(searchTextNoFormatting)
            )) ||
            (acc.address && acc.address.toLowerCase().includes(searchText)) ||
            (acc.city && acc.city.toLowerCase().includes(searchText)) ||
            (acc.state && acc.state.toLowerCase().includes(searchText)) ||
            (acc.industry_name && acc.industry_name.toLowerCase().includes(searchText))
        );
    });

    // Sorting logic
    const getSortedAccounts = () => {
        // Split on the last underscore to handle field names with underscores
        const lastUnderscoreIndex = sortBy.lastIndexOf("_");
        const sortField = sortBy.substring(0, lastUnderscoreIndex);
        const sortOrder = sortBy.substring(lastUnderscoreIndex + 1);
        const isAsc = sortOrder === "asc";

        return [...filteredAccounts].sort((a, b) => {
            let valueA, valueB;

            switch (sortField) {
                case "business_name":
                    valueA = a.business_name || "";
                    valueB = b.business_name || "";
                    return isAsc
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);

                case "contact_name":
                    valueA = a.contact_name || "";
                    valueB = b.contact_name || "";
                    return isAsc
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);

                case "industry_name":
                    valueA = a.industry_name || "";
                    valueB = b.industry_name || "";
                    return isAsc
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);

                case "last_invoice_date":
                    valueA = a.last_invoice_date ? new Date(a.last_invoice_date).getTime() : 0;
                    valueB = b.last_invoice_date ? new Date(b.last_invoice_date).getTime() : 0;
                    // "Newest First" means descending (newer = higher date value)
                    return isAsc
                        ? valueA - valueB
                        : valueB - valueA;

                case "total_revenue":
                    valueA = a.total_revenue || 0;
                    valueB = b.total_revenue || 0;
                    // "Highest First" means descending
                    return isAsc
                        ? valueA - valueB
                        : valueB - valueA;

                case "task_count":
                    valueA = a.task_count || 0;
                    valueB = b.task_count || 0;
                    // "Most First" means descending
                    return isAsc
                        ? valueA - valueB
                        : valueB - valueA;

                default:
                    return 0;
            }
        });
    };

    const sortedAccounts = getSortedAccounts();

    // Sort options with better naming
    const sortOptions = [
        { value: "business_name_asc", label: "Business Name (A-Z)" },
        { value: "contact_name_asc", label: "Contact Name (A-Z)" },
        { value: "industry_name_asc", label: "Industry (A-Z)" },
        { value: "last_invoice_date_desc", label: "Last Invoice (Newest First)" },
        { value: "total_revenue_desc", label: "Revenue (Highest First)" },
        { value: "task_count_desc", label: "Open Tasks (Most First)" },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2 className="text-lg font-semibold">My Accounts</h2>
                <span className="text-xl">{isCollapsed ? "+" : "−"}</span>
            </div>

            {!isCollapsed && (
                <>
                    {/* Search Bar */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by business, contact, phone, city, state, address, industry..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="mb-4 relative">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-between items-center"
                        >
                            <span>Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                            <span>{showSortDropdown ? "▲" : "▼"}</span>
                        </button>

                        {showSortDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                                {sortOptions.map(option => (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    >
                                        <input
                                            type="radio"
                                            name="sort"
                                            value={option.value}
                                            checked={sortBy === option.value}
                                            onChange={(e) => {
                                                setSortBy(e.target.value);
                                                setShowSortDropdown(false);
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Debug Info */}
                    {searchQuery && (
                        <div className="text-xs text-gray-500 mb-2">
                            Found {sortedAccounts.length} account(s) matching "{searchQuery}"
                        </div>
                    )}

                    {/* Accounts List */}
                    <div className="space-y-3">
                        {sortedAccounts.length > 0 ? (
                            sortedAccounts.map(account => (
                                <div
                                    key={account.account_id}
                                    className="border rounded p-3 hover:shadow-md transition bg-gray-50 hover:bg-gray-100"
                                >
                                    {/* Row 1: Business Name | Last Invoice Date */}
                                    <div className="flex justify-between items-start mb-2">
                                        <button
                                            onClick={() => navigate(`/accounts/details/${account.account_id}`)}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline text-left flex-1"
                                        >
                                            {account.business_name}
                                        </button>
                                        <div className="text-xs text-gray-600 whitespace-nowrap ml-2">
                                            Last Invoice: {account.last_invoice_date
                                                ? format(new Date(account.last_invoice_date), "MM/dd/yyyy")
                                                : "N/A"
                                            }
                                        </div>
                                    </div>

                                    {/* Row 2: Contact Name | Total Revenue */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs text-gray-700 flex-1">
                                            <span className="font-semibold">Contact: </span>
                                            {account.contact_name || "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-700 whitespace-nowrap ml-2">
                                            <span className="font-semibold">Total Revenue: </span>
                                            ${account.total_revenue ? account.total_revenue.toFixed(2) : "0.00"}
                                        </div>
                                    </div>

                                    {/* Row 3: Industry | Open Tasks */}
                                    <div className="flex justify-between items-start">
                                        <div className="text-xs text-gray-700 flex-1">
                                            <span className="font-semibold">Industry: </span>
                                            {account.industry_name || "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-700 whitespace-nowrap ml-2">
                                            <span className="font-semibold">Open Tasks: </span>
                                            {account.task_count || 0}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 text-center py-4">No accounts found</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

AccountsMobileMini.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
    }).isRequired,
};

export default AccountsMobileMini;
