import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createTask } from "../services/tasksService";
import { fetchAccounts } from "../services/accountService";

const CreateTaskMobileForm = ({ user, closeForm, refreshTasks }) => {
    const [taskDescription, setTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [searchAccount, setSearchAccount] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch accounts on mount
    useEffect(() => {
        async function loadAccounts() {
            const fetchedAccounts = await fetchAccounts();
            setAccounts(fetchedAccounts);
        }
        loadAccounts();
    }, []);

    // Filter accounts based on search
    useEffect(() => {
        if (!searchAccount.trim()) {
            setFilteredAccounts([]);
            setShowDropdown(false);
            return;
        }

        const matches = accounts.filter(account =>
            account.business_name.toLowerCase().includes(searchAccount.toLowerCase())
        );
        setFilteredAccounts(matches);
        setShowDropdown(matches.length > 0);
    }, [searchAccount, accounts]);

    // Handle account selection
    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setSearchAccount(account.business_name);
        setFilteredAccounts([]);
        setShowDropdown(false);
    };

    // Handle create task
    const handleCreateTask = async (e) => {
        e.preventDefault();

        if (!taskDescription.trim()) {
            alert("⚠️ Task description is required.");
            return;
        }

        if (!dueDate) {
            alert("⚠️ Due date is required.");
            return;
        }

        if (!user || !user.user_id) {
            alert("❌ User information is missing. Please refresh the page.");
            return;
        }

        setLoading(true);
        try {
            const formattedDueDate = new Date(dueDate).toISOString().slice(0, 19).replace("T", " ");

            const taskData = {
                user_id: user.user_id,
                assigned_to: user.user_id,
                task_description: taskDescription.trim(),
                due_date: formattedDueDate,
                is_completed: false,
                account_id: selectedAccount?.account_id || null,
                actor_user_id: user.user_id,
                actor_email: user.email,
            };

            console.log("📤 Creating Task:", taskData);
            await createTask(taskData);

            // Clear form
            setTaskDescription("");
            setDueDate("");
            setSelectedAccount(null);
            setSearchAccount("");

            // Refresh tasks
            if (typeof refreshTasks === "function") {
                await refreshTasks();
            }

            closeForm();
        } catch (error) {
            console.error("❌ Error creating task:", error);
            alert("Failed to create task. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-left">
            <h2 className="text-xl font-semibold text-foreground mb-4">Create New Task</h2>

            <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Task Description */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Task Description
                    </label>
                    <input
                        type="text"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Enter task description"
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Due Date
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                </div>

                {/* Account Search */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Search for an Account (Optional)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchAccount}
                            onChange={(e) => setSearchAccount(e.target.value)}
                            placeholder="Search by account name..."
                            className="w-full p-2 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        {showDropdown && (
                            <ul className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 mt-1">
                                {filteredAccounts.map(account => (
                                    <li
                                        key={account.account_id}
                                        onClick={() => handleSelectAccount(account)}
                                        className="p-2 hover:bg-muted cursor-pointer text-sm text-foreground"
                                    >
                                        {account.business_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {selectedAccount && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Selected: {selectedAccount.business_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between gap-3 mt-6">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Task"}
                    </button>
                </div>
            </form>
        </div>
    );
};

CreateTaskMobileForm.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
    }).isRequired,
    closeForm: PropTypes.func.isRequired,
    refreshTasks: PropTypes.func.isRequired,
};

export default CreateTaskMobileForm;
