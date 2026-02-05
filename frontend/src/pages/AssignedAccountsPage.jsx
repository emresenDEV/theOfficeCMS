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
            <h1 className="text-2xl font-bold mb-4 text-foreground">Assigned Accounts</h1>
                {accounts.length > 0 ? (
                    <table className="w-full border border-border text-foreground">
                        <thead>
                            <tr className="bg-muted">
                                <th className="p-2 border border-border">Account #</th>
                                <th className="p-2 border border-border">Business Name</th>
                                <th className="p-2 border border-border">Contact Name</th>
                                <th className="p-2 border border-border">Phone</th>
                                <th className="p-2 border border-border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.account_id} className="border border-border text-center">
                                    <td className="p-2">{acc.account_id}</td>
                                    <td className="p-2">{acc.business_name}</td>
                                    <td className="p-2">{acc.contact_name}</td>
                                    <td className="p-2">{acc.phone_number}</td>
                                    <td className="p-2">
                                        <button 
                                            className="text-primary underline"
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
                    <p className="text-muted-foreground">No assigned accounts found.</p>
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
