import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { fetchDepartments, fetchEmployees } from "../services/tasksService";

const CreateTaskComponent = ({
user,
branches,
accounts,
onCreateTask,
}) => {
const currentUserId = user?.user_id ?? user?.id ?? "";
const [newTask, setNewTask] = useState({
    task_description: "",
    due_date: "",
    account_id: "",
    account_name: "",
});
const [assignedToMe, setAssignedToMe] = useState(true);
const [useMyBranch, setUseMyBranch] = useState(true);
const [useMyDepartment, setUseMyDepartment] = useState(true);
const [selectedBranch, setSelectedBranch] = useState(user.branch_id || "");
const [selectedDepartment, setSelectedDepartment] = useState(
    user.department_id || ""
);
const [selectedEmployee, setSelectedEmployee] = useState(currentUserId || "");
const [accountSearch, setAccountSearch] = useState("");
const [filteredAccounts, setFilteredAccounts] = useState([]);
const [departments, setDepartments] = useState([]);
const [employees, setEmployees] = useState([]);

// Dynamic account search
useEffect(() => {
    if (accountSearch.trim() === "") {
    setFilteredAccounts([]); // Clear results if search is empty
    return;
    }

    // Filter accounts based on the search term
    const matches = accounts.filter((account) =>
    account.business_name.toLowerCase().includes(accountSearch.toLowerCase())
    );
    setFilteredAccounts(matches);
}, [accountSearch, accounts]);

// Automatically set branch, department, and employee when "Assigned to Me" is checked
useEffect(() => {
    if (assignedToMe) {
    setUseMyBranch(true);
    setUseMyDepartment(true);
    setSelectedBranch(user.branch_id);
    setSelectedDepartment(user.department_id);
    setSelectedEmployee(currentUserId);
    }
}, [assignedToMe, user]);

// Automatically set branch when "My Branch" is checked
useEffect(() => {
    if (useMyBranch) {
        setSelectedBranch(user.branch_id);
    }
}, [useMyBranch, user]);

// Automatically set department when "My Department" is checked
useEffect(() => {
    if (useMyDepartment) {
        setSelectedDepartment(user.department_id);
    }
}, [useMyDepartment, user]);

// Fetch departments when selectedBranch changes
useEffect(() => {
    if (selectedBranch) {
        fetchDepartments(selectedBranch).then((data) => {
        console.log("Fetched Departments:", data);
        setDepartments(data);
        });
    } else {
      setDepartments([]); // Clear departments if no branch is selected
    }
    }, [selectedBranch]);

// Fetch employees when selectedDepartment changes
useEffect(() => {
    if (selectedDepartment) {
        fetchEmployees(selectedDepartment).then((data) => {
        console.log("Fetched Employees:", data);
        setEmployees(data);
        });
    } else {
      setEmployees([]); // Clear employees if no department is selected
    }
    }, [selectedDepartment]);

// DEBUGGING CONSOLE STATEMENTS: FIXME: delete these before deployment
useEffect(() => {
    console.log("Selected Branch:", selectedBranch);
    }, [selectedBranch]);
    
    useEffect(() => {
    console.log("Selected Department:", selectedDepartment);
    }, [selectedDepartment]);


const handleCreateTask = () => {
    if (!newTask.task_description.trim() || !newTask.due_date) {
    alert("⚠️ Task description and due date are required.");
    return;
    }

    const taskData = {
    ...newTask,
    user_id: currentUserId,
    task_description: newTask.task_description,
    due_date: newTask.due_date,
    assigned_to: assignedToMe ? currentUserId : selectedEmployee,
    branch_id: useMyBranch ? user.branch_id : selectedBranch,
    department_id: useMyDepartment ? user.department_id : selectedDepartment,
    account_id: newTask.account_id || null,
    };

    onCreateTask(taskData);
};

return (
    <div className="bg-card border border-border p-6 rounded-lg shadow-md mt-4">
    <h2 className="text-lg font-semibold text-foreground">Create a New Task</h2>
    <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Task Description */}
        <input
        type="text"
        value={newTask.task_description}
        onChange={(e) =>
            setNewTask({ ...newTask, task_description: e.target.value })
        }
        placeholder="Task Description"
        className="border border-border bg-card text-foreground p-2 rounded w-full"
        />

        {/* Due Date */}
        <input
        type="date"
        value={newTask.due_date}
        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
        className="border border-border bg-card text-foreground p-2 rounded w-full"
        />

        {/* Account Search */}
        <div className="relative">
        <input
            type="text"
            value={accountSearch}
            onChange={(e) => setAccountSearch(e.target.value)}
            placeholder="Search for an account..."
            className="border border-border bg-card text-foreground p-2 rounded w-full"
        />
        {filteredAccounts.length > 0 && (
            <ul className="absolute bg-card border border-border w-full mt-1 rounded shadow-lg max-h-48 overflow-y-auto">
            {filteredAccounts.map((account) => (
                <li
                key={account.account_id}
                onClick={() => {
                    setNewTask({
                    ...newTask,
                    account_id: account.account_id,
                    account_name: account.business_name,
                    });
                    setAccountSearch(account.business_name);
                    setFilteredAccounts([]); // Hide dropdown after selection
                }}
                className="p-2 hover:bg-muted cursor-pointer text-foreground"
                >
                {account.business_name}
                </li>
            ))}
            </ul>
        )}
        </div>
    </div>

    {/* Toggles and Dropdowns */}
    <div className="mt-4">
        <div className="flex items-center gap-4">
        <label className="flex items-center">
            <input
            type="checkbox"
            checked={assignedToMe}
            onChange={() => setAssignedToMe(!assignedToMe)}
            className="mr-2"
            />
            Assigned to Me
        </label>
        <label>
            <input
            type="checkbox"
            checked={useMyBranch}
            onChange={() => setUseMyBranch(!useMyBranch)}
            disabled={assignedToMe}
            className="mr-2"
            />
            My Branch
        </label>
        <label>
            <input
            type="checkbox"
            checked={useMyDepartment}
            onChange={() => setUseMyDepartment(!useMyDepartment)}
            disabled={assignedToMe}
            className="mr-2"
            />
            My Department
        </label>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Branch Dropdown */}
        <select
            value={useMyBranch ? user.branch_id : selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={assignedToMe || useMyBranch}
            className="border p-2 rounded w-full"
        >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
            <option key={branch.branch_id} value={branch.branch_id}>
                {branch.branch_name}
            </option>
            ))}
        </select>

        {/* Department Dropdown */}
        <select
            value={useMyDepartment ? user.department_id : selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={assignedToMe || useMyDepartment}
            className="border p-2 rounded w-full"
        >
            <option value="">Select Department</option>
            {departments.map(dept => (
                <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name} {/* Show department name */}
                </option>
            ))}
        </select>

        {/* Employee Dropdown */}
        <select 
            value={assignedToMe ? currentUserId : selectedEmployee} 
            onChange={(e) => setSelectedEmployee(e.target.value)} 
            disabled={assignedToMe} // Disabled when "Assigned to Me" is checked
            className="border p-2 rounded w-full"
        >
            <option value="">Select Employee</option>
            {employees.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>
                    {emp.first_name} {emp.last_name} ({emp.department_name}) {/* Show department name */}
                </option>
            ))}
        </select>
        </div>
    </div>

    {/* Create Task Button */}
    <button
        onClick={handleCreateTask}
        className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
    >
        Create Task
    </button>
    </div>
);
};

CreateTaskComponent.propTypes = {
user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    username: PropTypes.string,
    branch_id: PropTypes.number,
    department_id: PropTypes.number,
}).isRequired,

branches: PropTypes.arrayOf(
    PropTypes.shape({
    branch_id: PropTypes.number.isRequired,
    branch_name: PropTypes.string.isRequired,
    })
).isRequired,

departments: PropTypes.arrayOf(
    PropTypes.shape({
    department_id: PropTypes.number.isRequired,
    department_name: PropTypes.string.isRequired,
    })
).isRequired,

employees: PropTypes.arrayOf(
    PropTypes.shape({
    user_id: PropTypes.number.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    department_id: PropTypes.number.isRequired,
    department_name: PropTypes.string.isRequired,
    })
).isRequired,

accounts: PropTypes.arrayOf(
    PropTypes.shape({
    account_id: PropTypes.number.isRequired,
    business_name: PropTypes.string.isRequired,
    })
).isRequired,

onCreateTask: PropTypes.func.isRequired,
};

export default CreateTaskComponent;
