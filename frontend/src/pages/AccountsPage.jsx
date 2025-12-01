import { useEffect, useState } from "react";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import AccountsPageMobile from "../components/AccountsPageMobile";

const AccountsPage = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!user) return;

        async function loadData() {
            try {
                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
                const accounts = await fetchAccounts();
                setAccounts(accounts);

                const users = await fetchUsers();
                setUsers(users);
            } catch (error) {
                console.error("❌ Error loading accounts data:", error);
            }
        }

        loadData();
    }, [user]); 
    
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = accounts.map(acc => {
            const salesRep = users.find(user => user.user_id === acc.sales_rep_id) || { first_name: "Unassigned", last_name: "" };
            return {
                ...acc,
                sales_rep: salesRep
            };        
        }).filter(acc =>
                acc.business_name.toLowerCase().includes(lowerQuery) ||
                acc.contact_name.toLowerCase().includes(lowerQuery) ||
                acc.phone_number.includes(searchQuery) ||
                acc.email.toLowerCase().includes(lowerQuery) ||
                acc.address.toLowerCase().includes(lowerQuery) ||
                acc.city.toLowerCase().includes(lowerQuery) ||
                acc.state.toLowerCase().includes(lowerQuery) ||
                acc.zip_code.includes(searchQuery) ||
                (acc.sales_rep && (
                    acc.sales_rep.first_name.toLowerCase().includes(lowerQuery) ||
                    acc.sales_rep.last_name.toLowerCase().includes(lowerQuery)
                ))
            );
        setFilteredAccounts(filtered);
    }, [searchQuery, accounts, users]);

    const formatPhoneNumber = (phone) => {
        if (!phone) return "N/A";
        const cleaned = ("" + phone).replace(/\D/g, ""); // Remove non-numeric characters
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        }
        return phone; // Return as-is if not 10 digits
    };
    

    return isMobile ? (
        <AccountsPageMobile
            accounts={accounts}
            onViewAccount={(accountId) => navigate(`/accounts/details/${accountId}`)}
            onCreateNew={() => navigate("/accounts/create")}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filteredAccounts={filteredAccounts}
        />
    ) : (
        <div className="w-full">
            <div className="flex-1 p-4 sm:p-6 mt-16 md:mt-0">
                <h1 className="text-2xl font-bold">Accounts</h1>
                {/* Search Bar and New Account Button*/}
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="Search Accounts"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 border rounded my-4"
                        />
                    </div>
                    <div>
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded shadow-lg"
                            onClick={() => navigate("/accounts/create")}
                        >
                            + New Account
                        </button>
                    </div>
                </div>
                {/* Account List Layout */}
                <div className="space-y-4">
                    {filteredAccounts.map(account => (
                        <div 
                            key={account.account_id} 
                            className="border p-4 rounded-lg shadow flex justify-between items-center bg-white"
                        >
                            {/* Account Details (Left-aligned) */}
                            <div className="text-left">
                                <h2 className="text-lg font-semibold">{account.business_name}</h2>
                                <p className="text-gray-600">
                                    <span className="font-medium">Contact:</span> {account.contact_name} | 
                                    <span className="font-medium"> Phone:</span> {account.phone_number}
                                </p>
                                <p className="text-gray-500"><span className="font-medium">Email:</span> {account.email}</p>
                                <p className="text-gray-500"><span className="font-medium">Address:</span> {account.address}, {account.city}, {account.state} {account.zip_code}</p>
                                {/* Sales Representative Section */}
                                {account.sales_rep ? (
                                    <p className="text-gray-700">
                                        <span className="font-medium">Sales Representative:</span> {account.sales_rep?.first_name || "Unassigned"} {account.sales_rep?.last_name || ""}
                                    </p>
                                ) : (
                                    <p className="text-gray-500">No assigned sales representative.</p>
                                )}
                            </div>

                            {/* Button (Right-aligned) */}
                            <button 
                                className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg"
                                onClick={() => {
                                    console.log(`Navigating to /accounts/details/${account.account_id}`);
                                    if (account.account_id) {
                                        navigate(`/accounts/details/${account.account_id}`);
                                    } else {
                                        console.error("❌ Invalid account_id detected!");
                                    }
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
        user_id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,
};

export default AccountsPage;
