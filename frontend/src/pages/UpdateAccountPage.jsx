import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails, updateAccount } from "../services/accountService";
import { fetchIndustries, createIndustry } from "../services/industryService";
import { fetchSalesReps } from "../services/userService";
import { fetchBranches } from "../services/branchService";
import PropTypes from "prop-types";
import { set } from "date-fns";

// FIXME: SalesRep, Branch, and Industry Dropdowns are not pre-selected with existing values.

const UpdateAccountPage = () => {
    const { accountId } = useParams();
    const navigate = useNavigate();
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
    const [industries, setIndustries] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [branches, setBranches] = useState([]);
    const [newIndustry, setNewIndustry] = useState("");
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        async function loadAccountAndDropdowns() {
            try {
                const [fetchedAccount, fetchedIndustries, fetchedSalesReps, fetchedBranches] = await Promise.all([
                    fetchAccountDetails(accountId),
                    fetchIndustries(),
                    fetchSalesReps(),
                    fetchBranches(),
                ]);
    
                if (fetchedAccount) {
                    setAccountData({
                        ...fetchedAccount,
                        industry_id: fetchedIndustries.find(ind => ind.industry_name === fetchedAccount.industry)?.industry_id || "",
                        user_id: fetchedAccount.sales_rep?.user_id ? String(fetchedAccount.sales_rep.user_id) : "",
                        branch_id: fetchedAccount.branch?.branch_id
                            ? String(fetchedAccount.branch.branch_id)
                            : (fetchedAccount.sales_rep?.branch_id ? String(fetchedAccount.sales_rep.branch_id) : ""),


                    });
    
                    // ✅ Ensure dropdown options include the current values
                    const updatedSalesReps = [...fetchedSalesReps];
                    if (
                        fetchedAccount.sales_rep &&
                        !fetchedSalesReps.some(rep => String(rep.user_id) === String(fetchedAccount.sales_rep.user_id))
                    ) {
                        updatedSalesReps.push({
                            user_id: fetchedAccount.sales_rep.user_id,
                            first_name: fetchedAccount.sales_rep.first_name || "Unknown",
                            last_name: fetchedAccount.sales_rep.last_name || "User",
                        });
                    }
    
                    const updatedBranches = [...fetchedBranches];
                    if (
                        fetchedAccount.branch &&
                        !fetchedBranches.some(branch => String(branch.branch_id) === String(fetchedAccount.branch.branch_id))
                    ) {
                        updatedBranches.push({
                            branch_id: fetchedAccount.branch.branch_id,
                            branch_name: fetchedAccount.branch.branch_name || "Unknown Branch",
                        });
                    } else if (
                        fetchedAccount.sales_rep &&
                        !fetchedBranches.some(branch => String(branch.branch_id) === String(fetchedAccount.sales_rep.branch_id))
                    ) {
                        updatedBranches.push({
                            branch_id: fetchedAccount.sales_rep.branch_id,
                            branch_name: "Unknown Branch",
                        });
                    }

                    const updatedIndustries = [...fetchedIndustries];
                    if (
                        fetchedAccount.industry &&
                        !fetchedIndustries.some(ind => ind.industry_name === fetchedAccount.industry)
                    ) {
                        updatedIndustries.push({
                            industry_id: fetchedAccount.industry_id,
                            industry_name: fetchedAccount.industry || "Unknown Industry",
                        });
                    }
    
                    setIndustries(updatedIndustries);
                    setSalesReps(updatedSalesReps);
                    setBranches(updatedBranches);
                }
    
                setIsDataLoaded(true);
            } catch (error) {
                console.error("❌ Error loading account and dropdown data:", error);
            }
        }
    
        loadAccountAndDropdowns();
    }, [accountId]);
    
    
    
    
    
    const handleChange = (e) => {
        setAccountData({ ...accountData, [e.target.name]: e.target.value });
    };

    // const handleIndustryChange = async (e) => {
    const handleIndustryChange = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "new") {
            setNewIndustry("");
            setAccountData({ ...accountData, industry_id: "" });
        } else {
            setAccountData({ ...accountData, industry_id: selectedValue });
        }
    };

    const handleSaveNewIndustry = async () => {
        if (!newIndustry) return;
        const industryData = await createIndustry({ industry_name: newIndustry });
        if (industryData) {
            setIndustries([...industries, industryData]);
            setAccountData({ ...accountData, industry_id: industryData.industry_id });
            setNewIndustry("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form behavior
    
        try {
            console.log("🔄 Sending account update request:", accountData);
    
            // ✅ Validate essential fields before sending
            if (!accountData.business_name) {
                alert("❌ Business name is required.");
                return;
            }
    
            // ✅ Preserve existing values if dropdowns aren't changed
            const sanitizedData = {
                ...accountData,
                branch_id: accountData.branch_id || accountData.branch?.branch_id || null,
                industry_id: accountData.industry_id || null,
                user_id: accountData.user_id || null,
            };
    
            console.log("🔍 Sanitized account data:", sanitizedData);
            const response = await updateAccount(accountId, sanitizedData);
    
            if (response && response.success) {
                console.log("✅ Account updated successfully:", response.data);
                alert("✅ Account updated successfully!");
                navigate(`/accounts/details/${accountId}`);
            } else {
                console.error("❌ Failed to update account:", response.message || response);
                alert("❌ Failed to update account. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error during account update:", error);
            alert("❌ An error occurred. Please try again later.");
        }
    };
    
    
    
    
    if (!isDataLoaded) {
        return <p className="text-gray-600 text-center">Loading account details...</p>;
    }
    

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg ml-64">
            {/* 🔙 Back Button */}
            <button
                className="mb-4 bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded"
                onClick={() => navigate(`/accounts/details/${accountId}`)}
            >
                ← Back to Account
            </button>
            <h1 className="text-2xl font-bold mb-4">Update Account</h1>
            <form onSubmit={handleSubmit}>
                {/* ✅ Business Name */}
                <label className="block mb-2">Business Name</label>
                <input 
                    type="text" 
                    name="business_name" 
                    value={accountData.business_name} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Contact Name */}
                <label className="block mb-2">Contact Name</label>
                <input 
                    type="text" 
                    name="contact_name" 
                    value={accountData.contact_name} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Phone Number */}
                <label className="block mb-2">Phone Number</label>
                <input 
                    type="text" 
                    name="phone_number" 
                    value={accountData.phone_number} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Address */}
                <label className="block mb-2">Address</label>
                <input 
                    type="text" 
                    name="address" 
                    value={accountData.address} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ City */}
                <label className="block mb-2">City</label>
                <input 
                    type="text" 
                    name="city" 
                    value={accountData.city} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ State */}
                <label className="block mb-2">State</label>
                <input 
                    type="text" 
                    name="state" 
                    value={accountData.state} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Zip Code */}
                <label className="block mb-2">ZipCode</label>
                <input 
                    type="text" 
                    name="zipcode" 
                    value={accountData.zip_code} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Industry Dropdown */}
                <label className="block mb-2">Industry</label>
                <select 
                    name="industry_id" 
                    className="w-full p-2 border rounded mb-4" 
                    value={accountData.industry_id || ""} 
                    onChange={handleIndustryChange}
                >
                    <option value="">Select an Industry</option>
                    {industries.map(industry => (
                        <option key={`industry-${industry.industry_id}`} value={String(industry.industry_id)}>
                        {industry.industry_name}
                    </option>
                    ))}
                    <option value="new">Add New Industry</option>
                </select>
                {/* ✅ Add New Industry */}
                {newIndustry !== "" && (
                    <div className="mb-4">
                        <input 
                            type="text" 
                            placeholder="New Industry Name" 
                            className="w-full p-2 border rounded mb-2"
                            value={newIndustry} 
                            onChange={(e) => setNewIndustry(e.target.value)}
                        />
                        <button 
                            onClick={handleSaveNewIndustry} 
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Save Industry
                        </button>
                    </div>
                )}
                {/* ✅ Sales Representative Dropdown */}
                <label className="block mb-2">Sales Representative</label>
                <select 
                    name="user_id" 
                    className="w-full p-2 border rounded mb-4"
                    value={accountData.user_id || ""} 
                    onChange={(e) => setAccountData({ ...accountData, user_id: e.target.value || null })}
                >
                    <option value="">No Sales Rep Assigned</option>
                    {salesReps.map(rep => (
                        <option key={`salesRep-${rep.user_id}`} value={String(rep.user_id)}>
                        {rep.first_name} {rep.last_name}
                    </option>
                    ))}
                </select>
                {/* ✅ Branch Dropdown */}
                <label className="block mb-2">Branch</label>
                <select 
                    name="branch_id" 
                    className="w-full p-2 border rounded mb-4"
                    value={accountData.branch_id || ""} 
                    onChange={(e) => setAccountData({ ...accountData, branch_id: e.target.value || null })}
                >
                    <option value="">Select a Branch</option>
                    {branches.map(branch => (
                        <option key={`branch-${branch.branch_id}`} value={String(branch.branch_id)}>
                        {branch.branch_name || ""}
                    </option>
                    ))}
                </select>

                 {/* ✅ Submit Button */}
                <button 
                    type="submit" 
                    className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                >
                    Update Account
                </button>
            </form>
        </div>
    );
};

// ✅ Add PropTypes Validation
UpdateAccountPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,

    account: PropTypes.shape({
        account_id: PropTypes.number.isRequired,
        business_name: PropTypes.string.isRequired,
        contact_name: PropTypes.string,
        phone_number: PropTypes.string,
        email: PropTypes.string,
        address: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        zip_code: PropTypes.string,
        industry_id: PropTypes.number,
        user_id: PropTypes.number,
        branch_id: PropTypes.number,
        date_created: PropTypes.string,
        date_updated: PropTypes.string,
    }).isRequired,

    industries: PropTypes.arrayOf(
        PropTypes.shape({
            industry_id: PropTypes.number.isRequired,
            industry_name: PropTypes.string.isRequired,
        })
    ).isRequired,

    salesReps: PropTypes.arrayOf(
        PropTypes.shape({
            user_id: PropTypes.number.isRequired,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
        })
    ).isRequired,

    branches: PropTypes.arrayOf(
        PropTypes.shape({
            branch_id: PropTypes.number.isRequired,
            branch_name: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default UpdateAccountPage;

