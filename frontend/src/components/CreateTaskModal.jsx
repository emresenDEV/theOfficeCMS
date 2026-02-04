import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const CreateTaskModal = ({
    isOpen,
    onClose,
    onCreateTask,
    accounts = [],
    employees = [],
    user
}) => {
    const [taskDescription, setTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [accountId, setAccountId] = useState("");
    const [assignedUserId, setAssignedUserId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredEmployees, setFilteredEmployees] = useState(employees);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Filter employees based on search query
        const filtered = employees.filter(
            (emp) =>
                emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [searchQuery, employees]);

    const handleCreate = async () => {
        if (!taskDescription.trim()) {
            setError("Task description is required");
            return;
        }

        if (!dueDate) {
            setError("Due date is required");
            return;
        }

        if (!accountId) {
            setError("Account is required");
            return;
        }

        if (!assignedUserId) {
            setError("Assigned user is required");
            return;
        }

        setIsCreating(true);
        setError("");

        try {
            const taskPayload = {
                task_description: taskDescription,
                due_date: new Date(dueDate).toISOString().replace("T", " ").split(".")[0],
                account_id: parseInt(accountId),
                user_id: parseInt(assignedUserId),
            };

            await onCreateTask(taskPayload);

            // Reset form
            setTaskDescription("");
            setDueDate("");
            setAccountId("");
            setAssignedUserId("");
            setSearchQuery("");
            onClose();
        } catch (err) {
            setError("Failed to create task. Please try again.");
            console.error("Error creating task:", err);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-lg sm:rounded-lg w-full sm:max-w-md shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Task</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {/* Task Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Task Description
                        </label>
                        <textarea
                            value={taskDescription}
                            onChange={(e) => {
                                setTaskDescription(e.target.value);
                                setError("");
                            }}
                            placeholder="Enter task description..."
                            className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => {
                                setDueDate(e.target.value);
                                setError("");
                            }}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Account Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Account
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => {
                                setAccountId(e.target.value);
                                setError("");
                            }}
                            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Account...</option>
                            {accounts.map((acc) => (
                                <option key={acc.account_id} value={acc.account_id}>
                                    {acc.business_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assign User with Search */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Assign To
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchQuery && filteredEmployees.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {filteredEmployees.map((emp) => (
                                        <button
                                            key={emp.user_id}
                                            onClick={() => {
                                                setAssignedUserId(emp.user_id);
                                                setSearchQuery(
                                                    `${emp.first_name} ${emp.last_name}`
                                                );
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0"
                                        >
                                            <div className="font-medium">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {emp.username}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searchQuery && filteredEmployees.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 p-3 text-sm text-gray-500 text-center">
                                    No employees found
                                </div>
                            )}
                        </div>
                        {assignedUserId && (
                            <div className="mt-2 text-xs text-gray-600">
                                Selected user: {searchQuery}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
                    >
                        {isCreating ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </div>
        </div>
    );
};

CreateTaskModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreateTask: PropTypes.func.isRequired,
    accounts: PropTypes.array,
    employees: PropTypes.array,
    user: PropTypes.object,
};

export default CreateTaskModal;
