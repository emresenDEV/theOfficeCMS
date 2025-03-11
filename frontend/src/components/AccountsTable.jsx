import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAssignedAccounts, fetchAccountMetrics } from "../services/accountService"; 
import { useNavigate } from "react-router-dom";
import { format } from "date-fns"; 
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

export const AccountsTable = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const [accountMetrics, setAccountMetrics] = useState([]); 
    const [searchQuery, setSearchQuery] = useState("");
    const [sortColumn, setSortColumn] = useState("business_name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [filterIndustry, setFilterIndustry] = useState("all");
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

    // ✅ Merging account data with metrics
    const mergedAccounts = accounts.map(acc => {
        const metrics = accountMetrics.find(m => m.account_id === acc.account_id) || {};
        return { ...acc, ...metrics };
    });

    // ✅ Sorting Logic
    const toggleSortOrder = (column) => {
        setSortOrder(prevOrder => (sortColumn === column && prevOrder === "asc" ? "desc" : "asc"));
        setSortColumn(column);
    };

    const sortedAccounts = [...mergedAccounts].sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];

        if (valueA === null || valueA === undefined) valueA = sortColumn === "last_invoice_date" ? "0000-00-00" : 0;
        if (valueB === null || valueB === undefined) valueB = sortColumn === "last_invoice_date" ? "0000-00-00" : 0;

        if (sortColumn === "business_name" || sortColumn === "industry_name" || sortColumn === "contact_name") {
            return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    // ✅ Filtering Logic
    const filteredAccounts = sortedAccounts.filter(acc => {
        const searchText = searchQuery.toLowerCase();
        const matchesSearch =
            acc.business_name.toLowerCase().includes(searchText) ||
            (acc.contact_name && acc.contact_name.toLowerCase().includes(searchText)) ||
            (acc.email && acc.email.toLowerCase().includes(searchText)) ||
            (acc.phone_number && acc.phone_number.toLowerCase().includes(searchText)) ||
            (acc.address && acc.address.toLowerCase().includes(searchText)) ||
            (acc.account_id && acc.account_id.toString().includes(searchText));

        const matchesIndustry = filterIndustry === "all" || acc.industry_name === filterIndustry;
        return matchesSearch && matchesIndustry;
    });

    return (
        <div className={`bg-white shadow-lg rounded-lg transition-all duration-300 ${isCollapsed ? "h-14 overflow-hidden" : "h-auto"}`}>
            {/* Toggle Button */}
            <div className="flex justify-between items-center px-4 py-3 cursor-pointer" onClick={() => setIsCollapsed(prev => !prev)}>
                <h3 className="text-lg font-bold text-gray-700">🏢 My Accounts</h3>
                <button>
                    {isCollapsed ? <ChevronDownIcon className="w-6 h-6 text-gray-500" /> : <ChevronUpIcon className="w-6 h-6 text-gray-500" />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="p-4">
                    {/* Search & Filters */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterIndustry}
                            onChange={(e) => setFilterIndustry(e.target.value)}
                        >
                            <option value="all">All Industries</option>
                            {[...new Set(accounts.map(acc => acc.industry_name))].map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                            ))}
                        </select>
                        <button
                            className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            onClick={() => {
                                setSearchQuery("");
                                setFilterIndustry("all");
                                setSortColumn("business_name");
                                setSortOrder("asc");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-y-auto max-h-[600px]"> {/* ✅ Scrollable Table */}
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-100 shadow-md z-10">
                                <tr>
                                    {["business_name", "contact_name", "industry_name", "task_count", "total_revenue", "last_invoice_date"].map((col) => (
                                        <th 
                                            key={col} 
                                            className="p-3 border-b cursor-pointer hover:bg-gray-200"
                                            onClick={() => toggleSortOrder(col)}
                                        >
                                            {col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} 
                                            {sortColumn === col ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
                                        </th>
                                    ))}
                                    <th className="p-3 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.slice(0, 6).map(acc => (
                                    <tr key={acc.account_id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-gray-800">{acc.business_name}</td>
                                        <td className="p-3 text-gray-700">{acc.contact_name}</td>
                                        <td className="p-3 text-gray-700">{acc.industry_name}</td>
                                        <td className="p-3 text-gray-700">{acc.task_count || 0}</td>
                                        <td className="p-3 text-gray-700">${acc.total_revenue ? acc.total_revenue.toFixed(2) : "0.00"}</td>
                                        <td className="p-3 text-gray-700">
                                            {acc.last_invoice_date ? format(new Date(acc.last_invoice_date), "MM/dd/yyyy") : "N/A"}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                                                onClick={() => navigate(`/accounts/details/${acc.account_id}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ✅ Fixed `PropTypes` and ensured correct user field names
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
