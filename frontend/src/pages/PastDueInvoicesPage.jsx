import { useEffect, useState } from "react";
import { fetchInvoicesByStatus } from "../services/invoiceService";
import { fetchAccountById } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const PastDueInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [accountNames, setAccountNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchInvoicesByStatus("Past Due").then((filtered) => {
                setInvoices(filtered);
                filtered.forEach((inv) => {
                    if (!accountNames[inv.account_id]) {
                        fetchAccountById(inv.account_id).then(account => {
                            setAccountNames(prev => ({
                                ...prev,
                                [inv.account_id]: account.business_name
                            }));
                        });
                    }
                });
            });
        }
    }, [user?.id, accountNames]);
    

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Past Due Invoices</h1>

                {invoices.length > 0 ? (
                    <table className="w-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Invoice #</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Account</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Amount</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Due Date</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Payment Method</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border border-slate-200 dark:border-slate-800 text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">{inv.account_id}</td>
                                    <td className="p-2">${(inv.amount ?? 0).toFixed(2)}</td> {/* ✅ Prevent `toFixed` error */}
                                    <td className="p-2">
                                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}
                                    </td> 
                                    <td className="p-2">{inv.payment_method || "N/A"}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-500 dark:text-blue-300 underline"
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
                    <p className="text-slate-500 dark:text-slate-400">No past due invoices found.</p>
                )}
        </div>
    );
};

PastDueInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default PastDueInvoicesPage;
