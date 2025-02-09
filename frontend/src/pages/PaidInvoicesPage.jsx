import { useEffect, useState } from "react";
import { fetchPaidInvoices } from "../services/api";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const PaidInvoicesPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchPaidInvoices(user.id).then((data) => {
                console.log("📌 API Data - Paid Invoices:", data); // ✅ Debug Log
                if (Array.isArray(data)) {
                    setInvoices(data);
                } else {
                    console.error("❌ Data is not an array:", data);
                }
            });
        }
    }, [user?.id]);

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold mb-4">Paid Invoices</h1>
                {invoices.length > 0 ? (
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Invoice #</th>
                                <th className="p-2 border">Account</th>
                                <th className="p-2 border">Amount</th>
                                <th className="p-2 border">Date Paid</th>
                                <th className="p-2 border">Payment Method</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">{inv.account_id}</td>
                                    <td className="p-2">${inv.amount.toFixed(2)}</td>
                                    <td className="p-2">{inv.date_paid !== "N/A" ? new Date(inv.date_paid).toLocaleDateString() : "N/A"}</td>
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
                    <p>No paid invoices found.</p>
                )}
            </div>
        </div>
    );
};

PaidInvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default PaidInvoicesPage;
