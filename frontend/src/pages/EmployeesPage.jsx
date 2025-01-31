import { useEffect, useState } from "react"; //useState holds list of employees-manages the component state, useEffect runs the mount to fetch employees.
import { fetchEmployees } from "../services/api";

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);

    useEffect (() => {
        fetchEmployees().then((data) => setEmployees(data));
    }, []);

    return (
        <div>
            <h1>Employees</h1>
            <ul>
                {employees.length > 0 ? (
                    employees.map((emp) => (
                        <li key={emp.employee_id}>
                            {emp.first_name} {emp.last_name} - Role ID: {emp.role_id}
                        </li>
                    ))
                ) : (
                    <p>Loading employees...</p>
                )}
            </ul>
        </div>
    );
};

export default EmployeesPage;