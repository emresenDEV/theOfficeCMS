import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails, updateAccount } from "../services/accountService";
import { fetchIndustries, createIndustry } from "../services/industryService";
import { fetchSalesReps } from "../services/userService";
import { fetchBranches } from "../services/branchService";
import { useLocation } from "react-router-dom"; 
import PropTypes from "prop-types";
import { set } from "date-fns";



const UpdateAccountPage = () => {
    const location = useLocation();
    const user = location.state?.user;
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [accountData, setAccountData] = useState({
        business_name: "",
        contact_first_name: "",
        contact_last_name: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        region: "",
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

    // useEffect(() => {
    //     async function loadAccountAndDropdowns() {
    //         try {
    //             const [fetchedAccount, fetchedIndustries, fetchedSalesReps, fetchedBranches] = await Promise.all([
    //                 fetchAccountDetails(accountId),
    //                 fetchIndustries(),
    //                 fetchSalesReps(),
    //                 fetchBranches(),
    //             ]);
    
    //             if (fetchedAccount) {
    //                 setAccountData({
    //                     ...fetchedAccount,
    //                     industry_id: fetchedIndustries.find(ind => ind.industry_name === fetchedAccount.industry)?.industry_id || "",
    //                     user_id: fetchedAccount.sales_rep?.user_id ? String(fetchedAccount.sales_rep.user_id) : "",
    //                     branch_id: fetchedAccount.branch?.branch_id
    //                         ? String(fetchedAccount.branch.branch_id)
    //                         : (fetchedAccount.sales_rep?.branch_id ? String(fetchedAccount.sales_rep.branch_id) : ""),


    //                 });
    
    //                 // ✅ Ensure dropdown options include the current values
    //                 const updatedSalesReps = [...fetchedSalesReps];
    //                 if (
    //                     fetchedAccount.sales_rep &&
    //                     !fetchedSalesReps.some(rep => String(rep.user_id) === String(fetchedAccount.sales_rep.user_id))
    //                 ) {
    //                     updatedSalesReps.push({
    //                         user_id: fetchedAccount.sales_rep.user_id,
    //                         first_name: fetchedAccount.sales_rep.first_name || "Unknown",
    //                         last_name: fetchedAccount.sales_rep.last_name || "User",
    //                     });
    //                 }
    
    //                 const updatedBranches = [...fetchedBranches];
    //                 if (
    //                     fetchedAccount.branch &&
    //                     !fetchedBranches.some(branch => String(branch.branch_id) === String(fetchedAccount.branch.branch_id))
    //                 ) {
    //                     updatedBranches.push({
    //                         branch_id: fetchedAccount.branch.branch_id,
    //                         branch_name: fetchedAccount.branch.branch_name || "Unknown Branch",
    //                     });
    //                 } else if (
    //                     fetchedAccount.sales_rep &&
    //                     !fetchedBranches.some(branch => String(branch.branch_id) === String(fetchedAccount.sales_rep.branch_id))
    //                 ) {
    //                     updatedBranches.push({
    //                         branch_id: fetchedAccount.sales_rep.branch_id,
    //                         branch_name: "Unknown Branch",
    //                     });
    //                 }

    //                 const updatedIndustries = [...fetchedIndustries];
    //                 if (
    //                     fetchedAccount.industry &&
    //                     !fetchedIndustries.some(ind => ind.industry_name === fetchedAccount.industry)
    //                 ) {
    //                     updatedIndustries.push({
    //                         industry_id: fetchedAccount.industry_id,
    //                         industry_name: fetchedAccount.industry || "Unknown Industry",
    //                     });
    //                 }
    
    //                 setIndustries(updatedIndustries);
    //                 setSalesReps(updatedSalesReps);
    //                 setBranches(updatedBranches);
    //             }
    
    //             setIsDataLoaded(true);
    //         } catch (error) {
    //             console.error("❌ Error loading account and dropdown data:", error);
    //         }
    //     }
    
    //     loadAccountAndDropdowns();
    // }, [accountId]);
    useEffect(() => {
        async function loadAccountAndDropdowns() {
            try {
                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
                const fetchedAccount = await fetchAccountDetails(accountId);
                const fetchedIndustries = await fetchIndustries();
                const fetchedSalesReps = await fetchSalesReps();
                const fetchedBranches = await fetchBranches();

                if (fetchedAccount) {
                    // ✅ Format Date and Time of Last Update
                    const formatDateTime = (dateString) => {
                        if (!dateString) return "N/A";
                        return new Date(dateString).toLocaleString("en-US", { 
                            month: "2-digit", day: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true 
                        });
                    };
    
                    setAccountData({
                        ...fetchedAccount,
                        contact_first_name: fetchedAccount.contact_first_name || "",
                        contact_last_name: fetchedAccount.contact_last_name || "",
                        industry_id: fetchedIndustries.find(ind => ind.industry_name === fetchedAccount.industry)?.industry_id || "",
                        user_id: fetchedAccount.sales_rep?.user_id ? String(fetchedAccount.sales_rep.user_id) : "",
                        branch_id: fetchedAccount.branch?.branch_id
                            ? String(fetchedAccount.branch.branch_id)
                            : (fetchedAccount.sales_rep?.branch_id ? String(fetchedAccount.sales_rep.branch_id) : ""),
                        lastUpdated: formatDateTime(fetchedAccount.date_updated),  // ✅ Last updated timestamp
                        updatedBy: fetchedAccount.updated_by_username || "Unknown", // ✅ Username of last editor
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
    
    
    const handleSalesRepChange = (e) => {
        const selectedRepId = e.target.value;
    
        // Find the corresponding sales rep
        const selectedRep = salesReps.find(rep => rep.user_id.toString() === selectedRepId);
    
        setAccountData({
            ...accountData,
            user_id: selectedRepId || "",
            branch_id: selectedRep ? selectedRep.branch_id : "",
        });
    };
    
    
    
    
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

    // const handleSubmit = async (e) => {
    //     e.preventDefault(); // Prevent default form behavior
    
    //     try {
    //         console.log("🔄 Sending account update request:", accountData);
    
    //         // ✅ Validate essential fields before sending
    //         if (!accountData.business_name) {
    //             alert("❌ Business name is required.");
    //             return;
    //         }
    
    //         // ✅ Preserve existing values if dropdowns aren't changed
    //         const sanitizedData = {
    //             ...accountData,
    //             branch_id: accountData.branch_id || accountData.branch?.branch_id || null,
    //             industry_id: accountData.industry_id || null,
    //             user_id: accountData.user_id || null,
    //         };
    
    //         console.log("🔍 Sanitized account data:", sanitizedData);
    //         const response = await updateAccount(accountId, sanitizedData);
    
    //         if (response && response.success) {
    //             console.log("✅ Account updated successfully:", response.data);
    //             alert("✅ Account updated successfully!");
    //             navigate(`/accounts/details/${accountId}`);
    //         } else {
    //             console.error("❌ Failed to update account:", response.message || response);
    //             alert("❌ Failed to update account. Please try again.");
    //         }
    //     } catch (error) {
    //         console.error("❌ Error during account update:", error);
    //         alert("❌ An error occurred. Please try again later.");
    //     }
    // };
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
                updated_by_user_id: user?.user_id || null // Track the user performing the update
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
        return <p className="text-muted-foreground text-center">Loading account details...</p>;
    }
    

    return (
        <div className="max-w-2xl mx-auto p-6 bg-card border border-border shadow-lg rounded-lg">
            {/* 🔙 Back Button */}
            <div className="flex justify-between items-center mb-4">
                <button
                    className="bg-muted hover:bg-muted text-black px-3 py-2 rounded"
                    onClick={() => navigate(`/accounts/details/${accountId}`)}
                >
                    ← Back to Account
                </button>
            </div>

            <h1 className="text-2xl font-bold mb-4">Update Account</h1>
            <div className="text-muted-foreground text-sm mb-4 text-left">
                <p><strong>Last Updated:</strong> {accountData.lastUpdated}</p>
                <p><strong>Updated By:</strong> {accountData.updatedBy}</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ✅ Business Name */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Business Name</label>
                <input 
                    type="text" 
                    name="business_name" 
                    value={accountData.business_name} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Contact First/Last Name */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Contact First Name</label>
                <input 
                    type="text" 
                    name="contact_first_name" 
                    value={accountData.contact_first_name} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                />
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Contact Last Name</label>
                <input 
                    type="text" 
                    name="contact_last_name" 
                    value={accountData.contact_last_name} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                />
                {/* ✅ Phone Number */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Phone Number</label>
                <input 
                    type="text" 
                    name="phone_number" 
                    value={accountData.phone_number} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Address */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Address</label>
                <input 
                    type="text" 
                    name="address" 
                    value={accountData.address} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ City */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">City</label>
                <input 
                    type="text" 
                    name="city" 
                    value={accountData.city} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ State */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">State</label>
                <input 
                    type="text" 
                    name="state" 
                    value={accountData.state} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Zip Code */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">ZipCode</label>
                <input 
                    type="text" 
                    name="zipcode" 
                    value={accountData.zip_code} 
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4" 
                    required
                />
                {/* ✅ Region */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Region</label>
                <input
                    type="text"
                    name="region"
                    value={accountData.region || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded mb-4"
                />
                {/* ✅ Industry Dropdown */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Industry</label>
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
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Sales Representative</label>
                <select 
                    name="user_id" 
                    className="w-full p-2 border rounded mb-4"
                    value={accountData.user_id || ""} 
                    onChange={handleSalesRepChange}
                >
                    <option value="">No Sales Rep Assigned</option>
                    {salesReps.map(rep => (
                        <option key={`salesRep-${rep.user_id}`} value={String(rep.user_id)}>
                        {rep.first_name} {rep.last_name}
                    </option>
                    ))}
                </select>
                {/* ✅ Branch Dropdown */}
                <label className="block text-lg font-semibold text-muted-foreground mb-2 text-left">Branch</label>
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
                <div className="flex justify-end mt-6">
                    <button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md"
                    >
                        Save
                    </button>
                </div>

            </form>
        </div>
    );
};

// ✅ Add PropTypes Validation
UpdateAccountPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
    }).isRequired,

    account: PropTypes.shape({
        account_id: PropTypes.number.isRequired,
        business_name: PropTypes.string.isRequired,
        contact_first_name: PropTypes.string,
        contact_last_name: PropTypes.string,
        phone_number: PropTypes.string,
        email: PropTypes.string,
        address: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        zip_code: PropTypes.string,
        region: PropTypes.string,
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
