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
            // const fetchedIndustries = await fetchIndustries();
            // setIndustries(fetchedIndustries);
            const fetchedIndustries = await fetchIndustries();
            console.log("✅ Industries Fetched:", fetchedIndustries); // Debugging log

            if (Array.isArray(fetchedIndustries) && fetchedIndustries.length > 0) {
                setIndustries(fetchedIndustries);
            } else {
                console.error("❌ Expected an array, but received:", fetchedIndustries);
            }

            const fetchedBranches = await fetchBranches();
            setBranches(fetchedBranches);
            const fetchedSalesReps = await fetchSalesReps();
            setSalesReps(fetchedSalesReps);
        }
        loadDropdownData();
    }, []);

    // Handle Form Input Changes
    const handleChange = (e) => {
        setAccountData({ ...accountData, [e.target.name]: e.target.value });
    };
    
    const handleSalesRepChange = (e) => {
        const selectedRepId = e.target.value;
        
        // Find the selected sales rep
        const selectedRep = salesReps.find(rep => rep.user_id.toString() === selectedRepId);
    
        setAccountData({
            ...accountData,
            user_id: selectedRepId || "",
            branch_id: selectedRep ? selectedRep.branch_id : "",
        });
    };
    

    // Handle Industry Selection
    const handleIndustryChange = (e) => {
        const value = e.target.value;
        if (value === "new") {
            setShowNewIndustryInput(true);
        } else {
            setAccountData({ ...accountData, industry_id: value });
            setShowNewIndustryInput(false);
        }
    };

    // Handle Creating New Industry
    const handleCreateIndustry = async () => {
        if (!newIndustry.trim()) return;
    
        // Check for duplicate industry
        const isDuplicate = industries.some(ind => ind.industry_name.toLowerCase() === newIndustry.toLowerCase());
        if (isDuplicate) {
            alert("❌ Industry already exists!");
            return;
        }
    
        try {
            const response = await createIndustry(newIndustry);
            if (response && response.industry_id) {
                const updatedIndustries = [...industries, { industry_id: response.industry_id, industry_name: newIndustry }];
                setIndustries(updatedIndustries);
                setAccountData({ ...accountData, industry_id: response.industry_id });
                setNewIndustry("");
                setShowNewIndustryInput(false);
    
                console.log("✅ Industry added successfully:", newIndustry, updatedIndustries);
            } else {
                console.error("❌ Failed to create industry. Response:", response);
            }
        } catch (error) {
            console.error("❌ Error creating industry:", error);
        }
    };
    
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
        <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create New Account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                    type="text"
                    placeholder="Business Name"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded"
                    value={accountData.business_name}
                    onChange={(e) => setAccountData({ ...accountData, business_name: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Contact Name"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded"
                    value={accountData.contact_name}
                    onChange={(e) => setAccountData({ ...accountData, contact_name: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded"
                    value={accountData.phone_number}
                    onChange={(e) => setAccountData({ ...accountData, phone_number: e.target.value })}
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded"
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

                {/* Industry Selection */}
                <select 
                    name="industry_id" 
                    value={accountData.industry_id || ""}
                    onChange={handleIndustryChange} 
                    className="border p-2 w-full"
                >
                    <option value="">Select Industry</option>
                    {industries.length > 0 ? (
                        industries.map(ind => (
                            <option key={ind.industry_id} value={ind.industry_id}>
                                {ind.industry_name}
                            </option>
                        ))
                    ) : (
                        <option disabled>No industries available</option>
                    )}
                    <option value="new">➕ Add New Industry</option>
                </select>

                {/* Show input field when "Add New Industry" is selected */}
                {showNewIndustryInput && (
                    <div className="flex mt-2">
                        <input 
                            type="text" 
                            placeholder="Enter new industry" 
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


                {/* Sales Representative Selection */}
                <select
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded"
                    value={accountData.user_id || ""}
                    // onChange={(e) => setAccountData({ ...accountData, user_id: e.target.value || null})}
                    onChange={handleSalesRepChange}
                >
                    <option value="">No Sales Representative Assigned</option>
                    {salesReps.map(rep => (
                        <option key={rep.user_id} value={rep.user_id}>
                            {rep.first_name} {rep.last_name}
                        </option>
                    ))}
                </select>

                {/* Branch Selection */}
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
        user_id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,
};

export default CreateNewAccountPage;
