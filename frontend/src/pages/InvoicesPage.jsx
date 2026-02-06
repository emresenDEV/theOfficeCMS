import { useEffect, useMemo, useState } from "react";
import { fetchAllInvoices } from "../services/invoiceService";
import { fetchAccounts } from "../services/accountService";
import { fetchSalesReps } from "../services/userService";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";

const InvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [filters, setFilters] = useState({
        status: "All",
        salesRep: "All",
        startDate: "",
        endDate: "",
    });
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentUserId = user?.user_id ?? user?.id ?? null;
    const openStatuses = ["Pending", "Past Due", "Partial"];

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const [invoiceList, accountList, salesRepList] = await Promise.all([
                    fetchAllInvoices(),
                    fetchAccounts(),
                    fetchSalesReps(),
                ]);
                setInvoices(invoiceList);
                setAccounts(accountList);
                setSalesReps(salesRepList);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            }
        };
        load();
    }, [user]);

    useEffect(() => {
        if (!currentUserId) return;
        if (!showAll) {
            setFilters((prev) => ({ ...prev, salesRep: String(currentUserId) }));
        }
    }, [currentUserId, showAll]);

    useEffect(() => {
        const statusParam = searchParams.get("status");
        if (!statusParam) return;
        const normalized = statusParam.toLowerCase();
        if (normalized === "open") {
            setFilters((prev) => ({ ...prev, status: "Open" }));
            return;
        }
        const formatted = statusParam
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
        setFilters((prev) => ({ ...prev, status: formatted }));
    }, [searchParams]);

    const accountMap = useMemo(
        () => new Map(accounts.map((acc) => [acc.account_id, acc])),
        [accounts]
    );

    const salesRepMap = useMemo(
        () => new Map(salesReps.map((rep) => [rep.user_id, rep])),
        [salesReps]
    );

    const hasCurrentUserInSalesReps = useMemo(() => {
        if (!currentUserId) return false;
        return salesReps.some((rep) => String(rep.user_id) === String(currentUserId));
    }, [salesReps, currentUserId]);

    const statusOptions = useMemo(() => {
        const unique = Array.from(
            new Set(invoices.map((inv) => inv.status).filter(Boolean))
        ).sort();
        return Array.from(new Set(["All", "Open", ...unique]));
    }, [invoices]);

    const parseDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);

    const filteredInvoices = useMemo(() => {
        const start = parseDate(filters.startDate);
        const end = parseDate(filters.endDate);

        return invoices.filter((inv) => {
            if (!showAll && currentUserId) {
                if (String(inv.sales_rep_id) !== String(currentUserId)) {
                    return false;
                }
            }
            if (filters.status !== "All") {
                if (filters.status === "Open") {
                    if (!openStatuses.includes(inv.status)) return false;
                } else if (inv.status !== filters.status) {
                    return false;
                }
            }
            if (showAll && filters.salesRep !== "All") {
                if (filters.salesRep === "unassigned") {
                    if (inv.sales_rep_id) return false;
                } else if (String(inv.sales_rep_id) !== String(filters.salesRep)) {
                    return false;
                }
            }
            if (start || end) {
                if (!inv.due_date) return false;
                const due = parseDate(inv.due_date);
                if (!due) return false;
                if (start && due < start) return false;
                if (end && due > end) return false;
            }
            return true;
        });
    }, [filters, invoices, showAll, currentUserId]);

    return (
        <div className="px-4 py-4 sm:px-6 sm:py-6">
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {showAll ? "Showing all invoices." : "Showing invoices assigned to you."}
                </p>
                <button
                    type="button"
                    className="w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40 sm:w-auto"
                    onClick={() => {
                        const next = !showAll;
                        setShowAll(next);
                        if (next) {
                            setFilters((prev) => ({ ...prev, salesRep: "All" }));
                        } else if (currentUserId) {
                            setFilters((prev) => ({ ...prev, salesRep: String(currentUserId) }));
                        }
                    }}
                >
                    {showAll ? "Show My Invoices" : "Show All Invoices"}
                </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-md border border-border bg-card p-4 shadow-card md:grid-cols-4">
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                    </label>
                    <select
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={filters.status}
                        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    >
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sales Rep
                    </label>
                    <select
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={filters.salesRep}
                        onChange={(e) => setFilters((prev) => ({ ...prev, salesRep: e.target.value }))}
                        disabled={!showAll}
                    >
                        <option value="All">All</option>
                        {!hasCurrentUserInSalesReps && currentUserId && (
                            <option value={String(currentUserId)}>
                                {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "My Invoices"}
                            </option>
                        )}
                        {salesReps
                            .slice()
                            .sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""))
                            .map((rep) => (
                                <option key={rep.user_id} value={rep.user_id}>
                                    {rep.first_name} {rep.last_name}
                                </option>
                            ))}
                        {invoices.some((inv) => !inv.sales_rep_id) && (
                            <option value="unassigned">Unassigned</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Due Date From
                    </label>
                    <input
                        type="date"
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={filters.startDate}
                        onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Due Date To
                    </label>
                    <input
                        type="date"
                        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        value={filters.endDate}
                        onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
                <button
                    type="button"
                    className="md:col-span-4 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
                    onClick={() =>
                        setFilters({ status: "All", salesRep: "All", startDate: "", endDate: "" })
                    }
                >
                    Clear Filters
                </button>
            </div>

                {filteredInvoices.length > 0 ? (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                        <table className="min-w-[720px] w-full text-foreground">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="p-2 border border-border text-left">Invoice #</th>
                                    <th className="p-2 border border-border text-left">Account</th>
                                    <th className="p-2 border border-border text-left">Sales Rep</th>
                                    <th className="p-2 border border-border text-left">Amount</th>
                                    <th className="p-2 border border-border text-left">Status</th>
                                    <th className="p-2 border border-border text-left">Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map(inv => {
                                    const account = accountMap.get(inv.account_id);
                                    const rep = salesRepMap.get(inv.sales_rep_id);
                                    return (
                                    <tr key={inv.invoice_id} className="border border-border text-left">
                                        <td className="p-2">
                                            <button
                                                className="text-primary underline"
                                                onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                                            >
                                                {inv.invoice_id}
                                            </button>
                                        </td>
                                        <td className="p-2">
                                            <button
                                                className="text-primary underline"
                                                onClick={() => navigate(`/accounts/details/${inv.account_id}`)}
                                            >
                                                {account?.business_name || `Account ${inv.account_id}`}
                                            </button>
                                        </td> 
                                        <td className="p-2">
                                            {rep ? `${rep.first_name} ${rep.last_name}` : "Unassigned"}
                                        </td>
                                        <td className="p-2">
                                            ${Number(inv.final_total || 0).toLocaleString()}
                                        </td>
                                        <td className="p-2">{inv.status}</td>
                                        <td className="p-2">{inv.due_date || "N/A"}</td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="mt-4 text-muted-foreground">No invoices found.</p>
                )}

                <button 
                    onClick={() => navigate("/")} 
                    className="mt-4 w-full rounded bg-primary p-2 text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                    Back to Dashboard
                </button>
        </div>
    );
};

InvoicesPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number,
        id: PropTypes.number,
    }).isRequired,
};

export default InvoicesPage;
