import { useEffect, useState } from "react";
import { fetchInvoices } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar"; 
import PropTypes from "prop-types";

const InvoicesPage = ({ user, handleLogout }) => {
    const [invoices, setInvoices] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const status = searchParams.get("status") || "All"; 

    useEffect(() => {
        if (user) {
            fetchInvoices(user.id).then((data) => {
                if (status === "All") {
                    setInvoices(data);
                } else {
                    setInvoices(data.filter(inv => inv.status === status));
                }
            });
        }
    }, [user, status]);

    return (
        <div className="flex">
            {/* ✅ Sidebar always visible on the left */}
            <Sidebar user={user} handleLogout={handleLogout} />

            {/* Main Content Area */}
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">{status} Invoices</h1>

                {invoices.length > 0 ? (
                    <table className="w-full border border-gray-200 mt-4">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Invoice #</th>
                                <th className="p-2 border">Amount</th>
                                <th className="p-2 border">Status</th>
                                <th className="p-2 border">Due Date</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.invoice_id} className="border text-center">
                                    <td className="p-2">{inv.invoice_id}</td>
                                    <td className="p-2">${inv.amount.toFixed(2)}</td>
                                    <td className="p-2">{inv.status}</td>
                                    <td className="p-2">{inv.due_date || "N/A"}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-600 underline"
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
                    <p className="mt-4 text-gray-600">No invoices found.</p>
                )}

                <button 
                    onClick={() => navigate("/")} 
                    className="mt-4 bg-blue-500 text-white p-2 rounded"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

InvoicesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired
    }).isRequired,
    handleLogout: PropTypes.func.isRequired,
};

export default InvoicesPage;
