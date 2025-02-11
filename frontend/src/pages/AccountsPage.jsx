import { useEffect, useState } from "react";
import { fetchAccounts } from "../services/accountService";
import { fetchInvoices } from "../services/invoiceService";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const AccountsPage = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return; // ✅ Ensure user exists before making API call
        fetchAccounts().then(setAccounts);
    }, [user]); // ✅ Runs when user state changes
    
    
    

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = accounts.filter(acc =>
            acc.business_name.toLowerCase().includes(lowerQuery) ||
            acc.contact_name.toLowerCase().includes(lowerQuery) ||
            acc.phone_number.includes(searchQuery) ||
            acc.email.toLowerCase().includes(lowerQuery) ||
            acc.address.toLowerCase().includes(lowerQuery) ||
            acc.city.toLowerCase().includes(lowerQuery) ||
            acc.state.toLowerCase().includes(lowerQuery) ||
            acc.zip_code.includes(searchQuery) ||
            (acc.invoice_number && acc.invoice_number.includes(searchQuery))
        );
        setFilteredAccounts(filtered);
    }, [searchQuery, accounts]);

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Accounts</h1>
                <input
                    type="text"
                    placeholder="Search Accounts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border rounded my-4"
                />
                <div>
                    {filteredAccounts.map(account => (
                        <div key={account.account_id} className="border p-4 rounded-lg shadow my-2">
                            <h2 className="text-lg font-semibold">{account.business_name}</h2>
                            <p>Contact: {account.contact_name} | Phone: {account.phone_number}</p>
                            <p>Email: {account.email}</p>
                            <p>Address: {account.address}, {account.city}, {account.state} {account.zip_code}</p>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate(`/create-invoice?account_id=${account.account_id}`)} >
                                Create Invoice
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

AccountsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,
};

export default AccountsPage;
