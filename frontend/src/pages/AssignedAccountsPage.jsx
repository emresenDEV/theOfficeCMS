import { useEffect, useState } from "react";
import { fetchAssignedAccounts } from "../services/accountService";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const AssignedAccountsPage = ({ user }) => {
    const [accounts, setAccounts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id) {
            fetchAssignedAccounts(user.id).then(setAccounts);
        }
    }, [user?.id]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Assigned Accounts</h1>
                {accounts.length > 0 ? (
                    <table className="w-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Account #</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Business Name</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Contact Name</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Phone</th>
                                <th className="p-2 border border-slate-200 dark:border-slate-800">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.account_id} className="border border-slate-200 dark:border-slate-800 text-center">
                                    <td className="p-2">{acc.account_id}</td>
                                    <td className="p-2">{acc.business_name}</td>
                                    <td className="p-2">{acc.contact_name}</td>
                                    <td className="p-2">{acc.phone_number}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-blue-500 dark:text-blue-300 underline"
                                            onClick={() => navigate(`/account/${acc.account_id}`)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">No assigned accounts found.</p>
                )}
        </div>
    );
};

AssignedAccountsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default AssignedAccountsPage;
