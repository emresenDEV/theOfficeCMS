import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const InvoicesSection = ({ invoices, onCreateInvoice, refreshInvoices }) => {
    const navigate = useNavigate();
    const [searchInvoices, setSearchInvoices] = useState("");
    const [invoiceFilter, setInvoiceFilter] = useState("all");

    // Format Due Date (MM/DD/YYYY)
    const formatDueDate = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MM/dd/yyyy");
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

        // Get status badge styling
        const getStatusBadge = (status) => {
            switch (status) {
                case "Paid":
                    return "bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold";
                case "Partial":
                    return "bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold";
                case "Past Due":
                    return "bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold";
                case "Pending":
                    return "bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-semibold";
                default:
                    return "bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold";
            }
        };
    

    // Filter invoices based on search input and selected status filter
    const filteredInvoices = invoices.filter((inv) => {
        const invoiceDueDate = new Date(inv.due_date);
        const today = new Date();
        const isPastDue = invoiceDueDate < today && inv.status !== "Paid";

        return (
            (searchInvoices === "" ||
                inv.invoice_id.toString().includes(searchInvoices) ||
                inv.status.toLowerCase().includes(searchInvoices.toLowerCase()) ||
                inv.final_total.toString().includes(searchInvoices)) &&
            (invoiceFilter === "all" ||
                (invoiceFilter === "Paid" && inv.status === "Paid") ||
                (invoiceFilter === "Pending" && inv.status === "Pending") ||
                (invoiceFilter === "Past Due" && isPastDue) ||
                (invoiceFilter === "Partial" && inv.status === "Partial"))
        );
    });
    
    // Clear Filters
    const clearFilters = () => {
        setInvoiceFilter("all");
        setSearchInvoices("");
    };

    return (
        <div className="mt-6 border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Invoices</h2>
            
            {/* Search and Filter Controls */}
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search invoices..." 
                    className="border p-2 rounded w-1/3 flex-grow"
                    value={searchInvoices}
                    onChange={(e) => setSearchInvoices(e.target.value)}
                />
                <div>
                    <button 
                        onClick={() => {
                            refreshInvoices("Paid")}
                        }
                        className="bg-green-500 text-white px-3 py-2 mx-1 rounded shadow-lg hover:bg-green-600 transition-colors"
                    >
                        Paid
                    </button>
                    <button 
                        onClick={() => {
                            refreshInvoices("Past Due")}                            
                        }
                        className="bg-red-500 text-white px-3 py-2 mx-1 rounded shadow-lg hover:bg-red-600 transition-colors"
                    >
                        Past Due
                    </button>
                    <button 
                        onClick={() => refreshInvoices("Pending")} 
                        className="bg-yellow-500 text-white px-3 py-2 mx-1 rounded shadow-lg hover:bg-yellow-600 transition-colors"
                    >
                        Pending
                    </button>
                    <button 
                        onClick={() => setInvoiceFilter("Partial")} 
                        className="bg-purple-500 text-white px-3 py-2 mx-1 rounded shadow-lg hover:bg-purple-600"
                    >
                        Partial
                    </button>

                    <button 
                        onClick={() => {
                            setInvoiceFilter("all");
                            setSearchInvoices("");
                            refreshInvoices(); // fetch all invoices, no status filter
                        }} 
                        className="bg-gray-500 text-white px-3 py-2 mx-1 rounded shadow-lg hover:bg-gray-600 transition-colors"
                        >
                        Clear
                    </button>

                    <button 
                        onClick={onCreateInvoice} 
                        className="bg-blue-600 text-white px-3 py-2 ml-2 rounded shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        Create
                    </button>
                </div>

            </div>

            {/* ✅ Invoices Table */}
            <div className="overflow-y-auto h-48 border rounded-lg">
                <table className="w-full">
                    <thead className="sticky top-0 bg-white shadow-sm">
                        <tr>
                            <th className="font-bold p-2 border-b border-r text-left">ID</th>
                            <th className="font-bold p-2 border-b border-r text-left">Date</th>
                            <th className="font-bold p-2 border-b border-r text-left">Due Date</th>
                            <th className="font-bold p-2 border-b border-r text-left">Total</th>
                            <th className="font-bold p-2 border-b border-r text-left">Status</th>
                            <th className="font-bold p-2 border-b text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((inv, index) => (
                                <tr
                                    key={inv.invoice_id}
                                    className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-blue-50" : "bg-white"}`}
                                >
                                    <td className="p-2 border-b border-r text-left">{inv.invoice_id}</td>
                                    <td className="p-2 border-b border-r text-left">{formatDueDate(inv.date_created)}</td>
                                    <td className="p-2 border-b border-r text-left">{formatDueDate(inv.due_date)}</td>
                                    <td className="p-2 border-b border-r text-left">{formatTotalAmount(inv.final_total)}</td>
                                    {/* 🏷️ Invoice Status Badge */}
                                    <td className="p-2 border-b border-r text-left">
                                        <span className={getStatusBadge(inv.status)}>{inv.status}</span>
                                    </td>
                                    <td className="p-2 border-b text-center">
                                        <button
                                            onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded shadow-lg hover:bg-blue-700 transition-colors"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">No invoices available</td>
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