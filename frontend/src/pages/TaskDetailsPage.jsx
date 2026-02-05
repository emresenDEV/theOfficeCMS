import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDateInTimeZone, formatDateTimeInTimeZone } from "../utils/timezone";
import { fetchTaskById, updateTask, fetchTaskNotes, createTaskNote } from "../services/tasksService";
import { fetchUsers } from "../services/userService";
import { fetchAccounts } from "../services/accountService";
import { fetchAllInvoices } from "../services/invoiceService";
import { fetchContacts } from "../services/contactService";
import AuditSection from "../components/AuditSection";

const TaskDetailsPage = ({ user }) => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const currentUserId = user?.user_id ?? user?.id ?? null;
    const [task, setTask] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editAssigneeQuery, setEditAssigneeQuery] = useState("");
    const [editAssigneeOpen, setEditAssigneeOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [taskNotes, setTaskNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [linkEdit, setLinkEdit] = useState(false);
    const [linkSaving, setLinkSaving] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [linkForm, setLinkForm] = useState({
        account_id: "",
        invoice_id: "",
        contact_id: "",
    });
    const [accountSearch, setAccountSearch] = useState("");
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [contactSearch, setContactSearch] = useState("");
    const [contactOverride, setContactOverride] = useState(false);
    const [toast, setToast] = useState("");
    const [notesTab, setNotesTab] = useState("notes");

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
                    due_date: data.due_date
                        ? new Date(data.due_date).toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0],
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

    useEffect(() => {
        if (!editOpen || !editForm) return;
        if (!editAssigneeQuery && editForm.assigned_to) {
            const assignee = users.find((u) => u.user_id === Number(editForm.assigned_to));
            if (assignee) {
                setEditAssigneeQuery(`${assignee.first_name || ""} ${assignee.last_name || ""}`.trim());
            }
        }
    }, [editOpen, editForm, users, editAssigneeQuery]);

    useEffect(() => {
        if (!linkEdit) return;
        let active = true;
        const load = async () => {
            const [accountsData, invoicesData, contactsData] = await Promise.all([
                fetchAccounts(),
                fetchAllInvoices(),
                fetchContacts(),
            ]);
            if (!active) return;
            setAccounts(accountsData || []);
            setInvoices(invoicesData || []);
            setContacts(contactsData || []);
        };
        load();
        return () => {
            active = false;
        };
    }, [linkEdit]);

    useEffect(() => {
        if (!linkEdit || !task) return;
        setLinkForm({
            account_id: task.account_id || "",
            invoice_id: task.invoice_id || "",
            contact_id: task.contact_id || "",
        });
        setAccountSearch(task.account_name || "");
        setInvoiceSearch(task.invoice_id ? `#${task.invoice_id}` : "");
        setContactSearch(task.contact_id ? `Contact #${task.contact_id}` : "");
        setContactOverride(false);
    }, [linkEdit, task]);

    const handleToggleComplete = async () => {
        if (!task) return;
        const nextCompleted = !task.is_completed;
        setTask((prev) => ({ ...prev, is_completed: nextCompleted }));
        const payload = {
            is_completed: nextCompleted,
            actor_user_id: currentUserId,
            actor_email: user?.email,
        };
        const updated = await updateTask(task.task_id, payload);
        if (!updated) {
            setTask((prev) => ({ ...prev, is_completed: !nextCompleted }));
            setToast("Could not update task status.");
            return;
        }
        const refreshed = await fetchTaskById(taskId);
        if (refreshed) {
            setTask(refreshed);
        }
        setToast(nextCompleted ? "Task marked complete." : "Task marked active.");
    };

    const handleSaveLinks = async () => {
        if (!task) return;
        if (linkForm.account_id && linkForm.invoice_id) {
            const allowedInvoice = scopedInvoices.some(
                (inv) => Number(inv.invoice_id) === Number(linkForm.invoice_id)
            );
            if (!allowedInvoice) {
                setToast("Select an invoice tied to the selected account.");
                return;
            }
        }
        if (linkForm.account_id && linkForm.contact_id && !contactOverride) {
            const allowedContact = scopedContacts.some(
                (contact) => Number(contact.contact_id) === Number(linkForm.contact_id)
            );
            if (!allowedContact) {
                setToast("Select a contact tied to the selected account or use override.");
                return;
            }
        }
        setLinkSaving(true);
        const payload = {
            account_id: linkForm.account_id ? Number(linkForm.account_id) : null,
            invoice_id: linkForm.invoice_id ? Number(linkForm.invoice_id) : null,
            contact_id: linkForm.contact_id ? Number(linkForm.contact_id) : null,
            actor_user_id: currentUserId,
            actor_email: user?.email,
        };
        const updated = await updateTask(task.task_id, payload);
        if (updated) {
            const refreshed = await fetchTaskById(taskId);
            setTask(refreshed);
            setLinkEdit(false);
            setToast("Links updated successfully.");
        }
        setLinkSaving(false);
    };

    const handleCreateNote = async () => {
        if (!newNote.trim() || !task) return;
        setNoteSaving(true);
        const payload = {
            user_id: currentUserId,
            note_text: newNote.trim(),
            actor_user_id: currentUserId,
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
            actor_user_id: currentUserId,
            actor_email: user?.email,
        };
        const updated = await updateTask(task.task_id, payload);
        if (updated) {
            setTask((prev) => ({ ...prev, ...updated }));
            setToast("Task updated successfully.");
            setEditOpen(false);
            setEditAssigneeOpen(false);
        }
    };

    useEffect(() => {
        if (!toast) return;
        const timeoutId = setTimeout(() => setToast(""), 3000);
        return () => clearTimeout(timeoutId);
    }, [toast]);

    if (loading) {
        return <p className="text-muted-foreground text-center">Loading task details...</p>;
    }

    if (!task) {
        return (
            <div className="px-4 py-4 sm:px-6 sm:py-6">
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

    const filteredAccounts = accountSearch.trim()
        ? accounts.filter((acc) =>
            acc.business_name?.toLowerCase().includes(accountSearch.toLowerCase())
        ).slice(0, 8)
        : [];

    const scopedInvoices = linkForm.account_id
        ? invoices.filter((inv) => Number(inv.account_id) === Number(linkForm.account_id))
        : invoices;

    const filteredInvoices = invoiceSearch.trim()
        ? scopedInvoices.filter((inv) => {
            const term = invoiceSearch.replace("#", "").trim().toLowerCase();
            return (
                String(inv.invoice_id).includes(term) ||
                (inv.business_name || "").toLowerCase().includes(term)
            );
        }).slice(0, 8)
        : [];

    const scopedContacts = linkForm.account_id && !contactOverride
        ? contacts.filter((contact) =>
            (contact.accounts || []).some((acc) => Number(acc.account_id) === Number(linkForm.account_id))
        )
        : contacts;

    const filteredContacts = contactSearch.trim()
        ? scopedContacts.filter((contact) => {
            const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim().toLowerCase();
            return (
                name.includes(contactSearch.toLowerCase()) ||
                (contact.email || "").toLowerCase().includes(contactSearch.toLowerCase()) ||
                String(contact.contact_id).includes(contactSearch.trim())
            );
        }).slice(0, 8)
        : [];

    const filteredEditAssignees = editAssigneeQuery.trim()
        ? users.filter((userItem) => {
            const name = `${userItem.first_name || ""} ${userItem.last_name || ""}`.trim().toLowerCase();
            const username = (userItem.username || "").toLowerCase();
            const term = editAssigneeQuery.trim().toLowerCase();
            return name.includes(term) || username.includes(term);
        }).slice(0, 8)
        : [];

    return (
        <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card px-4 py-4 shadow-lg sm:px-6 sm:py-6">
            {toast && (
                <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    {toast}
                </div>
            )}
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Links</h2>
                        <button
                            className="text-xs font-semibold text-primary hover:underline"
                            onClick={() => setLinkEdit((prev) => !prev)}
                            disabled={task.user_id !== currentUserId}
                        >
                            {linkEdit ? "Close" : "Edit Links"}
                        </button>
                    </div>
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
                    {linkEdit && (
                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Account
                                </label>
                                <input
                                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                    value={accountSearch}
                                    onChange={(e) => {
                                        setAccountSearch(e.target.value);
                                        if (!e.target.value) {
                                            setLinkForm((prev) => ({ ...prev, account_id: "", invoice_id: "", contact_id: "" }));
                                            setInvoiceSearch("");
                                            setContactSearch("");
                                            setContactOverride(false);
                                        }
                                    }}
                                    placeholder="Search account..."
                                />
                                {filteredAccounts.length > 0 && (
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-card shadow-sm">
                                        {filteredAccounts.map((acc) => (
                                            <button
                                                key={acc.account_id}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                                onClick={() => {
                                                    setLinkForm((prev) => ({
                                                        ...prev,
                                                        account_id: acc.account_id,
                                                        invoice_id: "",
                                                        contact_id: "",
                                                    }));
                                                    setAccountSearch(acc.business_name);
                                                    setInvoiceSearch("");
                                                    setContactSearch("");
                                                    setContactOverride(false);
                                                }}
                                            >
                                                <span>{acc.business_name}</span>
                                                <span className="text-xs text-muted-foreground">#{acc.account_id}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Invoice
                                </label>
                                <input
                                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                    value={invoiceSearch}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setInvoiceSearch(value);
                                        const numeric = value.replace("#", "").trim();
                                        if (numeric && !Number.isNaN(Number(numeric))) {
                                            const match = scopedInvoices.find(
                                                (inv) => Number(inv.invoice_id) === Number(numeric)
                                            );
                                            setLinkForm((prev) => ({
                                                ...prev,
                                                invoice_id: match ? Number(numeric) : "",
                                            }));
                                        } else if (!value) {
                                            setLinkForm((prev) => ({ ...prev, invoice_id: "" }));
                                        }
                                    }}
                                    placeholder="Search invoice #..."
                                />
                                {filteredInvoices.length > 0 && (
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-card shadow-sm">
                                        {filteredInvoices.map((inv) => (
                                            <button
                                                key={inv.invoice_id}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                                onClick={() => {
                                                    setLinkForm((prev) => ({ ...prev, invoice_id: inv.invoice_id }));
                                                    setInvoiceSearch(`#${inv.invoice_id}`);
                                                }}
                                            >
                                                <span>#{inv.invoice_id}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {inv.business_name || "Invoice"}
                                                    {inv.date_created
                                                        ? ` • ${formatDateInTimeZone(inv.date_created, user, {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}`
                                                        : ""}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Contact
                                    </label>
                                    {linkForm.account_id && (
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-primary hover:underline"
                                            onClick={() => {
                                                setContactOverride((prev) => {
                                                    const next = !prev;
                                                    if (!next) {
                                                        const stillValid = scopedContacts.some(
                                                            (contact) =>
                                                                Number(contact.contact_id) === Number(linkForm.contact_id)
                                                        );
                                                        if (!stillValid) {
                                                            setLinkForm((prevForm) => ({ ...prevForm, contact_id: "" }));
                                                            setContactSearch("");
                                                        }
                                                    }
                                                    return next;
                                                });
                                            }}
                                        >
                                            {contactOverride ? "Use account contacts" : "Override"}
                                        </button>
                                    )}
                                </div>
                                <input
                                    className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                    value={contactSearch}
                                    onChange={(e) => {
                                        setContactSearch(e.target.value);
                                        if (!e.target.value) {
                                            setLinkForm((prev) => ({ ...prev, contact_id: "" }));
                                        }
                                    }}
                                    placeholder="Search contact..."
                                />
                                {filteredContacts.length > 0 && (
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-card shadow-sm">
                                        {filteredContacts.map((contact) => (
                                            <button
                                                key={contact.contact_id}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                                onClick={() => {
                                                    setLinkForm((prev) => ({ ...prev, contact_id: contact.contact_id }));
                                                    const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
                                                    setContactSearch(name || `Contact #${contact.contact_id}`);
                                                }}
                                            >
                                                <span>{`${contact.first_name || ""} ${contact.last_name || ""}`.trim() || `Contact #${contact.contact_id}`}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    #{contact.contact_id}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                                    onClick={() => setLinkEdit(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                    onClick={handleSaveLinks}
                                    disabled={linkSaving || task.user_id !== currentUserId}
                                >
                                    {linkSaving ? "Saving..." : "Save Links"}
                                </button>
                            </div>
                            {task.user_id !== currentUserId && (
                                <p className="text-xs text-muted-foreground">
                                    Only the task creator can edit links.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {editForm && (
                <div className="mt-6 rounded-md border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Task Details</h2>
                        <button
                            className="text-xs font-semibold text-primary hover:underline"
                            onClick={() => setEditOpen((prev) => !prev)}
                            disabled={task.user_id !== currentUserId}
                        >
                            {editOpen ? "Close" : "Edit Task"}
                        </button>
                    </div>
                    {editOpen && (
                        <>
                            <div className="mt-4 space-y-3">
                                <input
                                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                    value={editForm.task_description}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, task_description: e.target.value }))}
                                    placeholder="Task description"
                                    disabled={task.user_id !== currentUserId}
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                        type="date"
                                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                        value={editForm.due_date}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, due_date: e.target.value }))}
                                        onFocus={(e) => e.target.showPicker?.()}
                                        disabled={task.user_id !== currentUserId}
                                    />
                                    <div className="relative">
                                        <input
                                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                            placeholder="Assign to..."
                                            value={editAssigneeQuery}
                                            onFocus={() => setEditAssigneeOpen(true)}
                                            onBlur={() => setTimeout(() => setEditAssigneeOpen(false), 150)}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setEditAssigneeQuery(value);
                                                setEditForm((prev) => ({ ...prev, assigned_to: value ? "" : prev.assigned_to }));
                                            }}
                                            disabled={task.user_id !== currentUserId}
                                        />
                                        {editAssigneeOpen && filteredEditAssignees.length > 0 && editAssigneeQuery && (
                                            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                                                {filteredEditAssignees.map((assignee) => (
                                                    <button
                                                        key={assignee.user_id}
                                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setEditForm((prev) => ({ ...prev, assigned_to: assignee.user_id }));
                                                            setEditAssigneeQuery(
                                                                `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim()
                                                            );
                                                            setEditAssigneeOpen(false);
                                                        }}
                                                    >
                                                        <span>
                                                            {assignee.first_name} {assignee.last_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">ID {assignee.user_id}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                                    onClick={handleSave}
                                    disabled={task.user_id !== currentUserId}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </>
                    )}
                    {task.user_id !== currentUserId && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            Only the task creator can edit details.
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6 rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Task Activity</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <button
                        className={`rounded-full px-3 py-1 ${
                            notesTab === "notes" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setNotesTab("notes")}
                    >
                        Notes
                    </button>
                    <button
                        className={`rounded-full px-3 py-1 ${
                            notesTab === "audit" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setNotesTab("audit")}
                    >
                        Audit Trail
                    </button>
                </div>
                <div className="mt-4">
                    {notesTab === "notes" && (
                        <>
                            <div className="flex flex-wrap gap-2">
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
                        </>
                    )}
                    {notesTab === "audit" && (
                        <AuditSection
                            title="Task Audit Trail"
                            filters={{ entity_type: "task", entity_id: Number(taskId) }}
                            limit={100}
                        />
                    )}
                </div>
            </div>
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
