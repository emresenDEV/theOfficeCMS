import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/invoiceService";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const InvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const status = searchParams.get("status") || "All"; 

    useEffect(() => {
        if (user?.id) {
            fetchInvoices(user.id).then((data) => {
                if (status === "All") {
                    setInvoices(data);
                } else {
                    setInvoices(data.filter(inv => inv.status === status));
                }
            }).catch(error => console.error("Error fetching invoices:", error));
        }
    }, [user, status]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status} Invoices</h1>

                {invoices.length > 0 ? (
                    <table className="w-full border border-slate-200 dark:border-slate-800 mt-4 text-slate-700 dark:text-slate-200">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Invoice #</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Account</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Amount</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Status</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Due Date</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border border-slate-200 dark:border-slate-800 text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">{inv.account_id}</td> 
                                    <td className="p-2">${inv.amount.toFixed(2)}</td>
                                    <td className="p-2">{inv.status}</td>
                                    <td className="p-2">{inv.due_date || "N/A"}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-600 dark:text-blue-300 underline"
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
                    <p className="mt-4 text-slate-500 dark:text-slate-400">No invoices found.</p>
                )}

                <button 
                    onClick={() => navigate("/")} 
                    className="mt-4 bg-blue-500 text-white p-2 rounded"
                >
                    Back to Dashboard
                </button>
        </div>
    );
};

InvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
};

export default InvoicesPage;
