import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInvoiceById, fetchNotesByInvoice, updateInvoice, deleteInvoice } from "../services/api";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const InvoiceDetailsPage = ({ user }) => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [notes, setNotes] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchInvoiceById(invoiceId)
            .then((data) => {
                if (!data) throw new Error("Invoice not found");
                setInvoice(data);
                setFormData(data);
            })
            .catch((error) => {
                console.error("Error fetching invoice:", error);
                setInvoice(null);
            });

        fetchNotesByInvoice(invoiceId)
            .then(setNotes)
            .catch((error) => console.error("Error fetching notes:", error));
    }, [invoiceId]);

    if (!invoice) return <p className="text-center text-gray-600">Loading invoice details...</p>;

    const handleEditChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = () => {
        updateInvoice(invoiceId, formData).then((updatedInvoice) => {
            setInvoice(updatedInvoice);
            setIsEditing(false);
        });
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            deleteInvoice(invoiceId).then(() => navigate("/invoices"));
        }
    };

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold mb-4">Invoice #{invoice.invoice_id}</h1>

                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-2">Invoice Details</h2>
                    <p><strong>Account ID:</strong> {invoice.account_id}</p>
                    <p><strong>Service:</strong> {invoice.service || "N/A"}</p>
                    <p><strong>Amount:</strong> ${invoice.amount?.toFixed(2) || "0.00"}</p>
                    <p><strong>Status:</strong> {invoice.status}</p>
                    <p><strong>Due Date:</strong> {invoice.due_date || "N/A"}</p>
                    <p><strong>Payment Method:</strong> {invoice.payment_method || "N/A"}</p>

                    {/* Edit Form */}
                    {isEditing ? (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">Edit Invoice</h3>
                            <label className="block mt-2">Amount:
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount} 
                                    onChange={handleEditChange} 
                                    className="border p-2 w-full"
                                />
                            </label>
                            <label className="block mt-2">Status:
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleEditChange} 
                                    className="border p-2 w-full"
                                >
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </label>
                            <label className="block mt-2">Due Date:
                                <input 
                                    type="date" 
                                    name="due_date" 
                                    value={formData.due_date} 
                                    onChange={handleEditChange} 
                                    className="border p-2 w-full"
                                />
                            </label>
                            <button onClick={handleSaveChanges} className="bg-green-500 text-white px-4 py-2 rounded mt-4">Save</button>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-4 ml-2">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded">Edit Invoice</button>
                    )}

                    {/* Delete Button */}
                    <button onClick={handleDelete} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Delete Invoice</button>
                </div>

                {/* Notes Section */}
                <h2 className="text-xl font-semibold mt-6">Notes</h2>
                {notes.length > 0 ? (
                    <ul className="border border-gray-300 rounded-lg mt-2">
                        {notes.map(note => (
                            <li key={note.note_id} className="border-b p-3">
                                {note.note_text} - {note.completed ? "✅ Completed" : "⏳ Pending"}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-gray-600">No notes available for this invoice.</p>
                )}

                {/* Navigation */}
                <button onClick={() => navigate("/invoices")} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded">Back to Invoices</button>
            </div>
        </div>
    );
};

InvoiceDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default InvoiceDetailsPage;
