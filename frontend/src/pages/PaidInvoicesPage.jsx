import { useEffect, useState } from "react";
import { fetchPaidInvoices } from "../services/api";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const PaidInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchPaidInvoices(user.id).then(setInvoices);
        }
    }, [user?.id]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Paid Invoices</h1>
            {invoices.length > 0 ? (
                <table className="w-full border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Invoice #</th>
                            <th className="p-2 border">Account</th>
                            <th className="p-2 border">Amount</th>
                            <th className="p-2 border">Date Paid</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id} className="border text-center">
                                <td className="p-2">{inv.id}</td>
                                <td className="p-2">{inv.account_id}</td>
                                <td className="p-2">${inv.amount.toFixed(2)}</td>
                                <td className="p-2">{new Date(inv.date_paid).toLocaleDateString()}</td>
                                <td className="p-2">
                                    <button 
                                        className="text-blue-500 underline"
                                        onClick={() => navigate(`/invoice/${inv.id}`)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No paid invoices found.</p>
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
