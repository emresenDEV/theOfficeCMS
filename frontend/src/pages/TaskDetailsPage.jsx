import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDateInTimeZone, formatDateTimeInTimeZone } from "../utils/timezone";
import { fetchTaskById, updateTask, fetchTaskNotes, createTaskNote } from "../services/tasksService";
import { fetchUsers } from "../services/userService";
import AuditSection from "../components/AuditSection";

const TaskDetailsPage = ({ user }) => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [users, setUsers] = useState([]);
    const [taskNotes, setTaskNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            const [data, usersData, notesData] = await Promise.all([
                fetchTaskById(taskId),
                fetchUsers(),
                fetchTaskNotes(taskId),
            ]);
            if (active) {
                setTask(data);
                setUsers(usersData || []);
                setTaskNotes(notesData || []);
                setEditForm(data ? {
                    task_description: data.task_description || "",
                    due_date: data.due_date ? new Date(data.due_date).toISOString().split("T")[0] : "",
                    assigned_to: data.assigned_to || "",
                } : null);
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

    const handleCreateNote = async () => {
        if (!newNote.trim() || !task) return;
        setNoteSaving(true);
        const payload = {
            user_id: user?.user_id ?? user?.id,
            note_text: newNote.trim(),
            actor_user_id: user?.user_id ?? user?.id,
            actor_email: user?.email,
        };
        const created = await createTaskNote(task.task_id, payload);
        if (created) {
            setTaskNotes((prev) => [created, ...prev]);
            setNewNote("");
        }
        setNoteSaving(false);
    };

    const handleSave = async () => {
        if (!task || !editForm) return;
        const payload = {
            task_description: editForm.task_description,
            due_date: editForm.due_date
                ? new Date(editForm.due_date).toISOString().replace("T", " ").split(".")[0]
                : null,
            assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
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
                    {task.contact_id && (
                        <Link
                            to={`/contacts/${task.contact_id}?taskId=${task.task_id}`}
                            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/40"
                        >
                            View Contact
                        </Link>
                    )}
                    <button
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${
                            task.is_completed ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
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
                            Due: {task.due_date ? formatDateInTimeZone(task.due_date, user, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }) : "No due date"}
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
                        <p>
                            Contact: {task.contact_id ? (
                                <Link className="text-primary hover:underline" to={`/contacts/${task.contact_id}?taskId=${task.task_id}`}>
                                    Contact #{task.contact_id}
                                </Link>
                            ) : (
                                "—"
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {editForm && (
                <div className="mt-6 rounded-md border border-border bg-card p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Edit Task</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground md:col-span-2"
                            value={editForm.task_description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, task_description: e.target.value }))}
                            placeholder="Task description"
                            disabled={task.user_id !== (user?.user_id ?? user?.id)}
                        />
                        <input
                            type="date"
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={editForm.due_date}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, due_date: e.target.value }))}
                            disabled={task.user_id !== (user?.user_id ?? user?.id)}
                        />
                        <select
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={editForm.assigned_to}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                            disabled={task.user_id !== (user?.user_id ?? user?.id)}
                        >
                            <option value="">Assign to</option>
                            {users.map((u) => (
                                <option key={u.user_id} value={u.user_id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                            onClick={handleSave}
                            disabled={task.user_id !== (user?.user_id ?? user?.id)}
                        >
                            Save Changes
                        </button>
                    </div>
                    {task.user_id !== (user?.user_id ?? user?.id) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Only the task creator can edit details.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6 rounded-md border border-border bg-card p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Task Notes</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    <input
                        className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        onClick={handleCreateNote}
                        disabled={noteSaving}
                    >
                        {noteSaving ? "Saving..." : "Add Note"}
                    </button>
                </div>
                <div className="mt-4 space-y-3">
                    {taskNotes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No notes yet.</p>
                    ) : (
                        taskNotes.map((note) => (
                            <div key={note.task_note_id} className="rounded-md border border-border bg-muted/40 p-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{note.username || "Unknown user"}</span>
                                    <span>
                                        {note.created_at
                                            ? formatDateTimeInTimeZone(note.created_at, user, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })
                                            : ""}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-foreground">{note.note_text}</p>
                            </div>
                        ))
                    )}
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
