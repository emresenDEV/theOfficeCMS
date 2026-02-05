import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { formatDateInTimeZone } from "../utils/timezone";

const InvoicesSection = ({ invoices, onCreateInvoice, refreshInvoices }) => {
    const navigate = useNavigate();
    const [searchInvoices, setSearchInvoices] = useState("");
    const [invoiceFilter, setInvoiceFilter] = useState("all");

    // Format Due Date (MM/DD/YYYY)
    const formatDueDate = (dateString) => {
        if (!dateString) return "N/A";
        return formatDateInTimeZone(dateString, null, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
    };

    // Format Total Amount ($00,000.00)
    const formatTotalAmount = (amount) => {
        if (typeof amount !== "number") return "$0.00";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getComputedStatus = (invoice) => {
        const paidTotal = Number(invoice.total_paid || 0);
        const finalTotal = Number(invoice.final_total || 0);
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
        const today = new Date();

        if (paidTotal >= finalTotal && finalTotal > 0) return "Paid";
        if (dueDate && dueDate < today && paidTotal < finalTotal) return "Past Due";
        if (paidTotal > 0 && paidTotal < finalTotal) return "Partial";
        return "Pending";
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "Paid":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 px-2 py-1 rounded-full text-xs font-semibold";
            case "Partial":
                return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200 px-2 py-1 rounded-full text-xs font-semibold";
            case "Past Due":
                return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200 px-2 py-1 rounded-full text-xs font-semibold";
            case "Pending":
                return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 px-2 py-1 rounded-full text-xs font-semibold";
            default:
                return "bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-semibold";
        }
    };
    

    // Filter invoices based on search input and selected status filter
    const filteredInvoices = invoices.filter((inv) => {
        const computedStatus = getComputedStatus(inv);
        return (
            (searchInvoices === "" ||
                inv.invoice_id.toString().includes(searchInvoices) ||
                computedStatus.toLowerCase().includes(searchInvoices.toLowerCase()) ||
                inv.final_total.toString().includes(searchInvoices)) &&
            (invoiceFilter === "all" || computedStatus === invoiceFilter)
        );
    });
    
    // Clear Filters
    const clearFilters = () => {
        setInvoiceFilter("all");
        setSearchInvoices("");
    };

    return (
        <div className="mt-6 border border-border p-4 rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
            
            {/* Search and Filter Controls */}
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search invoices..." 
                    className="border border-border bg-card text-foreground p-2 rounded w-1/3 flex-grow"
                    value={searchInvoices}
                    onChange={(e) => setSearchInvoices(e.target.value)}
                />
                <div>
                    <button 
                        onClick={() => setInvoiceFilter("Paid")}
                        className="bg-secondary text-emerald-700 dark:text-emerald-200 px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                        Paid
                    </button>
                    <button 
                        onClick={() => setInvoiceFilter("Past Due")}                            
                        className="bg-secondary text-rose-700 dark:text-rose-200 px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                        Past Due
                    </button>
                    <button 
                        onClick={() => setInvoiceFilter("Partial")} 
                        className="bg-secondary text-violet-700 dark:text-violet-200 px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80"
                    >
                        Partial
                    </button>
                    <button 
                        onClick={() => setInvoiceFilter("Pending")} 
                        className="bg-secondary text-amber-700 dark:text-amber-200 px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                        Pending
                    </button>

                    <button 
                        onClick={() => {
                            setInvoiceFilter("all");
                            setSearchInvoices("");
                            refreshInvoices();
                        }} 
                        className="bg-secondary text-secondary-foreground px-3 py-2 mx-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                        Clear
                    </button>

                    <button 
                        onClick={onCreateInvoice} 
                        className="bg-primary text-primary-foreground px-3 py-2 ml-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        Create
                    </button>
                </div>

            </div>

            {/* ✅ Invoices Table */}
            <div className="overflow-auto h-48 border border-border rounded-lg">
                <table className="min-w-[720px] w-full text-foreground">
                    <thead className="sticky top-0 bg-card shadow-sm">
                        <tr>
                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">ID</th>
                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Date</th>
                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Due Date</th>
                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Total</th>
                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((inv, index) => (
                                <tr
                                    key={inv.invoice_id}
                                    className={`cursor-pointer hover:bg-muted/60 ${
                                        index % 2 === 0 ? "bg-muted/40" : "bg-card"
                                    }`}
                                    onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                                >
                                    <td className="p-2 border-b border-r text-left">
                                        <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                                            #{inv.invoice_id}
                                        </span>
                                    </td>
                                    <td className="p-2 border-b border-r text-left">{formatDueDate(inv.date_created)}</td>
                                    <td className="p-2 border-b border-r text-left">{formatDueDate(inv.due_date)}</td>
                                    <td className="p-2 border-b border-r text-left">{formatTotalAmount(inv.final_total)}</td>
                                    {/* 🏷️ Invoice Status Badge */}
                                    <td className="p-2 border-b border-r text-left">
                                        {(() => {
                                            const computedStatus = getComputedStatus(inv);
                                            const paidTotal = Number(inv.total_paid || 0);
                                            const finalTotal = Number(inv.final_total || 0);
                                            const balance = Math.max(finalTotal - paidTotal, 0);
                                            let amountLabel = "";
                                            if (computedStatus === "Paid") {
                                                amountLabel = formatTotalAmount(paidTotal || finalTotal);
                                            } else if (computedStatus === "Partial") {
                                                amountLabel = `${formatTotalAmount(paidTotal)}/${formatTotalAmount(finalTotal)}`;
                                            } else if (computedStatus === "Past Due") {
                                                amountLabel = formatTotalAmount(balance || finalTotal);
                                            } else {
                                                amountLabel = formatTotalAmount(finalTotal);
                                            }
                                            return (
                                                <span className={getStatusBadge(computedStatus)}>
                                                    {computedStatus} {amountLabel}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-muted-foreground">No invoices available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// PropTypes Validation
InvoicesSection.propTypes = {
    invoices: PropTypes.arrayOf(
        PropTypes.shape({
            invoice_id: PropTypes.number.isRequired,
            date_created: PropTypes.string,
            date_updated: PropTypes.string,
            due_date: PropTypes.string,
            final_total: PropTypes.number,
            status: PropTypes.string,
        })
    ).isRequired,
    onCreateInvoice: PropTypes.func.isRequired,
    refreshInvoices: PropTypes.func.isRequired,
};

export default InvoicesSection;
