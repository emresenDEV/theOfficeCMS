import { useEffect, useState } from "react";
import { fetchInvoicesByStatus } from "../services/invoiceService";
import { fetchAccountById } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";

const UnpaidInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [accountNames, setAccountNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchInvoicesByStatus("Pending").then((filtered) => {
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
        <div className="px-4 py-4 sm:px-6 sm:py-6">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Unpaid Invoices</h1>
                {invoices.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="min-w-[720px] w-full text-foreground">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="p-2 border border-border text-left">Invoice #</th>
                                    <th className="p-2 border border-border text-left">Account</th>
                                    <th className="p-2 border border-border text-left">Amount</th>
                                    <th className="p-2 border border-border text-left">Due Date</th>
                                    <th className="p-2 border border-border text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="border border-border text-left">
                                        <td className="p-2">{inv.id}</td>
                                        <td className="p-2">{accountNames[inv.account_id] || "Loading..."}</td>
                                        <td className="p-2">${inv.amount.toFixed(2)}</td>
                                        <td className="p-2 text-muted-foreground">
                                            {formatDateInTimeZone(inv.due_date, user, {
                                                month: "2-digit",
                                                day: "2-digit",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="p-2">
                                            <button 
                                                className="text-primary underline mr-2"
                                                onClick={() => navigate(`/invoice/${inv.id}`)}
                                            >
                                                View Invoice
                                            </button>
                                            <button 
                                                className="text-primary underline"
                                                onClick={() => navigate(`/account/${inv.account_id}`)}
                                            >
                                                Go to Account
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted-foreground">No unpaid invoices found.</p>
                )}
        </div>
    );
};

UnpaidInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default UnpaidInvoicesPage;
