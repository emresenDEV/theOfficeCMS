import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";
import { fetchUserProfile } from "../services/userService";

const EmployeesPage = ({ user }) => {
    console.log("EmployeesPage - User prop:", user); //debugging
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || !user.user_id) {
            console.error("Invalid user prop - missing user_id");
            return;
        }

        const fetchData = async () => {
            try {
                const data = await fetchUserProfile(user.user_id);
                console.log("Fetched user data:", data);
                setUserData(data);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.user_id]);

    if (loading) return <div className="text-muted-foreground">Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">My Info</h1>
            <div className="bg-card border border-border p-6 rounded-lg shadow-md text-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                            <p><span className="font-medium">First Name:</span> {userData.first_name}</p>
                            <p><span className="font-medium">Last Name:</span> {userData.last_name}</p>
                            <p><span className="font-medium">Username:</span> {userData.username}</p>
                            <p><span className="font-medium">User ID:</span> {userData.user_id}</p>
                            <p><span className="font-medium">Email:</span> {userData.email}</p>
                            <p><span className="font-medium">Phone Number:</span> {userData.phone_number}</p>
                            <p><span className="font-medium">Extension:</span> {userData.extension}</p>
                        </div>

                        {/* Role Information */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Role Information</h2>
                            <p><span className="font-medium">Role:</span> {userData.role_name}</p>
                            <p><span className="font-medium">Role Description:</span> {userData.role_description}</p>
                            <p><span className="font-medium">Department Lead:</span> {userData.is_department_lead ? "Yes" : "No"}</p>
                            <p><span className="font-medium">Reports To:</span> {userData.reports_to_name}</p>
                            <p><span className="font-medium">Department:</span> {userData.department_name}</p>
                            <p><span className="font-medium">Salary:</span> ${userData.salary?.toLocaleString()}</p>
                            <p><span className="font-medium">Commission Rate:</span> {(userData.commission_rate * 100).toFixed(2)}%</p>
                            <p><span className="font-medium">Receives Commission:</span> {userData.receives_commission ? "Yes" : "No"}</p>
                        </div>
                    </div>

                    {/* Branch Information */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">Branch Information</h2>
                        <p><span className="font-medium">Branch Name:</span> {userData.branch_name}</p>
                        <p><span className="font-medium">Address:</span> {userData.branch_address}</p>
                        <p><span className="font-medium">City:</span> {userData.branch_city}</p>
                        <p><span className="font-medium">State:</span> {userData.branch_state}</p>
                        <p><span className="font-medium">Zip Code:</span> {userData.branch_zip_code}</p>
                        <p><span className="font-medium">Phone Number:</span> {userData.branch_phone_number}</p>
                    </div>

                    {/* Employment Details */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">Employment Details</h2>
                        <p>
                            <span className="font-medium">Date Created:</span>{" "}
                            {formatDateInTimeZone(userData.date_created, null, {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                            })}
                        </p>
                        <p>
                            <span className="font-medium">Last Updated:</span>{" "}
                            {formatDateInTimeZone(userData.date_updated, null, {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </div>
        </div>
    );
};

EmployeesPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
    }).isRequired,
};

export default EmployeesPage;
