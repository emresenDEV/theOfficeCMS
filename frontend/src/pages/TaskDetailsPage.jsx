import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { fetchTaskById, updateTask } from "../services/tasksService";
import AuditSection from "../components/AuditSection";

const TaskDetailsPage = ({ user }) => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            const data = await fetchTaskById(taskId);
            if (active) {
                setTask(data);
                setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [taskId]);

    const handleToggleComplete = async () => {
        if (!task) return;
        const payload = {
            is_completed: !task.is_completed,
            actor_user_id: user?.user_id ?? user?.id,
            actor_email: user?.email,
        };
        const updated = await updateTask(task.task_id, payload);
        if (updated) {
            setTask((prev) => ({ ...prev, ...updated }));
        }
    };

    if (loading) {
        return <p className="text-muted-foreground text-center">Loading task details...</p>;
    }

    if (!task) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Task not found.</p>
                <button
                    className="mt-4 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground"
                    onClick={() => navigate("/tasks")}
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto bg-card border border-border shadow-lg rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Task #{task.task_id}</h1>
                    <p className="text-sm text-muted-foreground">
                        {task.account_name || "No Account"}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {task.invoice_id && (
                        <Link
                            to={`/invoice/${task.invoice_id}?taskId=${task.task_id}`}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Open Invoice
                        </Link>
                    )}
                    {task.account_id && (
                        <Link
                            to={`/accounts/details/${task.account_id}`}
                            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
                        >
                            View Account
                        </Link>
                    )}
                    <button
                        className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                            task.is_completed ? "bg-secondary text-secondary-foreground" : "bg-green-600"
                        }`}
                        onClick={handleToggleComplete}
                    >
                        {task.is_completed ? "Mark Active" : "Mark Complete"}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-border bg-card p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
                    <p className="mt-3 text-foreground">{task.task_description}</p>
                    <div className="mt-4 text-sm text-muted-foreground space-y-1">
                        <p>Status: {task.is_completed ? "Completed" : "Active"}</p>
                        <p>
                            Due: {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                        </p>
                        <p>Assigned To: {task.assigned_to_name || "Unassigned"}</p>
                        <p>Created By: {task.created_by || "Unknown"}</p>
                    </div>
                </div>

                <div className="rounded-md border border-border bg-card p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Links</h2>
                    <div className="mt-3 space-y-2 text-sm">
                        <p>
                            Account: {task.account_id ? (
                                <Link className="text-primary hover:underline" to={`/accounts/details/${task.account_id}`}>
                                    {task.account_name || `Account ${task.account_id}`}
                                </Link>
                            ) : (
                                "—"
                            )}
                        </p>
                        <p>
                            Invoice: {task.invoice_id ? (
                                <Link className="text-primary hover:underline" to={`/invoice/${task.invoice_id}?taskId=${task.task_id}`}>
                                    #{task.invoice_id}
                                </Link>
                            ) : (
                                "—"
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <AuditSection
                title="Task Audit Trail"
                filters={{ entity_type: "task", entity_id: Number(taskId) }}
                limit={100}
            />
        </div>
    );
};

TaskDetailsPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number,
        id: PropTypes.number,
        email: PropTypes.string,
    }).isRequired,
};

export default TaskDetailsPage;
