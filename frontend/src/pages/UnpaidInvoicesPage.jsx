import { useEffect, useState } from "react";
import { fetchUnpaidInvoices, fetchAccountById } from "../services/api";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const UnpaidInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [accountNames, setAccountNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchUnpaidInvoices(user.id).then(data => {
                setInvoices(data);

                data.forEach(inv => {
                    if (!accountNames[inv.account_id]) {
                        fetchAccountById(inv.account_id).then(account => {
                            setAccountNames(prev => ({ ...prev, [inv.account_id]: account.business_name }));
                        });
                    }
                });
            });
        }
    }, [user?.id]);

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold mb-4">Unpaid Invoices</h1>
                {invoices.length > 0 ? (
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Invoice #</th>
                                <th className="p-2 border">Account</th>
                                <th className="p-2 border">Amount</th>
                                <th className="p-2 border">Due Date</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id} className="border text-center">
                                    <td className="p-2">{inv.id}</td>
                                    <td className="p-2">{accountNames[inv.account_id] || "Loading..."}</td>
                                    <td className="p-2">${inv.amount.toFixed(2)}</td>
                                    <td className="p-2 text-yellow-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-500 underline mr-2"
                                            onClick={() => navigate(`/invoice/${inv.id}`)}
                                        >
                                            View Invoice
                                        </button>
                                        <button 
                                            className="text-green-500 underline"
                                            onClick={() => navigate(`/account/${inv.account_id}`)}
                                        >
                                            Go to Account
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No unpaid invoices found.</p>
                )}
            </div>
        </div>
    );
};

UnpaidInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default UnpaidInvoicesPage;
