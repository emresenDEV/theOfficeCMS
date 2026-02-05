import { useEffect, useState } from "react";
import { fetchInvoicesByStatus } from "../services/invoiceService";
import { fetchAccountById } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";

const PaidInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [accountNames, setAccountNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
            if (user?.id) {
                fetchInvoicesByStatus("Paid").then((filtered) => {
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
            <h1 className="text-2xl font-bold mb-4 text-foreground">Paid Invoices</h1>
                {invoices.length > 0 ? (
                    <table className="w-full border border-border text-foreground">
                        <thead>
                            <tr className="bg-muted">
                                <th className="p-2 border border-border">Invoice #</th>
                                <th className="p-2 border border-border">Account</th>
                                <th className="p-2 border border-border">Amount</th>
                                <th className="p-2 border border-border">Date Paid</th>
                                <th className="p-2 border border-border">Payment Method</th>
                                <th className="p-2 border border-border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border border-border text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">{inv.account_id}</td>
                                    <td className="p-2">${inv.amount.toFixed(2)}</td>
                                    <td className="p-2">
                                        {inv.date_paid !== "N/A"
                                            ? formatDateInTimeZone(inv.date_paid, user, {
                                                month: "2-digit",
                                                day: "2-digit",
                                                year: "numeric",
                                            })
                                            : "N/A"}
                                    </td>
                                    <td className="p-2">{inv.payment_method || "N/A"}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-primary underline"
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
                    <p className="text-muted-foreground">No paid invoices found.</p>
                )}
        </div>
    );
};

PaidInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default PaidInvoicesPage;
