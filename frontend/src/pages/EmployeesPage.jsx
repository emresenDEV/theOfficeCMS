import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";
import { fetchUsers } from "../services/userService";

const EmployeesPage = ({ user }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchUsers(user.id).then(setUserData);
        }
    }, [user?.id]);

    if (!userData) {
        return <p className="text-center text-gray-600">Loading employee data...</p>;
    }

    const {
        first_name,
        last_name,
        username,
        user_id,
        phone_number,
        extension,
        email,
        role_name,
        reports_to,
        is_department_lead,
        department_name,
        salary,
        receives_commission,
        commission_rate
        // industries,
    } = userData;

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Employee Information</h1>
                <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <p><strong>Name:</strong> {first_name} {last_name}</p>
                    <p><strong>User Name:</strong> {username}</p>
                    <p><strong>User ID:</strong> {user_id}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Phone:</strong> {phone_number}</p>
                    <p><strong>Extension:</strong> {extension}</p>
                    <p><strong>Role:</strong> {role_name}</p>
                    <p><strong>Reports To:</strong> {reports_to || "N/A"}</p>
                    <p><strong>Department:</strong> {department_name}</p>
                    <p><strong>Department Lead:</strong> {is_department_lead}</p>
                    <p><strong>Salary:</strong> ${salary.toLocaleString()}</p>
                    {receives_commission && (
                        <>
                            <p><strong>Commission Rate:</strong> {commission_rate}%</p>
                            <h2 className="text-lg font-semibold mt-4">Sales Information</h2>
                            {/* <p><strong>Industries Served:</strong> {industries?.join(", ") || "N/A"}</p> */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

EmployeesPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
        role: PropTypes.string,
    }).isRequired,
};

export default EmployeesPage;
