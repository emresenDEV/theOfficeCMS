import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInvoiceById, updateInvoice } from "../services/invoiceService";
import { fetchUsers } from "../services/userService";
import PropTypes from "prop-types";

// A simple utility to format currency (e.g. $12,345.67)
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

const EditInvoice = ({ user }) => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesReps, setSalesReps] = useState([]);

  // Local form state – note we show tax_rate and discount_percent as percentages (multiplied by 100)
  const [formData, setFormData] = useState({
    service: "",
    amount: "",
    tax_rate: "", // displayed as percent (e.g., "7" for 7%)
    discount_percent: "", // displayed as percent (e.g., "10" for 10%)
    due_date: "",
    status: "",
    payment_method: "",
    last_four_payment_method: "",
    total_paid: "",
    date_paid: "",
    notes: "",
    user_id: "", // Sales rep id
  });

  // Fetch invoice data and initialize formData (convert decimal rates to percentages)
  useEffect(() => {
    fetchInvoiceById(invoiceId)
      .then((data) => {
        if (!data) throw new Error("Invoice not found");
        const convertedData = {
          ...data,
          tax_rate: data.tax_rate ? (parseFloat(data.tax_rate) * 100).toFixed(2) : "",
          discount_percent: data.discount_percent
            ? (parseFloat(data.discount_percent) * 100).toFixed(2)
            : "",
          amount: data.amount || "",
          due_date: data.due_date || "",
          status: data.status || "",
          payment_method: data.payment_method || "",
          last_four_payment_method: data.last_four_payment_method || "",
          total_paid: data.total_paid || "",
          date_paid: data.date_paid || "",
          notes: data.notes || "",
          user_id: data.user_id || "",
        };
        setInvoice(convertedData);
        setFormData(convertedData);
      })
      .catch((err) => {
        setError("Failed to load invoice.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  // Fetch sales reps for the dropdown
  useEffect(() => {
    fetchUsers()
      .then((usersData) => {
        setSalesReps(usersData);
      })
      .catch((err) => {
        console.error("Failed to fetch sales reps", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // On submit, convert the percentage fields back to decimals
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) / 100 : 0,
        discount_percent: formData.discount_percent
          ? parseFloat(formData.discount_percent) / 100
          : 0,
      };
      const updatedInvoice = await updateInvoice(invoiceId, updatedData);
      navigate(`/invoice/${invoiceId}`);
    } catch (err) {
      setError("Failed to update invoice.");
      console.error(err);
    }
  };

  if (loading) return <p className="text-slate-500 dark:text-slate-400">Loading invoice details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-md">
      {/* Header with Back and Edit buttons */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          className="bg-slate-500 text-white px-4 py-2 rounded"
          onClick={() => navigate(`/invoice/${invoiceId}`)}
        >
          Back to Invoice #{invoiceId} Details
        </button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Invoice #{invoiceId}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left text-slate-700 dark:text-slate-300">Service:</label>
          <input
            type="text"
            name="service"
            value={formData.service}
            onChange={handleChange}
            className="w-2/3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 rounded"
            required
          />
        </div>
        {/* Amount */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left text-slate-700 dark:text-slate-300">Amount:</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            placeholder="$0.00"
            required
          />
        </div>
        {/* Tax Rate */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">Tax Rate:</label>
          <input
            type="number"
            step="0.01"
            name="tax_rate"
            value={formData.tax_rate}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            placeholder="0%"
            required
          />
        </div>
        {/* Discount Percent */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">
            Discount Percent:
          </label>
          <input
            type="number"
            step="0.01"
            name="discount_percent"
            value={formData.discount_percent}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            placeholder="0%"
          />
        </div>
        {/* Due Date */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">Due Date:</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            required
          />
        </div>
        {/* Status */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            required
          >
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="Unpaid">Overdue</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        {/* Payment Method */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">
            Payment Method:
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
          >
            <option value="">Select Payment Method</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Bank Account">Bank Account</option>
          </select>
        </div>
        {/* Last Four Digits (conditionally rendered) */}
        {["Credit Card", "Check", "Bank Account"].includes(
          formData.payment_method
        ) && (
          <div className="flex items-center">
            <label className="w-1/3 text-lg font-bold text-left">
              Last Four Digits:
            </label>
            <input
              type="text"
              name="last_four_payment_method"
              value={formData.last_four_payment_method}
              onChange={handleChange}
              className="w-2/3 border p-2 rounded"
            />
          </div>
        )}
        {/* Total Paid */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">
            Total Paid:
          </label>
          <input
            type="number"
            name="total_paid"
            value={formData.total_paid}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            placeholder="$0.00"
          />
        </div>
        {/* Date Paid */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">
            Date Paid:
          </label>
          <input
            type="date"
            name="date_paid"
            value={formData.date_paid}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
          />
        </div>
        {/* Sales Representative Dropdown */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">
            Sales Representative:
          </label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
            required
          >
            <option value="">Select Sales Rep</option>
            {salesReps.map((rep) => (
              <option key={rep.user_id} value={rep.user_id}>
                {rep.first_name} {rep.last_name} ({rep.username})
              </option>
            ))}
          </select>
        </div>
        {/* Notes */}
        <div className="flex items-center">
          <label className="w-1/3 text-lg font-bold text-left">Notes:</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-2/3 border p-2 rounded"
          />
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => navigate(`/invoice/${invoiceId}`)}
          >
            Back to Invoice #{invoiceId} Details
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

EditInvoice.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }).isRequired,
};

export default EditInvoice;
