import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount } from "../services/notesService";
import PropTypes from "prop-types";

const AccountDetailsPage = () => {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // ✅ Fetch account details
                const fetchedAccount = await fetchAccountDetails(accountId);
                setAccount(fetchedAccount);

                // ✅ Fetch invoices associated with this account
                const fetchedInvoices = await fetchInvoiceByAccount(accountId);
                setInvoices(fetchedInvoices);

                // ✅ Fetch notes/tasks linked to the account
                const fetchedNotes = await fetchNotesByAccount(accountId);
                setNotes(fetchedNotes);

            } catch (error) {
                console.error("❌ Error loading account details:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [accountId]);

    if (loading) {
        return <p className="text-gray-600 text-center">Loading account details...</p>;
    }

    if (!account) {
        return <p className="text-red-600 text-center">Account not found.</p>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            {/* ✅ Account Details */}
            <h1 className="text-2xl font-bold text-blue-700">{account.business_name}</h1>
            <p className="text-gray-700"><strong>Contact:</strong> {account.contact_name || "N/A"}</p>
            <p className="text-gray-700"><strong>Email:</strong> {account.email || "No email provided"}</p>
            <p className="text-gray-700"><strong>Phone:</strong> {account.phone_number || "No phone number"}</p>
            <p className="text-gray-700"><strong>Industry:</strong> {account.industry || "N/A"}</p>

            {/* ✅ Invoice Section */}
            <h2 className="text-xl font-semibold mt-6">Invoices</h2>
            {invoices.length > 0 ? (
                <ul className="mt-2 border rounded-lg overflow-hidden">
                    {invoices.map(inv => (
                        <li key={inv.invoice_id} className="flex justify-between items-center border-b p-3">
                            <span className="font-medium">
                                Invoice #{inv.invoice_id} - ${inv.final_total.toFixed(2)}
                            </span>
                            <span 
                                className={`px-2 py-1 text-sm font-semibold rounded 
                                    ${inv.status === "Paid" ? "bg-green-500 text-white" : 
                                    inv.status === "Past Due" ? "bg-red-500 text-white" : 
                                    "bg-yellow-500 text-black"}`}
                            >
                                {inv.status}
                            </span>
                            <button 
                                className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                            >
                                View
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 mt-2">No invoices found.</p>
            )}

            {/* ✅ Notes/Tasks Section */}
            <h2 className="text-xl font-semibold mt-6">Notes & Tasks</h2>
            {notes.length > 0 ? (
                <ul className="mt-2 border rounded-lg overflow-hidden">
                    {notes.map(note => (
                        <li key={note.note_id} className="border-b p-3">
                            <span className={note.completed ? "line-through text-gray-500" : "text-black"}>
                                {note.note_text}
                            </span>
                            <span className="ml-3 text-sm">
                                {note.completed ? "✅ Completed" : "⏳ Pending"}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 mt-2">No notes or tasks available.</p>
            )}

            {/* ✅ Create Invoice Button */}
            <button 
                className="mt-6 bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded-lg"
                onClick={() => navigate(`/create-invoice/${account.account_id}`)}
            >
                ➕ Create Invoice
            </button>
        </div>
    );
};

// ✅ PropTypes Validation
AccountDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default AccountDetailsPage;
