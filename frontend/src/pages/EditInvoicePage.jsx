import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInvoice, updateInvoice } from "../services/api";
import PropTypes from "prop-types";

const EditInvoice = () => {
    const { invoiceId } = useParams(); // Get invoice ID from URL
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoice(invoiceId)
            .then(setInvoice)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [invoiceId]);

    const handleChange = (e) => {
        setInvoice({ ...invoice, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateInvoice(invoiceId, invoice);
            navigate(`/invoices/${invoiceId}`); // Redirect to invoice details
        } catch (err) {
            setError("Failed to update invoice");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow-md">
            <h2 className="text-2xl font-bold mb-4">Edit Invoice</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Service</label>
                    <input type="text" name="service" value={invoice.service || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Amount</label>
                    <input type="number" name="amount" value={invoice.amount || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Discount (%)</label>
                    <input type="number" name="discount_percent" value={invoice.discount_percent || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Tax Rate</label>
                    <input type="number" name="tax_rate" value={invoice.tax_rate || ""} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Payment Method</label>
                    <select name="payment_method" value={invoice.payment_method || ""} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="">Select Payment Method</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Cash">Cash</option>
                        <option value="Check">Check</option>
                    </select>
                </div>
                <div className="flex justify-between mt-4">
                    <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

EditInvoice.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
    invoice: PropTypes.shape({
        invoice_id: PropTypes.number.isRequired,
        account_id: PropTypes.number.isRequired,
        service: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        tax_rate: PropTypes.number.isRequired,
        tax_amount: PropTypes.number.isRequired,
        discount_percent: PropTypes.number,
        discount_amount: PropTypes.number,
        final_total: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        paid: PropTypes.bool.isRequired,
        payment_method: PropTypes.string,
        last_four_payment_method: PropTypes.string,
        total_paid: PropTypes.number,
        date_paid: PropTypes.string,
        notes: PropTypes.string,
        date_created: PropTypes.string.isRequired,
        date_updated: PropTypes.string.isRequired,
        sales_employee_id: PropTypes.number.isRequired,
        commission_amount: PropTypes.number.isRequired,
    }).isRequired,
};

export default EditInvoice;
