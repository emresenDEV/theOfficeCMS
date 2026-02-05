import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAssignedAccounts, fetchAccountMetrics } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import { formatDateInTimeZone } from "../utils/timezone";
import { ArrowUpDown, Building2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

export const AccountsTable = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const [accountMetrics, setAccountMetrics] = useState([]); 
    const [searchQuery, setSearchQuery] = useState("");
    const [sortColumn, setSortColumn] = useState("business_name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.user_id) return;

        console.log("🔍 Fetching accounts for sales_rep_id:", user.user_id);  

        fetchAssignedAccounts(user.user_id)
            .then((data) => {
                console.log("✅ API Response from `/assigned`:", data); 
                setAccounts(data);
            })
            .catch((error) => console.error("❌ Error fetching assigned accounts:", error));

        fetchAccountMetrics(user.user_id) 
            .then((metrics) => {
                console.log("📊 Account Metrics:", metrics);
                setAccountMetrics(metrics);
            })
            .catch((error) => console.error("❌ Error fetching account metrics:", error));

    }, [user]);

    // Merging account data with metrics
    const mergedAccounts = accounts.map(acc => {
        const metrics = accountMetrics.find(m => m.account_id === acc.account_id) || {};
        return { ...acc, ...metrics };
    });

    // Sorting Logic
    const toggleSortOrder = (column) => {
        setSortOrder(prevOrder => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
        setSortColumn(column);
    };

    const sortedAccounts = [...mergedAccounts].sort((a, b) => {
        let valueA = a[sortColumn] || "";
        let valueB = b[sortColumn] || "";
    
        // Sorting for Industry Name (Alphabetically)
        if (sortColumn === "industry_name") {
            return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
    
        // Sorting for Last Invoice Date
        if (sortColumn === "last_invoice_date") {
            if (!valueA) valueA = "0000-01-01"; // Ensure "N/A" is always last
            if (!valueB) valueB = "0000-01-01";
            
            return sortOrder === "asc" 
                ? new Date(valueA) - new Date(valueB) 
                : new Date(valueB) - new Date(valueA);
        }
    
        // Default Sorting (for numbers & other text fields)
        return sortOrder === "asc" ? valueA.toString().localeCompare(valueB.toString()) : valueB.toString().localeCompare(valueA.toString());
    });
    

    // Filtering Logic
    const filteredAccounts = sortedAccounts.filter(acc => {
        const searchText = searchQuery.toLowerCase();
        const matchesSearch =
            acc.business_name.toLowerCase().includes(searchText) ||
            (acc.contact_name && acc.contact_name.toLowerCase().includes(searchText)) ||
            (acc.email && acc.email.toLowerCase().includes(searchText)) ||
            (acc.phone_number && acc.phone_number.toLowerCase().includes(searchText)) ||
            (acc.address && acc.address.toLowerCase().includes(searchText)) ||
            (acc.account_id && acc.account_id.toString().includes(searchText));

        return matchesSearch;
    });

    const SortableHeader = ({ label, sortKeyName }) => (
        <th
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => toggleSortOrder(sortKeyName)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown
                    className={cn(
                        "h-3 w-3",
                        sortColumn === sortKeyName ? "text-foreground" : "text-muted-foreground"
                    )}
                />
                {sortColumn === sortKeyName && (
                    <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
            </div>
        </th>
    );

    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-card shadow-card transition-all",
                isCollapsed && "overflow-hidden"
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setIsCollapsed((prev) => !prev)}
            >
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">Your Accounts</h3>
                    <Badge variant="secondary" className="font-medium">
                        {filteredAccounts.length} accounts
                    </Badge>
                </div>
                {isCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                )}
            </div>

            {!isCollapsed && (
                <div>
                    {/* Search */}
                    <div className="px-4 pb-4 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search accounts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSortColumn("business_name");
                                    setSortOrder("asc");
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="max-h-[450px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-background">
                                <tr>
                                    <SortableHeader label="Business Name" sortKeyName="business_name" />
                                    <SortableHeader label="Contact" sortKeyName="contact_name" />
                                    <SortableHeader label="Industry" sortKeyName="industry_name" />
                                    <SortableHeader label="Tasks" sortKeyName="task_count" />
                                    <SortableHeader label="Revenue" sortKeyName="total_revenue" />
                                    <SortableHeader label="Last Invoice" sortKeyName="last_invoice_date" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredAccounts.map((acc) => (
                                    <tr key={acc.account_id} className="hover:bg-muted/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-sm font-medium text-primary hover:text-primary/80"
                                                onClick={() => navigate(`/accounts/details/${acc.account_id}`)}
                                            >
                                                <Building2 className="h-4 w-4 mr-2" />
                                                {acc.business_name}
                                            </Button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{acc.contact_name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="font-normal">
                                                {acc.industry_name || "Unspecified"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                                            {acc.task_count || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                                            {acc.total_revenue ? `$${acc.total_revenue.toFixed(2)}` : "$0.00"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {acc.last_invoice_date
                                                ? formatDateInTimeZone(acc.last_invoice_date, user, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredAccounts.length === 0 && (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                No accounts found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


AccountsTable.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(
        PropTypes.shape({
            account_id: PropTypes.number.isRequired,
            business_name: PropTypes.string.isRequired,
            contact_name: PropTypes.string,
            industry_name: PropTypes.string,
            task_count: PropTypes.number,
            total_revenue: PropTypes.number,
            last_invoice_date: PropTypes.string,
        })
    ),
};

export default AccountsTable;
