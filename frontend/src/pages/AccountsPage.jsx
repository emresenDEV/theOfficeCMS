import { useEffect, useState } from "react";
import { fetchAccounts } from "../services/accountService";

import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const AccountsPage = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return; 
        fetchAccounts().then(setAccounts);
    }, [user]); 
    
    
    
// TODO: Add section to show sales representative of account
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
            acc.zip_code.includes(searchQuery)
        );
        setFilteredAccounts(filtered);
    }, [searchQuery, accounts]);

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Accounts</h1>
                {/* ✅ Search Bar */}
                <input
                    type="text"
                    placeholder="Search Accounts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border rounded my-4"
                />
                {/* ✅ Account List Layout */}
                <div className="space-y-4">
                    {filteredAccounts.map(account => (
                        <div 
                            key={account.account_id} 
                            className="border p-4 rounded-lg shadow flex justify-between items-center bg-white"
                        >
                            {/* 🔹 Account Details (Left-aligned) */}
                            <div className="text-left">
                                <h2 className="text-lg font-semibold">{account.business_name}</h2>
                                <p className="text-gray-600">
                                    <span className="font-medium">Contact:</span> {account.contact_name} | 
                                    <span className="font-medium"> Phone:</span> {account.phone_number}
                                </p>
                                <p className="text-gray-500"><span className="font-medium">Email:</span> {account.email}</p>
                                <p className="text-gray-500"><span className="font-medium">Address:</span> {account.address}, {account.city}, {account.state} {account.zip_code}</p>
                            </div>

                            {/* 🔹 Button (Right-aligned) */}
                            <button 
                                className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg"
                                onClick={() => {
                                    console.log(`Navigating to /accounts/details/${account.account_id}`);
                                    navigate(`/accounts/details/${account.account_id}`);
                                }}
                            >
                                View Account
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
