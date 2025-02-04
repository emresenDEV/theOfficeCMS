import { useEffect, useState } from "react";
import { fetchEmployees, fetchInvoices, fetchCommissions } from "../services/api";
import { FiUsers, FiFileText, FiDollarSign } from "react-icons/fi";
import PropTypes from "prop-types";

const Dashboard = () => {
const [employees, setEmployees] = useState([]);
const [invoices, setInvoices] = useState([]);
const [commissions, setCommissions] = useState([]);

useEffect(() => {
    fetchEmployees().then(setEmployees);
    fetchInvoices().then(setInvoices);
    fetchCommissions().then(setCommissions);
}, []);

return (
<div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<FiUsers />} label="Employees" value={employees.length} />
            <StatCard icon={<FiFileText />} label="Invoices" value={invoices.length} />
            <StatCard icon={<FiDollarSign />} label="Commissions" value={commissions.length} />
        </div>
</div>
);
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white shadow-md p-4 rounded-lg flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
            <div>
                <p className="text-lg font-semibold">{label}</p>
                <p className="text-xl">{value}</p>
            </div>
    </div>
);
// Define propTypes for the StatCard component
StatCard.propTypes = {
    icon: PropTypes.element.isRequired, // icon is a React element
    label: PropTypes.string.isRequired, // label is a string
    value: PropTypes.oneOfType([ // value is a number or a string
        PropTypes.number,
        PropTypes.string,
    ]).isRequired,
};


export default Dashboard;
