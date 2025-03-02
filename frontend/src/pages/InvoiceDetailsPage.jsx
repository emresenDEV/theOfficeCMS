import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
fetchInvoiceById, 
updateInvoice, 
deleteInvoice, 
fetchPaymentMethods 
} from "../services/invoiceService";
import { fetchNotesByInvoice } from "../services/notesService";
import Sidebar from "../components/Sidebar";
import NotesSection from "../components/NotesSection";
import PropTypes from "prop-types";
import { format } from "date-fns";

const InvoiceDetailsPage = ({ user }) => {
const { invoiceId } = useParams();
const navigate = useNavigate();

const [invoice, setInvoice] = useState(null);
const [notes, setNotes] = useState([]);
const [isLoggingPayment, setIsLoggingPayment] = useState(false);
const [formData, setFormData] = useState({});
const [paymentMethods, setPaymentMethods] = useState([]);
const [paymentData, setPaymentData] = useState({
    payment_method: "",
    last_four_payment_method: "",
    total_paid: 0,
    date_paid: format(new Date(), "yyyy-MM-dd"),
});

// Fetch invoice, notes, and payment methods
useEffect(() => {
    fetchInvoiceById(invoiceId)
    .then((data) => {
        if (!data) throw new Error("Invoice not found");
        // Massage the fetched data with fallback defaults
        const invoiceData = {
        ...data,
        discount_amount: data.discount_amount != null ? parseFloat(data.discount_amount) : 0,
        discount_percent: data.discount_percent != null ? parseFloat(data.discount_percent) : 0,
        tax_rate: data.tax_rate != null ? parseFloat(data.tax_rate) : 0,
        tax_amount: data.tax_amount != null ? parseFloat(data.tax_amount) : 0,
        final_total: data.final_total != null ? parseFloat(data.final_total) : 0,
        commission_amount: data.commission_amount != null ? parseFloat(data.commission_amount) : 0,
        };
        setInvoice(invoiceData);
        setFormData(invoiceData);
        setPaymentData((prev) => ({
        ...prev,
        total_paid: invoiceData.final_total,
        }));
    })
    .catch((error) => {
        console.error("Error fetching invoice:", error);
        setInvoice(null);
    });

    fetchNotesByInvoice(invoiceId)
    .then(setNotes)
    .catch((error) => console.error("Error fetching notes:", error));

    fetchPaymentMethods()
    .then(setPaymentMethods)
    .catch((error) => console.error("Error fetching payment methods:", error));
}, [invoiceId]);

// Handle payment form changes
const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
};

// Log payment (update invoice)
const handleLogPayment = () => {
    const updatedInvoiceData = {
    ...invoice,
    payment_method: paymentData.payment_method,
    last_four_payment_method: paymentData.last_four_payment_method,
    total_paid: paymentData.total_paid,
    date_paid: paymentData.date_paid,
    status: "Paid",
    };

    updateInvoice(invoiceId, updatedInvoiceData).then((updatedInvoice) => {
    setInvoice(updatedInvoice);
    setIsLoggingPayment(false);
    });
};

// Delete invoice
const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
    deleteInvoice(invoiceId).then(() => navigate(`/accounts/details/${invoice.account_id}`));
    }
};

// Refresh notes
const refreshNotes = async () => {
    try {
    const updatedNotes = await fetchNotesByInvoice(invoiceId);
    setNotes(updatedNotes);
    } catch (error) {
    console.error("Error refreshing notes:", error);
    }
};

// Format currency values
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    }).format(amount);
};

// Automatically update status if due date has passed
useEffect(() => {
    if (invoice && new Date(invoice.due_date) < new Date() && invoice.status === "Pending") {
    setFormData((prev) => ({ ...prev, status: "Unpaid" }));
    }
}, [invoice]);

if (!invoice) return <p className="text-center text-gray-600">Loading invoice details...</p>;

