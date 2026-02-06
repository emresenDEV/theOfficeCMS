import { useState } from "react";
import PropTypes from "prop-types";
import AccountCardMobile from "./AccountCardMobile";

const AccountsPageMobile = ({
    accounts = [],
    onViewAccount,
    onViewContact,
    onCreateNew,
    searchQuery,
    onSearchChange,
    filteredAccounts,
    salesReps,
    selectedSalesRepId,
    onSalesRepChange,
    currentUserId,
}) => {
    const [sortBy, setSortBy] = useState("name"); // name, date, rep

    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        switch (sortBy) {
            case "date":
                if (!a.created_date || !b.created_date) return 0;
                return new Date(b.created_date) - new Date(a.created_date);
            case "rep":
                const repA = a.sales_rep?.last_name || "Unassigned";
                const repB = b.sales_rep?.last_name || "Unassigned";
                return repA.localeCompare(repB);
            case "name":
            default:
                return a.business_name.localeCompare(b.business_name);
        }
    });

    return (
        <div className="w-full">
            <div className="p-4 sm:p-6 mt-16 md:mt-0">
                {/* Header */}
                <h1 className="text-2xl font-bold mb-4">Accounts</h1>

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search accounts..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                    />
                </div>

                <div className="mb-4">
                    <select
                        className="w-full p-2 border rounded text-sm"
                        value={selectedSalesRepId}
                        onChange={(e) => onSalesRepChange(e.target.value)}
                    >
                        <option value="All">All Sales Reps</option>
                        {salesReps
                            .slice()
                            .sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""))
                            .map((rep) => (
                                <option key={rep.user_id} value={rep.user_id}>
                                    {rep.first_name} {rep.last_name}
                                    {rep.user_id === currentUserId ? " (Me)" : ""}
                                </option>
                            ))}
                        {accounts.some((acc) => !acc.sales_rep_id) && (
                            <option value="unassigned">Unassigned</option>
                        )}
                    </select>
                </div>

                {/* New Account Button - Full Width on Mobile */}
                <button
                    onClick={onCreateNew}
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded font-medium text-sm mb-4 hover:bg-primary/90 transition"
                >
                    + New Account
                </button>

                {/* Sort Options */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    <button
                        onClick={() => setSortBy("name")}
                        className={`text-xs px-3 py-1 rounded whitespace-nowrap transition ${
                            sortBy === "name"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        Name
                    </button>
                    <button
                        onClick={() => setSortBy("date")}
                        className={`text-xs px-3 py-1 rounded whitespace-nowrap transition ${
                            sortBy === "date"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        Date
                    </button>
                    <button
                        onClick={() => setSortBy("rep")}
                        className={`text-xs px-3 py-1 rounded whitespace-nowrap transition ${
                            sortBy === "rep"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        Sales Rep
                    </button>
                </div>

                {/* Results Count */}
                {sortedAccounts.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                        Showing {sortedAccounts.length} account{sortedAccounts.length !== 1 ? "s" : ""}
                    </div>
                )}

                {/* Account Cards Grid */}
                <div className="space-y-3">
                    {sortedAccounts.length > 0 ? (
                        sortedAccounts.map((account) => (
                            <AccountCardMobile
                                key={account.account_id}
                                account={account}
                                onViewAccount={onViewAccount}
                                onViewContact={onViewContact}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">
                                {searchQuery ? "No accounts found matching your search" : "No accounts yet"}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={onCreateNew}
                                    className="mt-4 text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                    Create your first account
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

AccountsPageMobile.propTypes = {
    accounts: PropTypes.array,
    onViewAccount: PropTypes.func.isRequired,
    onViewContact: PropTypes.func.isRequired,
    onCreateNew: PropTypes.func.isRequired,
    searchQuery: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    filteredAccounts: PropTypes.array.isRequired,
    salesReps: PropTypes.array.isRequired,
    selectedSalesRepId: PropTypes.string.isRequired,
    onSalesRepChange: PropTypes.func.isRequired,
    currentUserId: PropTypes.number,
};

export default AccountsPageMobile;
