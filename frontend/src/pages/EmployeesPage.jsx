import { useEffect, useState } from "react";
import { fetchEmployees } from "../services/api";
import Sidebar from "../components/Sidebar";
import PropTypes from "prop-types";

const EmployeesPage = ({ user }) => {
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchEmployees(user.id).then(setEmployeeData);
        }
    }, [user?.id]);

    if (!employeeData) {
        return <p className="text-center text-gray-600">Loading employee data...</p>;
    }

    const {
        first_name,
        last_name,
        phone_number,
        email,
        role_name,
        reports_to,
        department_name,
        salary,
        receives_commission,
        commission_rate,
        regions,
        region_zipcodes,
        industries,
    } = employeeData;

    return (
        <div className="flex">
            <Sidebar user={user} />
            <div className="flex-1 p-6 ml-64">
                <h1 className="text-2xl font-bold">Employee Information</h1>
                <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <p><strong>Name:</strong> {first_name} {last_name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Phone:</strong> {phone_number}</p>
                    <p><strong>Role:</strong> {role_name}</p>
                    <p><strong>Reports To:</strong> {reports_to || "N/A"}</p>
                    <p><strong>Department:</strong> {department_name}</p>
                    <p><strong>Salary:</strong> ${salary.toLocaleString()}</p>
                    {receives_commission && (
                        <>
                            <p><strong>Commission Rate:</strong> {commission_rate}%</p>
                            <h2 className="text-lg font-semibold mt-4">Sales Information</h2>
                            <p><strong>Assigned Regions:</strong> {regions?.join(", ") || "N/A"}</p>
                            <p><strong>Region Zipcodes:</strong> {region_zipcodes?.join(", ") || "N/A"}</p>
                            <p><strong>Industries Served:</strong> {industries?.join(", ") || "N/A"}</p>
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
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        role: PropTypes.string,
    }).isRequired,
};

export default EmployeesPage;