return (
    <div className="flex">
    <Sidebar user={user} />
    <div className="flex-1 p-6 ml-64">
        {/* Header with Back, Invoice #, and Edit buttons */}
        <div className="flex items-center justify-between mb-6">
        <button 
            onClick={() => navigate(`/accounts/details/${invoice.account_id}`)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Back to Account Details
        </button>
        <h1 className="text-3xl font-bold text-blue-700">
            Invoice #{invoice.invoice_id}
        </h1>
        <button 
            onClick={() => navigate(`/invoice/${invoice.invoice_id}/edit`)}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
            Edit Invoice
        </button>
        </div>

        {/* Business Information Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 text-left">Business Information</h2>
        <div className="space-y-2 text-left">
            <p><strong>Business Name:</strong> {invoice.business_name || "N/A"}</p>
            <p><strong>Address:</strong> {invoice.address || "N/A"}</p>
            <p><strong>City, State, Zip Code:</strong> {invoice.city || "N/A"}, {invoice.state || "N/A"} {invoice.zip_code || "N/A"}</p>
            <p><strong>Phone Number:</strong> {invoice.phone_number || "N/A"}</p>
        </div>
        </div>

        {/* Sales Representative Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 text-left">Sales Representative</h2>
        <div className="space-y-2 text-left">
            <p><strong>Name:</strong> {invoice.sales_rep ? `${invoice.sales_rep.first_name} ${invoice.sales_rep.last_name}` : "N/A"}</p>
            <p><strong>Email:</strong> {invoice.sales_rep?.email || "N/A"}</p>
            <p><strong>Phone:</strong> {invoice.sales_rep?.phone_number || "N/A"}</p>
        </div>
        </div>

        {/* Service Details Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 text-left">Service Details</h2>
        <div className="space-y-2 text-left">
            <p><strong>Service:</strong> {invoice.service || "N/A"}</p>
            <p><strong>Price:</strong> {formatCurrency(invoice.amount)}</p>
            <p><strong>Discount:</strong> {formatCurrency(invoice.discount_amount)}</p>
            <p><strong>Discount Percent:</strong> {invoice.discount_percent ? (invoice.discount_percent * 100).toFixed(2) : "0.00"}%</p>
        </div>
        </div>

        {/* Financial Details Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 text-left">Financial Details</h2>
        <div className="space-y-2 text-left">
            <p><strong>Tax Rate:</strong> {invoice.tax_rate ? (invoice.tax_rate * 100).toFixed(2) : "0.00"}%</p>
            <p><strong>Tax Amount:</strong> {formatCurrency(invoice.tax_amount)}</p>
            <p><strong>Final Total:</strong> {formatCurrency(invoice.final_total)}</p>
        </div>
        </div>

        {/* Commissions Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-700 mb-4 text-left">Commissions</h2>
        <div className="space-y-2 text-left">
            <p><strong>Sales Representative:</strong> {invoice.sales_rep ? `${invoice.sales_rep.first_name} ${invoice.sales_rep.last_name}` : "N/A"}</p>
            <p><strong>Commission Amount:</strong> {formatCurrency(invoice.commission_amount)}</p>
        </div>
        </div>

        {/* Log Payment Block */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border-2 border-blue-500">
        {/* Header: label on left, button on right */}
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-700">Log Payment</h2>
            {!isLoggingPayment && (
            <button
                onClick={() => setIsLoggingPayment(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
                Log Payment
            </button>
            )}
        </div>
        {/* Payment Form: Only show when logging payment */}
        {isLoggingPayment && (
            <div className="space-y-4 text-left">
            <label className="block">
                Payment Method:
                <select
                name="payment_method"
                value={paymentData.payment_method}
                onChange={handlePaymentChange}
                className="border p-2 w-full rounded"
                >
                <option value="">Select Payment Method</option>
                {paymentMethods.map((method) => (
                    <option key={method.method_id} value={method.method_name}>
                    {method.method_name}
                    </option>
                ))}
                </select>
            </label>
            {["Credit Card", "Check", "Bank Account"].includes(paymentData.payment_method) && (
                <label className="block">
                Last Four Digits:
                <input
                    type="text"
                    name="last_four_payment_method"
                    value={paymentData.last_four_payment_method}
                    onChange={handlePaymentChange}
                    placeholder={`Enter the last four digits of the ${paymentData.payment_method} used`}
                    className="border p-2 w-full rounded"
                />
                </label>
            )}
            <label className="block">
                Total Paid:
                <input
                type="number"
                name="total_paid"
                value={paymentData.total_paid}
                onChange={handlePaymentChange}
                className="border p-2 w-full rounded"
                />
            </label>
            <label className="block">
                Date Paid:
                <input
                type="date"
                name="date_paid"
                value={paymentData.date_paid}
                onChange={handlePaymentChange}
                className="border p-2 w-full rounded"
                />
            </label>
            <div className="flex space-x-2">
                <button
                onClick={handleLogPayment}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                Log Payment
                </button>
                <button
                onClick={() => setIsLoggingPayment(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                Cancel
                </button>
            </div>
            </div>
        )}
        </div>

        {/* Notes Section */}
        <NotesSection
        notes={notes}
        accountId={invoice.account_id}
        userId={user.id}
        setNotes={setNotes}
        refreshNotes={refreshNotes}
        invoiceId={invoiceId}
        />

        {/* Delete Invoice Button */}
        <div className="flex justify-end mt-6">
        <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
            Delete Invoice
        </button>
        </div>
    </div>
    </div>
);
};

InvoiceDetailsPage.propTypes = {
user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string,
}).isRequired,
};

export default InvoiceDetailsPage;
