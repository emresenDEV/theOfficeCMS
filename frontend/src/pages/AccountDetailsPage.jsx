import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountById } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount } from "../services/notesService";
import PropTypes from "prop-types";

const AccountDetailsPage = () => {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        fetchAccountById(accountId).then(setAccount);
        fetchInvoiceByAccount(accountId).then(setInvoices);
        fetchNotesByAccount(accountId).then(setNotes);
    }, [accountId]);

    if (!account) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">{account.business_name}</h1>
            <p>Contact: {account.contact_name}</p>
            <p>Email: {account.email}</p>
            <p>Phone: {account.phone_number}</p>

            {/* Invoice List */}
            <h2 className="text-xl font-semibold mt-4">Invoices</h2>
            <ul>
                {invoices.map(inv => (
                    <li key={inv.invoice_id} className="border p-2">
                        Invoice #{inv.invoice_id} - ${inv.final_total}
                        <button 
                            className="ml-4 text-blue-600"
                            onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                        >
                            View
                        </button>
                    </li>
                ))}
            </ul>

            {/* Notes/Tasks */}
            <h2 className="text-xl font-semibold mt-4">Notes & Tasks</h2>
            <ul>
                {notes.map(note => (
                    <li key={note.note_id} className="border p-2">
                        {note.note_text} - {note.completed ? "✅ Completed" : "⏳ Pending"}
                    </li>
                ))}
            </ul>

            <button 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate(`/create-invoice/${account.account_id}`)}
            >
                Create Invoice
            </button>
        </div>
    );
};

AccountDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default AccountDetailsPage;
