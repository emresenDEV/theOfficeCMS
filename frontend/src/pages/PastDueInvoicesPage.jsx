import { useEffect, useState } from "react";
import { fetchPastDueInvoices } from "../services/invoiceService";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const PastDueInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {  // ✅ Ensures user is set before fetching
            fetchPastDueInvoices(user.id)
                .then(setInvoices)
                .catch(error => console.error("Error fetching past due invoices:", error));
        }
    }, [user]); // ✅ Fix dependency array

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold mb-4">Past Due Invoices</h1>

                {invoices.length > 0 ? (
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Invoice #</th>
                                <th className="p-2 border">Account</th>
                                <th className="p-2 border">Amount</th>
                                <th className="p-2 border">Due Date</th> {/* ✅ Fixed Header */}
                                <th className="p-2 border">Payment Method</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">{inv.account_id}</td>
                                    <td className="p-2">${(inv.amount ?? 0).toFixed(2)}</td> {/* ✅ Prevent `toFixed` error */}
                                    <td className="p-2">
                                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}
                                    </td> {/* ✅ Fixed Date Check */}
                                    <td className="p-2">{inv.payment_method || "N/A"}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-500 underline"
                                            onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No past due invoices found.</p>
                )}
            </div>
        </div>
    );
};

PastDueInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default PastDueInvoicesPage;
