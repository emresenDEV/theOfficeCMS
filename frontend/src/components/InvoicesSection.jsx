import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const InvoicesSection = ({ invoices, onCreateInvoice }) => {
    const navigate = useNavigate();
    const [searchInvoices, setSearchInvoices] = useState("");
    const [invoiceFilter, setInvoiceFilter] = useState("all");

    // ✅ Filter invoices based on search input and selected status filter
    const filteredInvoices = invoices.filter(inv => 
        (searchInvoices === "" || 
        inv.invoice_id.toString().includes(searchInvoices) || 
        inv.status.toLowerCase().includes(searchInvoices.toLowerCase()) ||
        inv.final_total.toString().includes(searchInvoices)) &&
        (invoiceFilter === "all" || inv.status === invoiceFilter)
    );

    return (
        <div className="mt-6 border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Invoices</h2>
            
            {/* ✅ Search and Filter Controls */}
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search invoices..." 
                    className="border p-2 rounded w-1/3"
                    value={searchInvoices}
                    onChange={(e) => setSearchInvoices(e.target.value)}
                />
                <div>
                    <button onClick={() => setInvoiceFilter("Paid")} className="bg-green-500 text-white px-2 mx-1">Paid</button>
                    <button onClick={() => setInvoiceFilter("Unpaid")} className="bg-red-500 text-white px-2 mx-1">Unpaid</button>
                    <button onClick={() => setInvoiceFilter("Pending")} className="bg-yellow-500 text-white px-2 mx-1">Pending</button>
                    <button onClick={onCreateInvoice} className="bg-blue-500 text-white px-4 ml-2">Create Invoice</button>
                </div>
            </div>

            {/* ✅ Invoices Table */}
            <div className="overflow-y-scroll h-48 border rounded">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Date</th>
                            <th className="p-2 border">Due</th>
                            <th className="p-2 border">Total</th>
                            <th className="p-2 border">Status</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.slice(0, 6).map(inv => (
                            <tr key={inv.invoice_id} className="border-b">
                                <td className="p-2 text-center">{inv.invoice_id}</td>
                                <td className="p-2 text-center">{inv.date_created}</td>
                                <td className="p-2 text-center">{inv.due_date}</td>
                                <td className="p-2 text-center">${inv.final_total?.toFixed(2) || "0.00"}</td>
                                <td className="p-2 text-center">{inv.status}</td>
                                <td className="p-2 text-center">
                                    <button onClick={() => navigate(`/invoice/${inv.invoice_id}`)} className="bg-blue-500 text-white px-3 py-1 rounded">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ✅ PropTypes Validation
InvoicesSection.propTypes = {
    invoices: PropTypes.arrayOf(
        PropTypes.shape({
            invoice_id: PropTypes.number.isRequired,
            date_created: PropTypes.string,
            date_updated: PropTypes.string,
            due_date: PropTypes.string,
            final_total: PropTypes.number,
            status: PropTypes.string.isRequired,
        })
    ).isRequired,
    onCreateInvoice: PropTypes.func.isRequired,
};

export default InvoicesSection;
