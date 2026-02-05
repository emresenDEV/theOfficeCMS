import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
  createContactInteraction,
  fetchContactById,
  followContact,
  unfollowContact,
  updateContactInteraction,
  deleteContactInteraction,
  updateContact,
  updateContactAccounts,
} from "../services/contactService";
import { fetchAccounts } from "../services/accountService";
import { fetchUsers } from "../services/userService";
import { createTask, fetchTasksByAccount, updateTask } from "../services/tasksService";
import { fetchAllInvoices } from "../services/invoiceService";
import { fetchBranches } from "../services/branchService";
import AuditSection from "../components/AuditSection";
import { formatDateTimeInTimeZone, formatDateInTimeZone } from "../utils/timezone";

const ContactDetailsPage = ({ user, embedded = false, contactIdOverride, onClose }) => {
  const { contactId: routeContactId } = useParams();
  const contactId = contactIdOverride ?? routeContactId;
  const resolvedContactId = contactId ? Number(contactId) : null;
  const location = useLocation();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [accountTaskCounts, setAccountTaskCounts] = useState({});
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
  const currentUserId = user?.user_id ?? user?.id ?? null;
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
  const [interactionSaving, setInteractionSaving] = useState(false);
  const [editInteraction, setEditInteraction] = useState(null);
  const [editInteractionForm, setEditInteractionForm] = useState({
    interaction_type: "call",
    subject: "",
    notes: "",
    account_id: "",
    phone_number: "",
    email_address: "",
  });
  const [taskForm, setTaskForm] = useState({
    task_description: "",
    assigned_to: currentUserId || "",
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
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [toolTab, setToolTab] = useState("followup");
  const [auditTab, setAuditTab] = useState("general");
  const [taskAssigneeQuery, setTaskAssigneeQuery] = useState("");
  const [followupAssigneeQuery, setFollowupAssigneeQuery] = useState("");
  const [taskAssigneeOpen, setTaskAssigneeOpen] = useState(false);
  const [followupAssigneeOpen, setFollowupAssigneeOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [followupCompleteTask, setFollowupCompleteTask] = useState(null);
  const [followupCompleteNote, setFollowupCompleteNote] = useState("");
  const [followupCompleting, setFollowupCompleting] = useState(false);

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
    const toastState = location.state?.toast;
    if (!toastState) return;
    setToast(toastState);
    const timeoutId = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeoutId);
  }, [location.state]);

  const showToast = (message, type = "success") => {
    setToast({ type, message });
    const timeoutId = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!resolvedContactId) {
        setContact(null);
        setForm(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [contactData, accountsData, usersData, branchesData, invoiceData] = await Promise.all([
        fetchContactById(resolvedContactId, currentUserId),
        fetchAccounts(),
        fetchUsers(),
        fetchBranches(),
        fetchAllInvoices(),
      ]);
      if (!mounted) return;
      setContact(contactData);
      setForm(
        contactData
          ? {
              first_name: contactData.first_name || "",
              last_name: contactData.last_name || "",
              title: contactData.title || "",
              phone: contactData.phone || "",
              email: contactData.email || "",
              status: contactData.status || "active",
              do_not_call: !!contactData.do_not_call,
              email_opt_out: !!contactData.email_opt_out,
              contact_owner_user_id: contactData.contact_owner_user_id || "",
            }
          : null
      );
      setAccounts(accountsData);
      setUsers(usersData);
      setBranches(branchesData || []);
      setInvoices(invoiceData || []);
      setInteractions(contactData?.interactions || []);
      setTasks(contactData?.tasks || []);
      setIsFollowing(!!contactData?.is_following);

      const ownerId = contactData?.contact_owner_user_id || currentUserId || "";
      const ownerUser = usersData?.find((u) => u.user_id === ownerId);
      const ownerName = ownerUser ? `${ownerUser.first_name || ""} ${ownerUser.last_name || ""}`.trim() : "";
      const currentUser = usersData?.find((u) => u.user_id === currentUserId);
      const currentUserName = currentUser
        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
        : "";

      setFollowupForm((prev) => ({
        ...prev,
        assigned_to: ownerId,
      }));
      setFollowupAssigneeQuery(ownerName);
      setTaskAssigneeQuery(currentUserName);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [resolvedContactId, currentUserId]);

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
        actor_user_id: currentUserId,
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
  }, [accountAdds, accountRemoves, contact, currentUserId, user?.email]);

  useEffect(() => {
    let active = true;
    const loadAccountTaskCounts = async () => {
      if (!contact?.accounts?.length) {
        setAccountTaskCounts({});
        return;
      }
      const entries = await Promise.all(
        contact.accounts.map(async (acc) => {
          const accountTasks = await fetchTasksByAccount(acc.account_id);
          const openCount = (accountTasks || []).filter((task) => !task.is_completed).length;
          return [acc.account_id, openCount];
        })
      );
      if (!active) return;
      const next = {};
      entries.forEach(([accountId, count]) => {
        next[accountId] = count;
      });
      setAccountTaskCounts(next);
    };
    loadAccountTaskCounts();
    return () => {
      active = false;
    };
  }, [contact?.accounts]);

  useEffect(() => {
    if (!highlightTaskId) return;
    const targetTask = tasks.find((item) => item.task_id === highlightTaskId);
    if (targetTask?.task_description?.toLowerCase().startsWith("follow up with")) {
      setAuditTab("followup");
    } else if (targetTask) {
      setAuditTab("tasks");
    }
    const timeoutId = setTimeout(() => {
      const row = document.getElementById(`contact-task-${highlightTaskId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [highlightTaskId, tasks]);

  useEffect(() => {
    const handler = (event) => {
      if (!event.altKey) return;
      if (event.key.toLowerCase() !== "m") return;
      if (!currentUserId) return;
      setFollowupForm((prev) => ({ ...prev, assigned_to: currentUserId }));
      const me = users.find((u) => u.user_id === currentUserId);
      if (me) {
        setFollowupAssigneeQuery(`${me.first_name || ""} ${me.last_name || ""}`.trim());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentUserId, users]);

  useEffect(() => {
    if (!showEditModal || !form) return;
    const owner = users.find((u) => u.user_id === Number(form.contact_owner_user_id));
    const ownerName = owner ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() : "";
    setOwnerSearch(ownerName);
  }, [showEditModal, form, users]);

  useEffect(() => {
    if (!users.length) return;
    if (!taskAssigneeQuery && taskForm.assigned_to) {
      const current = users.find((u) => u.user_id === Number(taskForm.assigned_to));
      if (current) {
        setTaskAssigneeQuery(`${current.first_name || ""} ${current.last_name || ""}`.trim());
      }
    }
    if (!followupAssigneeQuery && followupForm.assigned_to) {
      const current = users.find((u) => u.user_id === Number(followupForm.assigned_to));
      if (current) {
        setFollowupAssigneeQuery(`${current.first_name || ""} ${current.last_name || ""}`.trim());
      }
    }
  }, [users, taskAssigneeQuery, followupAssigneeQuery, taskForm.assigned_to, followupForm.assigned_to]);

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

  const branchMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => {
      map.set(branch.branch_id, branch.branch_name);
    });
    return map;
  }, [branches]);

  const invoiceCountsByAccount = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (!inv.account_id) return;
      const entry = map.get(inv.account_id) || { total: 0, byStatus: {} };
      const status = inv.status || "Unknown";
      entry.total += 1;
      entry.byStatus[status] = (entry.byStatus[status] || 0) + 1;
      map.set(inv.account_id, entry);
    });
    return map;
  }, [invoices]);

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

  const getUserDisplay = (userId) => {
    return userMap.get(userId) || "—";
  };

  const filterUsers = (query) => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`.trim().toLowerCase();
        const username = (u.username || "").toLowerCase();
        return name.includes(term) || username.includes(term);
      })
      .slice(0, 8);
  };

  const formatPhone = (value) => {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) {
      return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  };

  const taskAssigneeResults = useMemo(() => {
    return filterUsers(taskAssigneeQuery);
  }, [taskAssigneeQuery, users]);

  const followupAssigneeResults = useMemo(() => {
    return filterUsers(followupAssigneeQuery);
  }, [followupAssigneeQuery, users]);

  const ownerResults = useMemo(() => {
    return filterUsers(ownerSearch);
  }, [ownerSearch, users]);

  const displayName = useMemo(() => {
    if (!contact) return "";
    const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
    return name || "Unnamed Contact";
  }, [contact]);

  const isFollowupTask = (task) => {
    return !!task?.is_followup;
  };

  const followupTasks = useMemo(() => {
    return tasks.filter((task) => isFollowupTask(task) && !task.is_completed);
  }, [tasks]);

  const nonFollowupTasks = useMemo(() => {
    return tasks.filter((task) => !isFollowupTask(task));
  }, [tasks]);

  const parseDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const normalized = value.includes("T") ? value : value.replace(" ", "T");
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getCustomerSince = (value) => {
    const createdAt = parseDateValue(value);
    if (!createdAt) return null;
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    return { createdAt, years, days, diffDays };
  };

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
      actor_user_id: currentUserId,
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
    if (!currentUserId || !contact) return;
    if (isFollowing) {
      const res = await unfollowContact(contact.contact_id, currentUserId);
      if (res) setIsFollowing(false);
    } else {
      const res = await followContact(contact.contact_id, currentUserId);
      if (res) setIsFollowing(true);
    }
  };

  const handleInteractionSubmit = async () => {
    if (interactionSaving) return;
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
      actor_user_id: currentUserId,
      actor_email: user?.email,
    };

    setInteractionSaving(true);
    const created = await createContactInteraction(contact.contact_id, payload);
    if (created?.duplicate) {
      showToast("Duplicate interaction prevented.");
      setInteractionSaving(false);
      return;
    }
    if (created?.interaction_id) {
      setInteractions((prev) => {
        const exists = prev.some((item) => item.interaction_id === created.interaction_id);
        if (exists) return prev;
        return [created, ...prev];
      });
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
      showToast("Interaction logged.");
    }
    setInteractionSaving(false);
  };

  const handleTaskCreate = async () => {
    if (!currentUserId) return;
    if (!taskForm.task_description || !taskForm.due_date) return;
    const payload = {
      user_id: currentUserId,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : currentUserId,
      task_description: taskForm.task_description,
      due_date: taskForm.due_date,
      account_id: taskForm.account_id ? Number(taskForm.account_id) : null,
      contact_id: contact.contact_id,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    };
    const created = await createTask(payload);
    if (created) {
      setTasks((prev) => [created, ...prev]);
      setTaskForm({
        task_description: "",
        assigned_to: currentUserId || "",
        due_date: "",
        account_id: "",
      });
      const current = users.find((u) => u.user_id === currentUserId);
      if (current) {
        setTaskAssigneeQuery(`${current.first_name || ""} ${current.last_name || ""}`.trim());
      } else {
        setTaskAssigneeQuery("");
      }
      setTaskAssigneeOpen(false);
      showToast("Task created.");
    }
  };

  const handleEditInteractionOpen = (interaction) => {
    setEditInteraction(interaction);
    setEditInteractionForm({
      interaction_type: interaction.interaction_type || "call",
      subject: interaction.subject || "",
      notes: interaction.notes || "",
      account_id: interaction.account_id ? String(interaction.account_id) : "",
      phone_number: interaction.phone_number || "",
      email_address: interaction.email_address || "",
    });
  };

  const handleEditInteractionSave = async () => {
    if (!editInteraction || !contact) return;
    const payload = {
      interaction_type: editInteractionForm.interaction_type,
      subject: editInteractionForm.subject,
      notes: editInteractionForm.notes,
      account_id: editInteractionForm.account_id ? Number(editInteractionForm.account_id) : null,
      phone_number: editInteractionForm.phone_number || null,
      email_address: editInteractionForm.email_address || null,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    };
    const updated = await updateContactInteraction(contact.contact_id, editInteraction.interaction_id, payload);
    if (updated) {
      setInteractions((prev) =>
        prev.map((item) =>
          item.interaction_id === updated.interaction_id ? updated : item
        )
      );
      showToast("Interaction updated.");
      setEditInteraction(null);
    }
  };

  const handleDeleteInteraction = async (interactionId) => {
    if (!contact) return;
    const confirmed = window.confirm("Delete this interaction? This cannot be undone.");
    if (!confirmed) return;
    const deleted = await deleteContactInteraction(contact.contact_id, interactionId, {
      actor_user_id: currentUserId,
      actor_email: user?.email,
    });
    if (deleted) {
      setInteractions((prev) => prev.filter((item) => item.interaction_id !== interactionId));
      showToast("Interaction deleted.");
    }
  };

  const handleFollowupCreate = async () => {
    if (!currentUserId) return;
    if (!followupForm.due_date) return;
    const descriptionBase = `Follow up with ${displayName}`;
    const description = followupForm.note
      ? `${descriptionBase} - ${followupForm.note}`
      : descriptionBase;
    const payload = {
      user_id: currentUserId,
      assigned_to: followupForm.assigned_to
        ? Number(followupForm.assigned_to)
        : contact.contact_owner_user_id || currentUserId,
      task_description: description,
      due_date: followupForm.due_date,
      account_id: followupForm.account_id ? Number(followupForm.account_id) : null,
      contact_id: contact.contact_id,
      is_followup: true,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    };
    const created = await createTask(payload);
    if (created) {
      setTasks((prev) => [created, ...prev]);
      const ownerId = contact.contact_owner_user_id || currentUserId || "";
      const owner = users.find((u) => u.user_id === ownerId);
      setFollowupForm({
        due_date: "",
        note: "",
        account_id: "",
        assigned_to: ownerId,
      });
      setFollowupAssigneeQuery(owner ? `${owner.first_name || ""} ${owner.last_name || ""}`.trim() : "");
      setFollowupAssigneeOpen(false);
      showToast("Follow-up created.");
    }
  };

  const handleManualSave = async () => {
    await handleSave();
    setShowEditModal(false);
  };

  const handleToggleTaskStatus = async (task) => {
    const updated = await updateTask(task.task_id, {
      is_completed: !task.is_completed,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    });
    if (updated) {
      setTasks((prev) =>
        prev.map((item) =>
          item.task_id === task.task_id
            ? { ...item, is_completed: updated.is_completed ?? !task.is_completed }
            : item
        )
      );
    }
  };

  const handleCompleteFollowup = async () => {
    if (!followupCompleteTask) return;
    setFollowupCompleting(true);
    const updated = await updateTask(followupCompleteTask.task_id, {
      is_completed: true,
      actor_user_id: currentUserId,
      actor_email: user?.email,
    });
    if (updated) {
      setTasks((prev) =>
        prev.map((item) =>
          item.task_id === followupCompleteTask.task_id ? { ...item, is_completed: true } : item
        )
      );
      const interactionPayload = {
        interaction_type: "followup",
        subject: "Follow-up completed",
        notes: followupCompleteNote || followupCompleteTask.task_description,
        account_id: followupCompleteTask.account_id ? Number(followupCompleteTask.account_id) : null,
        actor_user_id: currentUserId,
        actor_email: user?.email,
      };
      const created = await createContactInteraction(contact.contact_id, interactionPayload);
      if (created?.interaction_id) {
        setInteractions((prev) => [created, ...prev]);
      }
    }
    setFollowupCompleteTask(null);
    setFollowupCompleteNote("");
    setFollowupCompleting(false);
  };

  if (loading) {
    return <div className={embedded ? "p-4 text-sm text-muted-foreground" : "px-4 py-4 text-sm text-muted-foreground sm:px-6 sm:py-6"}>Loading contact...</div>;
  }

  if (!contact || !form) {
    return <div className={embedded ? "p-4 text-sm text-muted-foreground" : "px-4 py-4 text-sm text-muted-foreground sm:px-6 sm:py-6"}>Contact not found.</div>;
  }

  return (
    <div className={embedded ? "p-4" : "flex-1 px-4 py-4 sm:px-6 sm:py-6"}>
      {toast && (
        <div className="fixed right-4 bottom-4 z-50 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg sm:right-6 sm:bottom-6">
          {toast.message}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => navigate("/contacts")}
          >
            ← Back to Contacts
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Contact Details</span>
        )}
        <div className="flex items-center gap-2">
          {embedded && onClose && (
            <button
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Close
            </button>
          )}
          <button
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            onClick={() => setShowEditModal(true)}
          >
            Edit Contact
          </button>
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

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Phone:</span> {contact.phone || "—"}
              </p>
              <p>
                <span className="font-semibold text-foreground">Email:</span> {contact.email || "—"}
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Status:</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  form.status === "inactive" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {form.status || "active"}
              </span>
            </div>
            <p>
              <span className="font-semibold text-foreground">Owner:</span>{" "}
              {contact.contact_owner_name || getUserDisplay(contact.contact_owner_user_id)}
            </p>
            <p>
              <span className="font-semibold text-foreground">Do Not Call:</span>{" "}
              {contact.do_not_call ? "Yes" : "No"}
              {contact.do_not_call_date && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatDateInTimeZone(contact.do_not_call_date, user)})
                </span>
              )}
            </p>
            <p>
              <span className="font-semibold text-foreground">Email Opt Out:</span>{" "}
              {contact.email_opt_out ? "Yes" : "No"}
              {contact.email_opt_out_date && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatDateInTimeZone(contact.email_opt_out_date, user)})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Accounts</h2>
              <button
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                onClick={() => setShowAccountModal(true)}
              >
                Move to New Company +
              </button>
            </div>
            {contact.accounts?.length ? (
              <div className="mt-4 space-y-4">
                {contact.accounts.map((acc) => {
                  const fullAccount = accountMap.get(acc.account_id) || acc;
                  const salesRep = users.find((u) => u.user_id === fullAccount.sales_rep_id);
                  const branchName = branchMap.get(salesRep?.branch_id || fullAccount.branch_id);
                  const invoiceInfo = invoiceCountsByAccount.get(acc.account_id) || { total: 0, byStatus: {} };
                  const customerSince = getCustomerSince(fullAccount.date_created);
                  const lastOpened = fullAccount.date_updated || fullAccount.date_created;
                  return (
                    <div key={acc.account_id} className="rounded-md border border-border bg-card p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <button
                            className="text-base font-semibold text-primary hover:underline"
                            onClick={() => navigate(`/accounts/details/${acc.account_id}`)}
                          >
                            {fullAccount.business_name || acc.business_name}
                          </button>
                          <p className="text-sm text-muted-foreground">{fullAccount.address || "—"}</p>
                          <p className="text-sm text-muted-foreground">
                            {fullAccount.city || ""}
                            {fullAccount.city && fullAccount.state ? ", " : ""}
                            {fullAccount.state || ""} {fullAccount.zip_code || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Region: {fullAccount.region_name || fullAccount.region || "—"}
                          </p>
                        </div>
                        {customerSince && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                            Customer since {formatDateInTimeZone(fullAccount.date_created, user, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} • {customerSince.years}y {customerSince.days}d
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">Assigned Rep:</span>{" "}
                            {salesRep
                              ? `${salesRep.first_name || ""} ${salesRep.last_name || ""}`.trim()
                              : "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Branch:</span> {branchName || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Rep Phone:</span> {salesRep?.phone_number || "—"}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Rep Email:</span> {salesRep?.email || "—"}
                          </p>
                        </div>
                        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                          <p className="text-xs uppercase text-muted-foreground">Snapshot</p>
                          <p className="mt-2 text-foreground">Invoices: {invoiceInfo.total || 0}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {Object.keys(invoiceInfo.byStatus || {}).length === 0 ? (
                              <span>No invoices yet</span>
                            ) : (
                              Object.entries(invoiceInfo.byStatus).map(([status, count]) => (
                                <span key={status} className="rounded-full border border-border bg-card px-2 py-0.5">
                                  {status}: {count}
                                </span>
                              ))
                            )}
                          </div>
                          <p className="mt-2 text-foreground">Open tasks: {accountTaskCounts[acc.account_id] ?? 0}</p>
                          <p className="mt-1 text-muted-foreground">
                            Last opened:{" "}
                            {lastOpened
                              ? formatDateInTimeZone(lastOpened, user, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No linked accounts.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Contact Tools</h2>
              <span className="text-xs text-muted-foreground">Forms</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <button
                className={`rounded-full px-3 py-1 ${
                  toolTab === "followup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setToolTab("followup")}
              >
                Followup
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  toolTab === "interaction" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setToolTab("interaction")}
              >
                Log Interaction
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  toolTab === "task" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setToolTab("task")}
              >
                Tasks
              </button>
            </div>
            <div className="mt-4">
              {toolTab === "followup" && (
                <div className="space-y-3">
                  <input
                    type="date"
                    className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                    value={followupForm.due_date}
                    onChange={(e) => setFollowupForm((prev) => ({ ...prev, due_date: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                        placeholder="Assign to..."
                        value={followupAssigneeQuery}
                        onFocus={() => setFollowupAssigneeOpen(true)}
                        onBlur={() => setTimeout(() => setFollowupAssigneeOpen(false), 150)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFollowupAssigneeQuery(value);
                          setFollowupForm((prev) => ({ ...prev, assigned_to: value ? "" : prev.assigned_to }));
                        }}
                      />
                      {followupAssigneeOpen && followupAssigneeResults.length > 0 && followupAssigneeQuery && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                          {followupAssigneeResults.map((assignee) => (
                            <button
                              key={assignee.user_id}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setFollowupForm((prev) => ({ ...prev, assigned_to: assignee.user_id }));
                                setFollowupAssigneeQuery(
                                  `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim()
                                );
                                setFollowupAssigneeOpen(false);
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
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted/40"
                      onClick={() => {
                        setFollowupForm((prev) => ({ ...prev, assigned_to: currentUserId }));
                        const me = users.find((u) => u.user_id === currentUserId);
                        if (me) {
                          setFollowupAssigneeQuery(`${me.first_name || ""} ${me.last_name || ""}`.trim());
                        }
                        setFollowupAssigneeOpen(false);
                      }}
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
                  <textarea
                    className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                    placeholder="Follow-up notes (optional)"
                    rows={3}
                    value={followupForm.note}
                    onChange={(e) => setFollowupForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                  <div className="flex justify-end">
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      onClick={handleFollowupCreate}
                    >
                      Create Follow-up Task
                    </button>
                  </div>
                </div>
              )}

              {toolTab === "interaction" && (
                <div className="space-y-3">
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
                  <textarea
                    className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                    placeholder="Notes"
                    rows={3}
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
                        Account phone: {formatPhone(phone)}
                      </option>
                    ))}
                    {contact.phone && (
                      <option value={`contact:${contact.phone}`}>
                        Contact phone: {formatPhone(contact.phone)}
                      </option>
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
                  <div className="flex justify-end">
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      onClick={handleInteractionSubmit}
                      disabled={interactionSaving}
                    >
                      {interactionSaving ? "Logging..." : "Log Interaction"}
                    </button>
                  </div>
                </div>
              )}

              {toolTab === "task" && (
                <div className="space-y-3">
                  <input
                    className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                    placeholder="Task description"
                    value={taskForm.task_description}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, task_description: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                        placeholder="Assign to..."
                        value={taskAssigneeQuery}
                        onFocus={() => setTaskAssigneeOpen(true)}
                        onBlur={() => setTimeout(() => setTaskAssigneeOpen(false), 150)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTaskAssigneeQuery(value);
                          setTaskForm((prev) => ({ ...prev, assigned_to: value ? "" : prev.assigned_to }));
                        }}
                      />
                      {taskAssigneeOpen && taskAssigneeResults.length > 0 && taskAssigneeQuery && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                          {taskAssigneeResults.map((assignee) => (
                            <button
                              key={assignee.user_id}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTaskForm((prev) => ({ ...prev, assigned_to: assignee.user_id }));
                                setTaskAssigneeQuery(
                                  `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim()
                                );
                                setTaskAssigneeOpen(false);
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
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted/40"
                      onClick={() => {
                        setTaskForm((prev) => ({ ...prev, assigned_to: currentUserId }));
                        const me = users.find((u) => u.user_id === currentUserId);
                        if (me) {
                          setTaskAssigneeQuery(`${me.first_name || ""} ${me.last_name || ""}`.trim());
                        }
                        setTaskAssigneeOpen(false);
                      }}
                      title="Assign to me"
                    >
                      Me
                    </button>
                  </div>
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
                  <div className="flex justify-end">
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      onClick={handleTaskCreate}
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Contact Audit</h2>
              <span className="text-xs text-muted-foreground">Activity</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <button
                className={`rounded-full px-3 py-1 ${
                  auditTab === "general" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setAuditTab("general")}
              >
                General
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  auditTab === "followup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setAuditTab("followup")}
              >
                Followups
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  auditTab === "interactions" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setAuditTab("interactions")}
              >
                Interactions
              </button>
              <button
                className={`rounded-full px-3 py-1 ${
                  auditTab === "tasks" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setAuditTab("tasks")}
              >
                Tasks
              </button>
            </div>
            <div className="mt-4">
              {auditTab === "general" && (
                <AuditSection title="Contact Audit" filters={{ contact_id: resolvedContactId || 0 }} />
              )}

              {auditTab === "followup" && (
                <div>
                  {followupTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open followups.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[700px] w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 text-left">Task</th>
                            <th className="px-3 py-2 text-left">Due</th>
                            <th className="px-3 py-2 text-left">Assigned To</th>
                            <th className="px-3 py-2 text-left">Account</th>
                            <th className="px-3 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {followupTasks.map((task) => (
                            <tr
                              key={task.task_id}
                              id={`contact-task-${task.task_id}`}
                              className={`hover:bg-muted/40 ${
                                highlightTaskId === task.task_id ? "bg-primary/10 ring-2 ring-primary/40" : ""
                              }`}
                            >
                              <td className="px-3 py-2 text-foreground">{task.task_description}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {task.due_date ? formatDateInTimeZone(task.due_date, user) : "—"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {getUserDisplay(task.assigned_to)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {task.account_id ? (
                                  <button
                                    className="text-primary hover:underline"
                                    onClick={() => navigate(`/accounts/details/${task.account_id}`)}
                                  >
                                    {accountMap.get(task.account_id)?.business_name || `Account #${task.account_id}`}
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                                  onClick={() => {
                                    setFollowupCompleteTask(task);
                                    setFollowupCompleteNote("");
                                  }}
                                >
                                  Complete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Completed followups move to Interactions and are stored there.
                  </p>
                </div>
              )}

              {auditTab === "interactions" && (
                <div>
                  {interactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No interactions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {interactions.map((interaction) => (
                        <div key={interaction.interaction_id} className="rounded-md border border-border bg-muted/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {(interaction.interaction_type || "interaction").replace(/_/g, " ")}
                              {interaction.subject ? ` • ${interaction.subject}` : ""}
                            </p>
                            <div className="flex items-center gap-2">
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
                              <button
                                className="text-xs font-semibold text-primary hover:underline"
                                onClick={() => handleEditInteractionOpen(interaction)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs font-semibold text-destructive hover:underline"
                                onClick={() => handleDeleteInteraction(interaction.interaction_id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {interaction.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{interaction.notes}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {interaction.phone_number && <span>📞 {formatPhone(interaction.phone_number)}</span>}
                            {interaction.email_address && <span>✉️ {interaction.email_address}</span>}
                            {interaction.account_id && (
                              <button
                                className="text-primary hover:underline"
                                onClick={() => navigate(`/accounts/details/${interaction.account_id}`)}
                              >
                                {accountMap.get(interaction.account_id)?.business_name ||
                                  `Account #${interaction.account_id}`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {auditTab === "tasks" && (
                <div>
                  {nonFollowupTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full text-sm">
                        <thead className="text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 text-left">Task</th>
                            <th className="px-3 py-2 text-left">Assigned By</th>
                            <th className="px-3 py-2 text-left">Assigned To</th>
                            <th className="px-3 py-2 text-left">Due</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {nonFollowupTasks.map((task) => (
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
                              <td className="px-3 py-2 text-muted-foreground">{getUserDisplay(task.user_id)}</td>
                              <td className="px-3 py-2 text-muted-foreground">{getUserDisplay(task.assigned_to)}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {task.due_date ? formatDateInTimeZone(task.due_date, user) : "—"}
                              </td>
                              <td className="px-3 py-2">
                                {task.is_completed ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    Done
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                    Open
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    task.is_completed
                                      ? "bg-secondary text-secondary-foreground"
                                      : "bg-primary text-primary-foreground"
                                  }`}
                                  onClick={() => handleToggleTaskStatus(task)}
                                >
                                  {task.is_completed ? "Undo" : "Complete"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Edit Contact</h2>
                <p className="text-xs text-muted-foreground">
                  {autosaveEnabled ? "Auto-save on" : "Auto-save off"}
                  {saveMessage ? ` • ${saveMessage}` : ""}
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
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
              <div className="relative md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Contact Owner
                </label>
                <input
                  className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                  placeholder="Search owner..."
                  value={ownerSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOwnerSearch(value);
                    setForm((prev) => ({ ...prev, contact_owner_user_id: value ? "" : prev.contact_owner_user_id }));
                    setDirty(true);
                  }}
                />
                {ownerResults.length > 0 && ownerSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                    {ownerResults.map((owner) => (
                      <button
                        key={owner.user_id}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          handleFieldChange("contact_owner_user_id", owner.user_id);
                          setOwnerSearch(`${owner.first_name || ""} ${owner.last_name || ""}`.trim());
                        }}
                      >
                        <span>
                          {owner.first_name} {owner.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">ID {owner.user_id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
                onClick={handleManualSave}
                disabled={saving || !dirty}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editInteraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Edit Interaction</h2>
                <p className="text-xs text-muted-foreground">Update details and save.</p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setEditInteraction(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={editInteractionForm.interaction_type}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, interaction_type: e.target.value }))
                }
              >
                <option value="call">Phone Call</option>
                <option value="email">Email</option>
                <option value="followup">Follow-up</option>
                <option value="note">Note</option>
              </select>
              <select
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                value={editInteractionForm.account_id}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, account_id: e.target.value }))
                }
              >
                <option value="">No account</option>
                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Subject"
                value={editInteractionForm.subject}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Notes"
                rows={3}
                value={editInteractionForm.notes}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Phone number"
                value={editInteractionForm.phone_number}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, phone_number: e.target.value }))
                }
              />
              <input
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                placeholder="Email address"
                value={editInteractionForm.email_address}
                onChange={(e) =>
                  setEditInteractionForm((prev) => ({ ...prev, email_address: e.target.value }))
                }
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setEditInteraction(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={handleEditInteractionSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Move to New Company</h2>
                <p className="text-xs text-muted-foreground">Changes auto-save as you update selections.</p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowAccountModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {accountSaving ? "Saving..." : accountSaveMessage || "Auto-save on"}
              </span>
              <button
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                onClick={() => setShowAccountModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {followupCompleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-4 shadow-lg sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Complete Follow-up</h2>
                <p className="text-xs text-muted-foreground">
                  Completing this follow-up moves it into Interactions.
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setFollowupCompleteTask(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-foreground">{followupCompleteTask.task_description}</p>
              <textarea
                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                rows={4}
                placeholder="Completion notes (optional)"
                value={followupCompleteNote}
                onChange={(e) => setFollowupCompleteNote(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setFollowupCompleteTask(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                onClick={handleCompleteFollowup}
                disabled={followupCompleting}
              >
                {followupCompleting ? "Completing..." : "Complete Follow-up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ContactDetailsPage.propTypes = {
  user: PropTypes.shape({
    user_id: PropTypes.number,
    email: PropTypes.string,
    contacts_autosave: PropTypes.bool,
  }).isRequired,
  embedded: PropTypes.bool,
  contactIdOverride: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClose: PropTypes.func,
};

export default ContactDetailsPage;
