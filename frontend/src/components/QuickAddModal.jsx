import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { fetchAccounts } from "../services/accountService";
import { createContact } from "../services/contactService";
import { createTask } from "../services/tasksService";

const QuickAddModal = ({ open, onClose, user }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("task");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [contactForm, setContactForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    account_id: "",
  });
  const [taskForm, setTaskForm] = useState({
    task_description: "",
    due_date: "",
    account_id: "",
    assigned_to: user?.user_id || user?.id || "",
  });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const load = async () => {
      const data = await fetchAccounts();
      if (mounted) setAccounts(data);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setMode("task");
    setSuccessMessage("");
    setErrorMessage("");
    setContactForm({ first_name: "", last_name: "", email: "", phone: "", account_id: "" });
    setTaskForm({
      task_description: "",
      due_date: "",
      account_id: "",
      assigned_to: user?.user_id || user?.id || "",
    });
  }, [open, user]);

  const accountOptions = useMemo(() => {
    return accounts
      .map((acc) => ({ account_id: acc.account_id, business_name: acc.business_name }))
      .sort((a, b) => a.business_name.localeCompare(b.business_name));
  }, [accounts]);

  const handleCreateContact = async () => {
    if (!contactForm.first_name && !contactForm.last_name) return;
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);
    const payload = {
      first_name: contactForm.first_name,
      last_name: contactForm.last_name,
      email: contactForm.email,
      phone: contactForm.phone,
      account_ids: contactForm.account_id ? [Number(contactForm.account_id)] : [],
      actor_user_id: user?.user_id || user?.id,
      actor_email: user?.email,
    };
    try {
      const created = await createContact(payload);
      setLoading(false);
      if (created?.contact_id) {
        setSuccessMessage("Contact created successfully.");
        setTimeout(() => {
          onClose();
          navigate(`/contacts/${created.contact_id}`, {
            state: { toast: { type: "success", message: "Contact created successfully." } },
          });
        }, 700);
      } else {
        setErrorMessage("Contact was not created. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.response?.data?.error || "Contact was not created. Please try again.");
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.task_description || !taskForm.due_date) return;
    setLoading(true);
    const payload = {
      user_id: user?.user_id || user?.id,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : user?.user_id || user?.id,
      task_description: taskForm.task_description,
      due_date: taskForm.due_date,
      account_id: taskForm.account_id ? Number(taskForm.account_id) : null,
      actor_user_id: user?.user_id || user?.id,
      actor_email: user?.email,
    };
    const created = await createTask(payload);
    setLoading(false);
    if (created?.task_id) {
      onClose();
      navigate(`/tasks/${created.task_id}`);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="button"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Quick Add</h2>
          <button
            className="text-xl text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className={`rounded-full px-4 py-1 text-sm font-semibold ${
              mode === "task"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
            onClick={() => setMode("task")}
          >
            Task
          </button>
          <button
            className={`rounded-full px-4 py-1 text-sm font-semibold ${
              mode === "contact"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
            onClick={() => setMode("contact")}
          >
            Contact
          </button>
        </div>

        {successMessage && (
          <p className="mt-3 text-sm text-emerald-600">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
        )}
        {mode === "task" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground md:col-span-2"
              placeholder="Task description"
              value={taskForm.task_description}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, task_description: e.target.value }))}
            />
            <input
              type="date"
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, due_date: e.target.value }))}
            />
            <select
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              value={taskForm.account_id}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, account_id: e.target.value }))}
            >
              <option value="">Account (optional)</option>
              {accountOptions.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.business_name}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:col-span-2"
              onClick={handleCreateTask}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="First name"
              value={contactForm.first_name}
              onChange={(e) => setContactForm((prev) => ({ ...prev, first_name: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Last name"
              value={contactForm.last_name}
              onChange={(e) => setContactForm((prev) => ({ ...prev, last_name: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Email"
              value={contactForm.email}
              onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
              placeholder="Phone"
              value={contactForm.phone}
              onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <select
              className="w-full rounded border border-border bg-card p-2 text-sm text-foreground md:col-span-2"
              value={contactForm.account_id}
              onChange={(e) => setContactForm((prev) => ({ ...prev, account_id: e.target.value }))}
            >
              <option value="">Link to account (optional)</option>
              {accountOptions.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.business_name}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:col-span-2"
              onClick={handleCreateContact}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Contact"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

QuickAddModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    user_id: PropTypes.number,
    id: PropTypes.number,
    email: PropTypes.string,
  }),
};

QuickAddModal.defaultProps = {
  user: null,
};

export default QuickAddModal;
