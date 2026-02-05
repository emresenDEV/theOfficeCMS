import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAssignedAccounts, fetchAccountMetrics } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import { formatDateInTimeZone } from "../utils/timezone";

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
        if (!user || !user.user_id) {
            console.log("🔍 AccountsMobileMini - No user");
            return;
        }

        console.log("🔍 AccountsMobileMini Fetching accounts for sales_rep_id:", user.user_id);

        fetchAssignedAccounts(user.user_id)
            .then((data) => {
                console.log("✅ AccountsMobileMini Fetched Accounts:", data);
                setAccounts(data);
            })
            .catch((error) => console.error("❌ AccountsMobileMini Error fetching accounts:", error));

        fetchAccountMetrics(user.user_id)
            .then((metrics) => {
                console.log("📊 AccountsMobileMini Account Metrics:", metrics);
                setAccountMetrics(metrics);
            })
            .catch((error) => console.error("❌ AccountsMobileMini Error fetching account metrics:", error));
    }, [user]);

    // Merge accounts with metrics
    const mergedAccounts = accounts.map(acc => {
        const metrics = accountMetrics.find(m => m.account_id === acc.account_id) || {};
        return { ...acc, ...metrics };
    });

    // Log merged accounts
    console.log(`📦 AccountsMobileMini Merged ${mergedAccounts.length} accounts from ${accounts.length} accounts + ${accountMetrics.length} metrics`);

    // Search filter - matches standard view logic
    const filteredAccounts = mergedAccounts.filter(acc => {
        const searchText = searchQuery.toLowerCase();
        const matchesSearch =
            acc.business_name.toLowerCase().includes(searchText) ||
            (acc.contact_name && acc.contact_name.toLowerCase().includes(searchText)) ||
            (acc.email && acc.email.toLowerCase().includes(searchText)) ||
            (acc.phone_number && acc.phone_number.toLowerCase().includes(searchText)) ||
            (acc.address && acc.address.toLowerCase().includes(searchText)) ||
            (acc.city && acc.city.toLowerCase().includes(searchText)) ||
            (acc.state && acc.state.toLowerCase().includes(searchText)) ||
            (acc.industry_name && acc.industry_name.toLowerCase().includes(searchText)) ||
            (acc.account_id && acc.account_id.toString().includes(searchText));

        return matchesSearch;
    });

    // Debug logging
    if (searchQuery) {
        console.log(`🔍 AccountsMobileMini Search: "${searchQuery}" → ${filteredAccounts.length} results from ${mergedAccounts.length} total`);
        if (filteredAccounts.length === 0) {
            console.log("   No matches found. Sample account data:", mergedAccounts.slice(0, 2));
        }
    }

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
        <div className="bg-card border border-border rounded-lg shadow-md p-4">
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
                            className="w-full p-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="mb-4 relative">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="w-full p-2 border border-border rounded-lg bg-card text-left text-sm font-medium text-foreground hover:bg-muted/60 flex justify-between items-center"
                        >
                            <span>Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                            <span>{showSortDropdown ? "▲" : "▼"}</span>
                        </button>

                        {showSortDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-10 mt-1">
                                {sortOptions.map(option => (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-3 p-3 hover:bg-muted/60 cursor-pointer border-b border-border last:border-b-0"
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
                                        <span className="text-sm text-foreground">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Debug Info */}
                    {searchQuery && (
                        <div className="text-xs text-muted-foreground mb-2">
                            Found {sortedAccounts.length} account(s) matching "{searchQuery}"
                        </div>
                    )}

                    {/* Accounts List */}
                    <div className="space-y-3">
                        {sortedAccounts.length > 0 ? (
                            sortedAccounts.map(account => (
                                <div
                                    key={account.account_id}
                                    className="border border-border rounded p-3 hover:shadow-md transition bg-background hover:bg-muted"
                                >
                                    {/* Row 1: Business Name | Last Invoice Date */}
                                    <div className="flex justify-between items-start mb-2">
                                        <button
                                            onClick={() => navigate(`/accounts/details/${account.account_id}`)}
                                            className="text-sm font-bold text-primary hover:text-primary/80 hover:underline text-left flex-1"
                                        >
                                            {account.business_name}
                                        </button>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            Last Invoice: {account.last_invoice_date
                                                ? formatDateInTimeZone(account.last_invoice_date, user, {
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    year: "numeric",
                                                })
                                                : "N/A"
                                            }
                                        </div>
                                    </div>

                                    {/* Row 2: Contact Name | Total Revenue */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs text-foreground flex-1">
                                            <span className="font-semibold">Contact: </span>
                                            {account.contact_name || "N/A"}
                                        </div>
                                        <div className="text-xs text-foreground whitespace-nowrap ml-2">
                                            <span className="font-semibold">Total Revenue: </span>
                                            ${account.total_revenue ? account.total_revenue.toFixed(2) : "0.00"}
                                        </div>
                                    </div>

                                    {/* Row 3: Industry | Open Tasks */}
                                    <div className="flex justify-between items-start">
                                        <div className="text-xs text-foreground flex-1">
                                            <span className="font-semibold">Industry: </span>
                                            {account.industry_name || "N/A"}
                                        </div>
                                        <div className="text-xs text-foreground whitespace-nowrap ml-2">
                                            <span className="font-semibold">Open Tasks: </span>
                                            {account.task_count || 0}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">No accounts found</p>
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
