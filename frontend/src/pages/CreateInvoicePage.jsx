import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createInvoice } from "../services/invoiceService";
import { fetchAccountById } from "../services/accountService";
import PropTypes from "prop-types";
// FIXME: Missing teh Sidebar component import
const CreateInvoicePage = ({ user }) => {
    const { accountId } = useParams(); // Retrieve account ID if passed
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [invoiceData, setInvoiceData] = useState({
        account_id: accountId || "",
        service: "",
        amount: "",
        tax_rate: 0,
        discount_percent: 0,
        payment_method: "",
        due_date: "",
        sales_employee_id: user?.id || "",
    });

    useEffect(() => {
        if (accountId) {
            fetchAccountById(accountId).then(setAccount);
        }
    }, [accountId]);

    useEffect(() => {
        if (account) {
            setInvoiceData(prevData => ({
                ...prevData,
                account_id: account.account_id,
                tax_rate: account.tax_rate,
            }));
        }
    }, [account]);

    const handleChange = (e) => {
        setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await createInvoice(invoiceData);
        if (response.success) {
            navigate(`/account/${invoiceData.account_id}`);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Create Invoice</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    Service:
                    <input 
                        type="text" 
                        name="service" 
                        className="border p-2 w-full"
                        value={invoiceData.service} 
                        onChange={handleChange} 
                        required 
                    />
                </label>

                <label className="block">
                    Amount:
                    <input 
                        type="number" 
                        name="amount" 
                        className="border p-2 w-full"
                        value={invoiceData.amount} 
                        onChange={handleChange} 
                        required 
                    />
                </label>

                <label className="block">
                    Discount %:
                    <input 
                        type="number" 
                        name="discount_percent" 
                        className="border p-2 w-full"
                        value={invoiceData.discount_percent} 
                        onChange={handleChange} 
                    />
                </label>

                <label className="block">
                    Due Date:
                    <input 
                        type="date" 
                        name="due_date" 
                        className="border p-2 w-full"
                        value={invoiceData.due_date} 
                        onChange={handleChange} 
                        required
                    />
                </label>

                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Save Invoice
                </button>
            </form>
        </div>
    );
};
CreateInvoicePage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default CreateInvoicePage;
