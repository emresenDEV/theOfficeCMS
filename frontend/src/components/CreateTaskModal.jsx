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
    const currentUserId = user?.user_id ?? user?.id ?? null;
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
            setAssignedUserId(currentUserId || "");
        }

        setIsCreating(true);
        setError("");

        try {
            const taskPayload = {
                task_description: taskDescription,
                due_date: new Date(dueDate).toISOString().replace("T", " ").split(".")[0],
                account_id: parseInt(accountId),
                user_id: Number(currentUserId),
                assigned_to: Number(assignedUserId || currentUserId),
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
            <div className="bg-card border border-border rounded-t-lg sm:rounded-lg w-full sm:max-w-md shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground text-xl"
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
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">
                            Task Description
                        </label>
                        <textarea
                            value={taskDescription}
                            onChange={(e) => {
                                setTaskDescription(e.target.value);
                                setError("");
                            }}
                            placeholder="Enter task description..."
                            className="w-full border border-border bg-card text-foreground rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">
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
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">
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
                        <label className="block text-sm font-semibold text-muted-foreground mb-1">
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
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {filteredEmployees.map((emp) => (
                                        <button
                                            key={emp.user_id}
                                            onClick={() => {
                                                setAssignedUserId(emp.user_id);
                                                setSearchQuery(
                                                    `${emp.first_name} ${emp.last_name}`
                                                );
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
                                        >
                                            <div className="font-medium">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {emp.username}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searchQuery && filteredEmployees.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded shadow-lg z-10 p-3 text-sm text-muted-foreground text-center">
                                    No employees found
                                </div>
                            )}
                        </div>
                        {assignedUserId && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                Selected user: {searchQuery}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded border border-border text-muted-foreground hover:bg-muted/40 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="flex-1 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted text-sm font-medium"
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
