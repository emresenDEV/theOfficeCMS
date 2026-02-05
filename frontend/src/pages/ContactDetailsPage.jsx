import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  createContactInteraction,
  fetchContactById,
  followContact,
  unfollowContact,
  updateContact,
  updateContactAccounts,
} from "../services/contactService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { createTask } from "../services/tasksService";
import AuditSection from "../components/AuditSection";
import { formatDateTimeInTimeZone, formatDateInTimeZone } from "../utils/timezone";

const ContactDetailsPage = ({ user }) => {
  const { contactId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [autosaveOverride, setAutosaveOverride] = useState(null);
  const [accountAdds, setAccountAdds] = useState([]);
  const [accountRemoves, setAccountRemoves] = useState([]);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaveMessage, setAccountSaveMessage] = useState("");
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: "call",
    subject: "",
    notes: "",
    account_id: "",
    phone_option: "",
    phone_custom: "",
    email_option: "",
    email_custom: "",
  });
  const [taskForm, setTaskForm] = useState({
    task_description: "",
    assigned_to: user?.user_id || "",
    due_date: "",
    account_id: "",
  });
  const [followupForm, setFollowupForm] = useState({
    due_date: "",
    note: "",
    account_id: "",
    assigned_to: "",
  });
  const [highlightTaskId, setHighlightTaskId] = useState(null);

  const storedAutosave = localStorage.getItem("contacts_autosave");
  const autosaveDefault = user?.contacts_autosave ?? (storedAutosave === null ? true : storedAutosave === "true");
  const autosaveEnabled = autosaveOverride === null ? autosaveDefault : autosaveOverride;

  useEffect(() => {
    const stored = localStorage.getItem(`contact_autosave_override_${contactId}`);
    if (stored === "on") {
      setAutosaveOverride(true);
    } else if (stored === "off") {
      setAutosaveOverride(false);
    } else {
      setAutosaveOverride(null);
    }
  }, [contactId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskIdParam = params.get("taskId");
    if (taskIdParam) {
      setHighlightTaskId(Number(taskIdParam));
    } else {
      setHighlightTaskId(null);
    }
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [contactData, accountsData, usersData] = await Promise.all([
        fetchContactById(contactId, user?.user_id),
        fetchAccounts(),
        fetchUsers(),
      ]);
      if (!mounted) return;
      setContact(contactData);
      setForm(contactData ? {
        first_name: contactData.first_name || "",
        last_name: contactData.last_name || "",
        title: contactData.title || "",
        phone: contactData.phone || "",
        email: contactData.email || "",
        status: contactData.status || "active",
        do_not_call: !!contactData.do_not_call,
        email_opt_out: !!contactData.email_opt_out,
        contact_owner_user_id: contactData.contact_owner_user_id || "",
      } : null);
      setAccounts(accountsData);
      setUsers(usersData);
      setInteractions(contactData?.interactions || []);
      setTasks(contactData?.tasks || []);
      setIsFollowing(!!contactData?.is_following);
      setFollowupForm((prev) => ({
        ...prev,
        assigned_to: contactData?.contact_owner_user_id || user?.user_id || "",
      }));
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [contactId, user?.user_id]);

  useEffect(() => {
    if (!autosaveEnabled || !dirty || !form) return;
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [autosaveEnabled, dirty, form]);

  useEffect(() => {
    if (!contact) return;
    if (!accountAdds.length && !accountRemoves.length) return;
    setAccountSaving(true);
    const timeoutId = setTimeout(async () => {
      const payload = {
        add_account_ids: accountAdds.map(Number),
        remove_account_ids: accountRemoves.map(Number),
        actor_user_id: user?.user_id,
        actor_email: user?.email,
      };
      const updated = await updateContactAccounts(contact.contact_id, payload);
      if (updated) {
        setContact(updated);
        setAccountAdds([]);
        setAccountRemoves([]);
        setAccountSaveMessage("Accounts updated");
        setTimeout(() => setAccountSaveMessage(""), 1500);
      }
      setAccountSaving(false);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [accountAdds, accountRemoves, contact, user?.user_id, user?.email]);

  useEffect(() => {
    if (!highlightTaskId) return;
    const row = document.getElementById(`contact-task-${highlightTaskId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightTaskId, tasks]);

  useEffect(() => {
    const handler = (event) => {
      if (!event.altKey) return;
      if (event.key.toLowerCase() !== "m") return;
      if (!user?.user_id) return;
      setFollowupForm((prev) => ({ ...prev, assigned_to: user.user_id }));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [user?.user_id]);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      map.set(u.user_id, `${u.first_name || ""} ${u.last_name || ""}`.trim() || `User ${u.user_id}`);
    });
    return map;
  }, [users]);

  const accountMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => {
      map.set(acc.account_id, acc);
    });
    return map;
  }, [accounts]);

  const associatedAccountIds = useMemo(() => {
    return contact?.accounts?.map((acc) => acc.account_id) || [];
  }, [contact]);

  const availableAccounts = useMemo(() => {
    return accounts.filter((acc) => !associatedAccountIds.includes(acc.account_id));
  }, [accounts, associatedAccountIds]);

  const accountPhoneOptions = useMemo(() => {
    const phones = new Set();
    contact?.accounts?.forEach((acc) => {
      if (acc.phone_number) phones.add(acc.phone_number);
    });
    return Array.from(phones);
  }, [contact]);

  const accountEmailOptions = useMemo(() => {
    const emails = new Set();
    contact?.accounts?.forEach((acc) => {
      if (acc.email) emails.add(acc.email);
    });
    return Array.from(emails);
  }, [contact]);

  const displayName = useMemo(() => {
    if (!contact) return "";
    const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    return name || "Unnamed Contact";
  }, [contact]);

  const setOverride = (value) => {
    setAutosaveOverride(value);
    const key = `contact_autosave_override_${contactId}`;
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value ? "on" : "off");
    }
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form || !contact) return;
    setSaving(true);
    setSaveMessage(autosaveEnabled ? "Auto-saving..." : "Saving...");
    const payload = {
      ...form,
      contact_owner_user_id: form.contact_owner_user_id ? Number(form.contact_owner_user_id) : null,
      actor_user_id: user?.user_id,
      actor_email: user?.email,
    };
    const updated = await updateContact(contact.contact_id, payload);
    if (updated) {
      setContact(updated);
      setForm({
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
        title: updated.title || "",
        phone: updated.phone || "",
        email: updated.email || "",
        status: updated.status || "active",
        do_not_call: !!updated.do_not_call,
        email_opt_out: !!updated.email_opt_out,
        contact_owner_user_id: updated.contact_owner_user_id || "",
      });
      setDirty(false);
      setSaveMessage("Saved");
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 1500);
  };

  const handleFollowToggle = async () => {
    if (!user?.user_id) return;
    if (isFollowing) {
      const res = await unfollowContact(contact.contact_id, user.user_id);
      if (res) setIsFollowing(false);
    } else {
      const res = await followContact(contact.contact_id, user.user_id);
      if (res) setIsFollowing(true);
    }
  };

  const handleInteractionSubmit = async () => {
    if (!interactionForm.subject && !interactionForm.notes) return;

    let phoneNumber = null;
    if (interactionForm.phone_option === "custom") {
      phoneNumber = interactionForm.phone_custom || null;
    } else if (interactionForm.phone_option?.startsWith("account:")) {
      phoneNumber = interactionForm.phone_option.replace("account:", "");
    } else if (interactionForm.phone_option?.startsWith("contact:")) {
      phoneNumber = interactionForm.phone_option.replace("contact:", "");
    }

    let emailAddress = null;
    if (interactionForm.email_option === "custom") {
      emailAddress = interactionForm.email_custom || null;
    } else if (interactionForm.email_option?.startsWith("account:")) {
      emailAddress = interactionForm.email_option.replace("account:", "");
    } else if (interactionForm.email_option?.startsWith("contact:")) {
      emailAddress = interactionForm.email_option.replace("contact:", "");
    }

    const payload = {
      interaction_type: interactionForm.interaction_type,
      subject: interactionForm.subject,
      notes: interactionForm.notes,
      account_id: interactionForm.account_id ? Number(interactionForm.account_id) : null,
      phone_number: phoneNumber,
      email_address: emailAddress,
      actor_user_id: user?.user_id,
      actor_email: user?.email,
    };

    const created = await createContactInteraction(contact.contact_id, payload);
    if (created) {
      setInteractions((prev) => [created, ...prev]);
      setInteractionForm({
        interaction_type: "call",
        subject: "",
        notes: "",
        account_id: "",
        phone_option: "",
        phone_custom: "",
        email_option: "",
        email_custom: "",
      });
    }
  };

  const handleTaskCreate = async () => {
    if (!taskForm.task_description || !taskForm.due_date) return;
    const payload = {
      user_id: user?.user_id,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : user?.user_id,
      task_description: taskForm.task_description,
      due_date: taskForm.due_date,
      account_id: taskForm.account_id ? Number(taskForm.account_id) : null,
      contact_id: contact.contact_id,
      actor_user_id: user?.user_id,
      actor_email: user?.email,
    };
    const created = await createTask(payload);
    if (created) {
      setTasks((prev) => [created, ...prev]);
      setTaskForm({
        task_description: "",
        assigned_to: user?.user_id || "",
        due_date: "",
        account_id: "",
      });
    }
  };

  const handleFollowupCreate = async () => {
    if (!followupForm.due_date) return;
    const descriptionBase = `Follow up with ${displayName}`;
    const description = followupForm.note
      ? `${descriptionBase} - ${followupForm.note}`
      : descriptionBase;
    const payload = {
      user_id: user?.user_id,
      assigned_to: followupForm.assigned_to
        ? Number(followupForm.assigned_to)
        : contact.contact_owner_user_id || user?.user_id,
      task_description: description,
      due_date: followupForm.due_date,
      account_id: followupForm.account_id ? Number(followupForm.account_id) : null,
      contact_id: contact.contact_id,
      actor_user_id: user?.user_id,
      actor_email: user?.email,
    };
    const created = await createTask(payload);
    if (created) {
      setTasks((prev) => [created, ...prev]);
      setFollowupForm({ due_date: "", note: "", account_id: "" });
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading contact...</div>;
  }

  if (!contact || !form) {
    return <div className="p-6 text-sm text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => navigate("/contacts")}
          >
            ← Back to Contacts
          </button>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground">Contact details and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              form.status === "inactive" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {form.status || "active"}
          </span>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              isFollowing ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
            }`}
            onClick={handleFollowToggle}
          >
            {isFollowing ? "Unfollow" : "+ Follow"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Profile</h2>
              <div className="text-xs text-muted-foreground">
                {autosaveEnabled ? "Auto-save on" : "Auto-save off"}
                {saveMessage ? ` • ${saveMessage}` : ""}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => handleFieldChange("first_name", e.target.value)}
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => handleFieldChange("last_name", e.target.value)}
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Title"
                value={form.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
              />
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={form.contact_owner_user_id}
                onChange={(e) => handleFieldChange("contact_owner_user_id", e.target.value)}
              >
                <option value="">Contact owner</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.first_name} {u.last_name} (ID {u.user_id})
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={form.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.do_not_call}
                    onChange={(e) => handleFieldChange("do_not_call", e.target.checked)}
                  />
                  Do Not Call
                </label>
                <span className="text-xs text-muted-foreground">
                  {contact.do_not_call_date ? formatDateInTimeZone(contact.do_not_call_date, user) : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.email_opt_out}
                    onChange={(e) => handleFieldChange("email_opt_out", e.target.checked)}
                  />
                  Email Opt Out
                </label>
                <span className="text-xs text-muted-foreground">
                  {contact.email_opt_out_date ? formatDateInTimeZone(contact.email_opt_out_date, user) : ""}
                </span>
              </div>
            </div>
            {!autosaveEnabled && (
              <div className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-xs text-amber-800">
                Autosave is off for this contact. Remember to click Save to keep your changes.
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Override autosave for this contact:</span>
                <button
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    autosaveOverride === null ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setOverride(null)}
                >
                  Use my default
                </button>
                <button
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    autosaveOverride === true ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setOverride(true)}
                >
                  Autosave on
                </button>
                <button
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    autosaveOverride === false ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setOverride(false)}
                >
                  Autosave off
                </button>
              </div>
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                onClick={handleSave}
                disabled={saving || !dirty}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
              <span className="text-xs text-muted-foreground">
                {accountSaving ? "Saving..." : accountSaveMessage || "Auto-save on"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {contact.accounts?.length ? (
                contact.accounts.map((acc) => (
                  <button
                    key={acc.account_id}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                    onClick={() => navigate(`/accounts/details/${acc.account_id}`)}
                  >
                    {acc.business_name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No linked accounts.</p>
              )}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Remove from accounts</p>
                <div className="mt-2 space-y-2">
                  {contact.accounts?.map((acc) => (
                    <label key={acc.account_id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={accountRemoves.includes(String(acc.account_id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAccountRemoves((prev) =>
                            checked
                              ? [...prev, String(acc.account_id)]
                              : prev.filter((id) => id !== String(acc.account_id))
                          );
                        }}
                      />
                      {acc.business_name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Add to accounts</p>
                <div className="mt-2 space-y-2">
                  {availableAccounts.map((acc) => (
                    <label key={acc.account_id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={accountAdds.includes(String(acc.account_id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAccountAdds((prev) =>
                            checked
                              ? [...prev, String(acc.account_id)]
                              : prev.filter((id) => id !== String(acc.account_id))
                          );
                        }}
                      />
                      {acc.business_name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Account links auto-save as you update selections.
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Follow-up</h2>
            <p className="text-xs text-muted-foreground">Creates a task and reminder for this contact.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                type="date"
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={followupForm.due_date}
                onChange={(e) => setFollowupForm((prev) => ({ ...prev, due_date: e.target.value }))}
              />
              <div className="flex gap-2">
                <select
                  className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                  value={followupForm.assigned_to}
                  onChange={(e) => setFollowupForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
                >
                  <option value="">Assign to (defaults to contact owner)</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted/40"
                  onClick={() => setFollowupForm((prev) => ({ ...prev, assigned_to: user?.user_id }))}
                  title="Assign to me (Alt+M)"
                >
                  Me
                </button>
              </div>
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={followupForm.account_id}
                onChange={(e) => setFollowupForm((prev) => ({ ...prev, account_id: e.target.value }))}
              >
                <option value="">Related account (optional)</option>
                {contact.accounts?.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground md:col-span-2"
                placeholder="Follow-up notes (optional)"
                value={followupForm.note}
                onChange={(e) => setFollowupForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleFollowupCreate}
              >
                Create Follow-up Task
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Log Interaction</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={interactionForm.interaction_type}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, interaction_type: e.target.value }))}
              >
                <option value="call">Phone Call</option>
                <option value="email">Email</option>
              </select>
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={interactionForm.account_id}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, account_id: e.target.value }))}
              >
                <option value="">Related account (optional)</option>
                {contact.accounts?.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Subject"
                value={interactionForm.subject}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Notes"
                value={interactionForm.notes}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={interactionForm.phone_option}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, phone_option: e.target.value }))}
              >
                <option value="">Phone (optional)</option>
                {accountPhoneOptions.map((phone) => (
                  <option key={phone} value={`account:${phone}`}>
                    Account phone: {phone}
                  </option>
                ))}
                {contact.phone && (
                  <option value={`contact:${contact.phone}`}>Contact phone: {contact.phone}</option>
                )}
                <option value="custom">Custom number</option>
              </select>
              {interactionForm.phone_option === "custom" && (
                <input
                  className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                  placeholder="Custom phone"
                  value={interactionForm.phone_custom}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, phone_custom: e.target.value }))}
                />
              )}
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={interactionForm.email_option}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, email_option: e.target.value }))}
              >
                <option value="">Email (optional)</option>
                {accountEmailOptions.map((email) => (
                  <option key={email} value={`account:${email}`}>
                    Account email: {email}
                  </option>
                ))}
                {contact.email && (
                  <option value={`contact:${contact.email}`}>Contact email: {contact.email}</option>
                )}
                <option value="custom">Custom email</option>
              </select>
              {interactionForm.email_option === "custom" && (
                <input
                  className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                  placeholder="Custom email"
                  value={interactionForm.email_custom}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, email_custom: e.target.value }))}
                />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleInteractionSubmit}
              >
                Log Interaction
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Interactions</h2>
            {interactions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No interactions yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.interaction_id} className="rounded-md border border-border bg-muted/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {interaction.interaction_type === "email" ? "Email" : "Call"} • {interaction.subject || "(No subject)"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {interaction.created_at
                          ? formatDateTimeInTimeZone(interaction.created_at, user, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    {interaction.notes && <p className="mt-2 text-sm text-muted-foreground">{interaction.notes}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {interaction.phone_number && <span>📞 {interaction.phone_number}</span>}
                      {interaction.email_address && <span>✉️ {interaction.email_address}</span>}
                      {interaction.account_id && (
                        <button
                          className="text-primary hover:underline"
                          onClick={() => navigate(`/accounts/details/${interaction.account_id}`)}
                        >
                          {accountMap.get(interaction.account_id)?.business_name || `Account #${interaction.account_id}`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Task description"
                value={taskForm.task_description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, task_description: e.target.value }))}
              />
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, assigned_to: e.target.value }))}
              >
                <option value="">Assign to</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
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
                <option value="">Linked account (optional)</option>
                {contact.accounts?.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleTaskCreate}
              >
                Create Task
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Task</th>
                      <th className="px-3 py-2 text-left">Assigned By</th>
                      <th className="px-3 py-2 text-left">Assigned To</th>
                      <th className="px-3 py-2 text-left">Due</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.map((task) => (
                      <tr
                        key={task.task_id}
                        id={`contact-task-${task.task_id}`}
                        className={`hover:bg-muted/40 ${
                          highlightTaskId === task.task_id ? "bg-primary/10 ring-2 ring-primary/40" : ""
                        }`}
                      >
                        <td className="px-3 py-2">
                          <button
                            className="text-primary hover:underline"
                            onClick={() => navigate(`/tasks/${task.task_id}`)}
                          >
                            {task.task_description}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {userMap.get(task.user_id) || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {userMap.get(task.assigned_to) || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {task.due_date ? formatDateInTimeZone(task.due_date, user) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {task.is_completed ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Done</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Open</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {task.account_id ? (
                            <button
                              className="text-primary hover:underline"
                              onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                            >
                              {accountMap.get(task.account_id)?.business_name || `Account #${task.account_id}`}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Contact Snapshot</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Owner:</span>{" "}
                {contact.contact_owner_name || userMap.get(contact.contact_owner_user_id) || "—"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Phone:</span> {contact.phone || "—"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Email:</span> {contact.email || "—"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Status:</span> {contact.status || "active"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Do Not Call:</span>{" "}
                {contact.do_not_call ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Email Opt Out:</span>{" "}
                {contact.email_opt_out ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <AuditSection title="Contact Audit" filters={{ contact_id: Number(contactId) }} />
        </div>
      </div>
    </div>
  );
};

ContactDetailsPage.propTypes = {
  user: PropTypes.shape({
    user_id: PropTypes.number,
    email: PropTypes.string,
    contacts_autosave: PropTypes.bool,
  }).isRequired,
};

export default ContactDetailsPage;
