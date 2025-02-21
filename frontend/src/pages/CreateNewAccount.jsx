import { useState, useEffect } from "react";
import { fetchIndustries, createIndustry } from "../services/industryService";
import { fetchSalesReps } from "../services/userService";
import { fetchBranches } from "../services/branchService";
import { createAccount } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const CreateNewAccountPage = () => {
    const navigate = useNavigate();
    
    const [industries, setIndustries] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [branches, setBranches] = useState([]);
    
    const [accountData, setAccountData] = useState({
        business_name: "",
        contact_name: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        industry_id: "",
        user_id: "",
        branch_id: "",
        notes: "",
    });

    const [newIndustry, setNewIndustry] = useState("");
    const [showNewIndustryInput, setShowNewIndustryInput] = useState(false);

    useEffect(() => {
        async function loadDropdownData() {
            const fetchedIndustries = await fetchIndustries();
            setIndustries(fetchedIndustries);
            const fetchedBranches = await fetchBranches();
            setBranches(fetchedBranches);
            const fetchedSalesReps = await fetchSalesReps();
            setSalesReps(fetchedSalesReps);
        }
        loadDropdownData();
    }, []);

    // ✅ Handle Form Input Changes
    const handleChange = (e) => {
        setAccountData({ ...accountData, [e.target.name]: e.target.value });
    };

    // ✅ Handle Industry Selection
    const handleIndustryChange = (e) => {
        const value = e.target.value;
        if (value === "new") {
            setShowNewIndustryInput(true);
        } else {
            setAccountData({ ...accountData, industry_id: value });
            setShowNewIndustryInput(false);
        }
    };

    // ✅ Handle Creating New Industry
    const handleCreateIndustry = async () => {
        if (!newIndustry.trim()) return;
        const response = await createIndustry(newIndustry);
        if (response && response.industry_id) {
            setIndustries([...industries, { industry_id: response.industry_id, industry_name: newIndustry }]);
            setAccountData({ ...accountData, industry_id: response.industry_id });
            setNewIndustry("");
            setShowNewIndustryInput(false);
        }
    };

    // ✅ Handle Form Submission
    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     const response = await createAccount(accountData);
    //     if (response) navigate("/accounts");
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Sanitize the data
        const sanitizedData = {
            ...accountData,
            industry_id: accountData.industry_id ? parseInt(accountData.industry_id) : null,
            user_id: accountData.user_id ? parseInt(accountData.user_id) : null,
            branch_id: accountData.branch_id ? parseInt(accountData.branch_id) : null,
        };
    
        console.log("🚀 Submitting sanitized account data:", sanitizedData);
    
        // Send the sanitized data to the backend
        const createdAccount = await createAccount(sanitizedData);
        if (createdAccount) {
            navigate("/accounts");
        } else {
            alert("❌ Failed to create the account. Please fill out all required fields.");
        }
    };
    

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg ml-64">
            <h1 className="text-2xl font-bold">Create New Account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                    type="text"
                    placeholder="Business Name"
                    className="w-full p-2 border rounded"
                    value={accountData.business_name}
                    onChange={(e) => setAccountData({ ...accountData, business_name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Contact Name"
                    className="w-full p-2 border rounded"
                    value={accountData.contact_name}
                    onChange={(e) => setAccountData({ ...accountData, contact_name: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full p-2 border rounded"
                    value={accountData.phone_number}
                    onChange={(e) => setAccountData({ ...accountData, phone_number: e.target.value })}
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                />
                <input 
                    type="text" 
                    name="address" 
                    placeholder="Address" 
                    onChange={handleChange} 
                    className="border p-2 w-full" 
                />
                <input 
                    type="text" 
                    name="city" 
                    placeholder="City" 
                    onChange={handleChange} 
                    className="border p-2 w-full" 
                />
                <input 
                    type="text" 
                    name="state" 
                    placeholder="State" 
                    onChange={handleChange} 
                    className="border p-2 w-full" 
                />
                <input 
                    type="text" 
                    name="zip_code" 
                    placeholder="Zip Code" 
                    onChange={handleChange} 
                    className="border p-2 w-full" 
                />

                {/* ✅ Industry Selection */}
                <select 
                    name="industry_id" 
                    value={accountData.industry_id || ""}
                    onChange={(e) => setAccountData({ ...accountData, industry_id: e.target.value || null })} 
                    className="border p-2 w-full"
                >
                    <option value="">Select Industry</option>
                        {industries.map(ind => (
                            <option key={ind.industry_id} value={ind.industry_id}>
                                {ind.industry_name}
                        </option>
                    ))}
                    <option value="new">➕ Add New Industry</option>
                </select>

                {/* ✅ New Industry Input */}
                {showNewIndustryInput && (
                    <div className="flex">
                        <input 
                            type="text" 
                            placeholder="New Industry Name" 
                            value={newIndustry} 
                            onChange={(e) => setNewIndustry(e.target.value)} 
                            className="border p-2 w-full" 
                        />
                        <button 
                            type="button" 
                            onClick={handleCreateIndustry} 
                            className="bg-green-500 text-white px-4 ml-2"
                        >
                            Save
                        </button>
                    </div>
                )}

                {/* ✅ Sales Representative Selection */}
                <select
                    className="w-full p-2 border rounded"
                    value={accountData.user_id || ""}
                    onChange={(e) => setAccountData({ ...accountData, user_id: e.target.value || null})}
                >
                    <option value="">No Sales Representative Assigned</option>
                    {salesReps.map(rep => (
                        <option key={rep.user_id} value={rep.user_id}>
                            {rep.first_name} {rep.last_name}
                        </option>
                    ))}
                </select>

                {/* ✅ Branch Selection */}
                <select 
                    name="branch_id" 
                    value={accountData.branch_id || ""}
                    onChange={(e) => setAccountData({ ...accountData, branch_id: e.target.value || null })}
                    className="border p-2 w-full"
                >
                    <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_id}>
                                {branch.branch_name}
                            </option>
                        ))}
                </select>

                <textarea 
                    name="notes" 
                    placeholder="Initial Notes" 
                    onChange={handleChange} 
                    className="border p-2 w-full"
                >
                </textarea>

                <button 
                    type="submit" 
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Create Account
                </button>
            </form>
        </div>
    );
};



CreateNewAccountPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,
};

export default CreateNewAccountPage;
