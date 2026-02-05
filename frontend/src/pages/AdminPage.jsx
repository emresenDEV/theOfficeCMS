import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { formatDateTimeInTimeZone } from "../utils/timezone";
import { fetchUsers } from "../services/userService";
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from "../services/accountService";
import { fetchAllInvoices, createInvoice, updateInvoice, deleteInvoice, fetchInvoiceById, fetchPaymentMethods, logInvoicePayment } from "../services/invoiceService";
import { fetchServices } from "../services/servicesService";
import { fetchIndustries } from "../services/industryService";
import { fetchBranches } from "../services/branchService";
import { fetchDepartments } from "../services/departmentService";
import { fetchAllRoles } from "../services/userRoleService";
import { createUser, updateUser, deleteUser } from "../services/adminService";
import { fetchAuditSummary } from "../services/auditService";
import { fetchAllTasks, createTask, updateTask, deleteTask } from "../services/tasksService";
import { fetchAllCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService";
import { fetchPayments, updatePayment, deletePayment } from "../services/paymentService";
import AuditSection from "../components/AuditSection";
import { cn } from "../lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "accounts", label: "Accounts" },
  { id: "invoices", label: "Invoices" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "payments", label: "Payments" },
  { id: "audit", label: "Audit" },
];

const AdminPage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") || "overview";
  const tabIds = useMemo(() => new Set(tabs.map((tab) => tab.id)), []);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [auditTab, setAuditTab] = useState("all");

  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [services, setServices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    role_id: "",
    department_id: "",
    branch_id: "",
  });
  const [editingUser, setEditingUser] = useState(null);

  const [newAccount, setNewAccount] = useState({
    business_name: "",
    contact_first_name: "",
    contact_last_name: "",
    phone_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    region: "",
    industry_id: "",
    user_id: "",
    branch_id: "",
    notes: "",
  });
  const [editingAccount, setEditingAccount] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    account_id: "",
    sales_rep_id: "",
    due_date: "",
    tax_rate: "0",
    discount_percent: "0",
    services: [{ service_id: "", quantity: 1, price_per_unit: "", discount_percent: "0" }],
  });
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [newTask, setNewTask] = useState({
    task_description: "",
    due_date: "",
    assigned_to: "",
    account_id: "",
  });
  const [editingTask, setEditingTask] = useState(null);

  const [newEvent, setNewEvent] = useState({
    event_title: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    reminder_minutes: "",
    account_id: "",
    user_id: "",
    contact_name: "",
    phone_number: "",
    notes: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);

  const [newPayment, setNewPayment] = useState({
    invoice_id: "",
    account_id: "",
    sales_rep_id: "",
    payment_method: "",
    last_four_payment_method: "",
    total_paid: "",
  });
  const [editingPayment, setEditingPayment] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(location.search);
    next.set("tab", activeTab);
    navigate({ search: next.toString() }, { replace: true });
  }, [activeTab, navigate]);

  useEffect(() => {
    const nextTab = new URLSearchParams(location.search).get("tab");
    if (nextTab && nextTab !== activeTab && tabIds.has(nextTab)) {
      setActiveTab(nextTab);
    }
  }, [location.search, activeTab, tabIds]);

  useEffect(() => {
    const load = async () => {
      const [
        userList,
        accountList,
        invoiceList,
        taskList,
        eventList,
        paymentList,
        serviceList,
        roleList,
        deptList,
        branchList,
        industryList,
        paymentMethodList,
        summary,
      ] = await Promise.all([
        fetchUsers(),
        fetchAccounts(),
        fetchAllInvoices(),
        fetchAllTasks(),
        fetchAllCalendarEvents(),
        fetchPayments(),
        fetchServices(),
        fetchAllRoles(),
        fetchDepartments(),
        fetchBranches(),
        fetchIndustries(),
        fetchPaymentMethods(),
        fetchAuditSummary(7),
      ]);
      setUsers(userList);
      setAccounts(accountList);
      setInvoices(invoiceList);
      setTasks(taskList);
      setCalendarEvents(eventList);
      setPayments(paymentList);
      setServices(serviceList);
      setRoles(roleList);
      setDepartments(deptList);
      setBranches(branchList);
      setIndustries(industryList);
      setPaymentMethods(paymentMethodList);
      setAuditSummary(summary);
    };
    load();
  }, []);

  const refreshUsers = async () => setUsers(await fetchUsers());
  const refreshAccounts = async () => setAccounts(await fetchAccounts());
  const refreshInvoices = async () => setInvoices(await fetchAllInvoices());
  const refreshTasks = async () => setTasks(await fetchAllTasks());
  const refreshEvents = async () => setCalendarEvents(await fetchAllCalendarEvents());
  const refreshPayments = async () => setPayments(await fetchPayments());

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.user_id, label: `${u.first_name} ${u.last_name}` })),
    [users]
  );
  const accountMap = useMemo(() => new Map(accounts.map((acc) => [acc.account_id, acc.business_name])), [accounts]);
  const invoiceMap = useMemo(() => new Map(invoices.map((inv) => [inv.invoice_id, inv])), [invoices]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await createUser({
      ...newUser,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setNewUser({
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      role_id: "",
      department_id: "",
      branch_id: "",
    });
    refreshUsers();
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    await updateUser(editingUser.user_id, {
      ...editingUser,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setEditingUser(null);
    refreshUsers();
  };

  const handleDeleteUser = async (userId) => {
    await deleteUser(userId, user.user_id, user.email);
    refreshUsers();
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    await createAccount({
      ...newAccount,
      industry_id: newAccount.industry_id || null,
      user_id: newAccount.user_id || null,
      branch_id: newAccount.branch_id || null,
      created_by: user.user_id,
    });
    setNewAccount({
      business_name: "",
      contact_first_name: "",
      contact_last_name: "",
      phone_number: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      region: "",
      industry_id: "",
      user_id: "",
      branch_id: "",
      notes: "",
    });
    refreshAccounts();
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    await updateAccount(editingAccount.account_id, editingAccount, user.user_id);
    setEditingAccount(null);
    refreshAccounts();
  };

  const handleDeleteAccount = async (accountId) => {
    await deleteAccount(accountId, user.user_id, user.email);
    refreshAccounts();
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    await createInvoice({
      ...newInvoice,
      account_id: Number(newInvoice.account_id),
      sales_rep_id: Number(newInvoice.sales_rep_id),
      tax_rate: Number(newInvoice.tax_rate || 0),
      discount_percent: Number(newInvoice.discount_percent || 0),
      services: newInvoice.services.map((s) => ({
        ...s,
        quantity: Number(s.quantity || 1),
        price_per_unit: Number(s.price_per_unit || 0),
        discount_percent: Number(s.discount_percent || 0),
      })),
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setNewInvoice({
      account_id: "",
      sales_rep_id: "",
      due_date: "",
      tax_rate: "0",
      discount_percent: "0",
      services: [{ service_id: "", quantity: 1, price_per_unit: "", discount_percent: "0" }],
    });
    refreshInvoices();
  };

  const handleEditInvoice = async (invoiceId) => {
    const detail = await fetchInvoiceById(invoiceId);
    if (!detail) return;
    setEditingInvoice({
      invoice_id: detail.invoice_id,
      account_id: detail.account_id,
      sales_rep_id: detail.sales_rep_id,
      due_date: detail.due_date || "",
      tax_rate: detail.tax_rate || 0,
      discount_percent: detail.discount_percent || 0,
      services: detail.services || [],
    });
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;
    await updateInvoice(editingInvoice.invoice_id, {
      ...editingInvoice,
      account_id: Number(editingInvoice.account_id),
      sales_rep_id: Number(editingInvoice.sales_rep_id),
      tax_rate: Number(editingInvoice.tax_rate || 0),
      discount_percent: Number(editingInvoice.discount_percent || 0),
      services: (editingInvoice.services || []).map((s) => ({
        ...s,
        quantity: Number(s.quantity || 1),
        price_per_unit: Number(s.price_per_unit || 0),
        discount_percent: Number(s.discount_percent || 0),
      })),
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setEditingInvoice(null);
    refreshInvoices();
  };

  const handleDeleteInvoice = async (invoiceId) => {
    await deleteInvoice(invoiceId, user.user_id, user.email);
    refreshInvoices();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await createTask({
      user_id: user.user_id,
      assigned_to: newTask.assigned_to || user.user_id,
      task_description: newTask.task_description,
      due_date: newTask.due_date,
      account_id: newTask.account_id || null,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setNewTask({
      task_description: "",
      due_date: "",
      assigned_to: "",
      account_id: "",
    });
    refreshTasks();
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    await updateTask(editingTask.task_id, {
      ...editingTask,
      assigned_to: editingTask.assigned_to || editingTask.user_id,
      account_id: editingTask.account_id || null,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setEditingTask(null);
    refreshTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId, user.user_id, user.email);
    refreshTasks();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    await createCalendarEvent({
      ...newEvent,
      user_id: newEvent.user_id || user.user_id,
      account_id: newEvent.account_id || null,
      reminder_minutes: newEvent.reminder_minutes || null,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setNewEvent({
      event_title: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      reminder_minutes: "",
      account_id: "",
      user_id: "",
      contact_name: "",
      phone_number: "",
      notes: "",
    });
    refreshEvents();
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    await updateCalendarEvent(editingEvent.event_id, {
      ...editingEvent,
      account_id: editingEvent.account_id || null,
      user_id: editingEvent.user_id || user.user_id,
      reminder_minutes: editingEvent.reminder_minutes || null,
      actor_user_id: user.user_id,
      actor_email: user.email,
    });
    setEditingEvent(null);
    refreshEvents();
  };

  const handleDeleteEvent = async (eventId) => {
    await deleteCalendarEvent(eventId, user.user_id, user.email);
    refreshEvents();
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!newPayment.invoice_id) return;

    await logInvoicePayment(Number(newPayment.invoice_id), {
      invoice_id: Number(newPayment.invoice_id),
      account_id: Number(newPayment.account_id),
      sales_rep_id: Number(newPayment.sales_rep_id),
      logged_by: user.username,
      payment_method: Number(newPayment.payment_method),
      last_four_payment_method: newPayment.last_four_payment_method || null,
      total_paid: Number(newPayment.total_paid || 0),
      actor_user_id: user.user_id,
      actor_email: user.email,
    });

    setNewPayment({
      invoice_id: "",
      account_id: "",
      sales_rep_id: "",
      payment_method: "",
      last_four_payment_method: "",
      total_paid: "",
    });
    refreshPayments();
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    let datePaid = editingPayment.date_paid;
    if (datePaid && datePaid.length === 16) {
      datePaid = `${datePaid}:00`;
    }
    await updatePayment(
      editingPayment.payment_id,
      {
        payment_method: editingPayment.payment_method,
        last_four_payment_method: editingPayment.last_four_payment_method,
        total_paid: editingPayment.total_paid,
        date_paid: datePaid,
      },
      user.user_id,
      user.email
    );
    setEditingPayment(null);
    refreshPayments();
  };

  const handleDeletePayment = async (paymentId) => {
    await deletePayment(paymentId, user.user_id, user.email);
    refreshPayments();
  };

  const updateServiceRow = (index, field, value, source = "new") => {
    const updater = source === "new" ? setNewInvoice : setEditingInvoice;
    updater((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const services = [...next.services];
      services[index] = { ...services[index], [field]: value };
      next.services = services;
      return next;
    });
  };

  const addServiceRow = (source = "new") => {
    const updater = source === "new" ? setNewInvoice : setEditingInvoice;
    updater((prev) => ({
      ...prev,
      services: [...(prev.services || []), { service_id: "", quantity: 1, price_per_unit: "", discount_percent: "0" }],
    }));
  };

  const removeServiceRow = (index, source = "new") => {
    const updater = source === "new" ? setNewInvoice : setEditingInvoice;
    updater((prev) => {
      if (!prev) return prev;
      const services = [...prev.services];
      services.splice(index, 1);
      return { ...prev, services: services.length ? services : [{ service_id: "", quantity: 1, price_per_unit: "", discount_percent: "0" }] };
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Manage users, data, and audit history.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "rounded-md border border-border px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <p className="text-xs uppercase text-muted-foreground">Users</p>
            <p className="text-2xl font-semibold text-foreground">{users.length}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <p className="text-xs uppercase text-muted-foreground">Accounts</p>
            <p className="text-2xl font-semibold text-foreground">{accounts.length}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <p className="text-xs uppercase text-muted-foreground">Invoices</p>
            <p className="text-2xl font-semibold text-foreground">{invoices.length}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <p className="text-xs uppercase text-muted-foreground">Changes (7d)</p>
            <p className="text-2xl font-semibold text-foreground">{auditSummary?.total || 0}</p>
            <p className="text-xs text-muted-foreground">
              Last: {auditSummary?.latest_at
                ? formatDateTimeInTimeZone(auditSummary.latest_at, null, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateUser} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Onboard User</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Password (lowercase letters)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                pattern="[a-z]+"
                title="Lowercase letters only"
                required
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="First name"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Last name"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
              />
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newUser.role_id}
                onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                required
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newUser.department_id}
                onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newUser.branch_id}
                onChange={(e) => setNewUser({ ...newUser, branch_id: e.target.value })}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Create User
            </button>
          </form>

          {editingUser && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit User</h3>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  placeholder="Reset password (lowercase letters)"
                  value={editingUser.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingUser.role_id || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, role_id: e.target.value })}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingUser.department_id || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, department_id: e.target.value })}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingUser.branch_id || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, branch_id: e.target.value })}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdateUser}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Users</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Role
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{roles.find((r) => r.role_id === u.role_id)?.role_name || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() => setEditingUser({ ...u })}
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeleteUser(u.user_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "accounts" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateAccount} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Create Account</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Business name"
                value={newAccount.business_name}
                onChange={(e) => setNewAccount({ ...newAccount, business_name: e.target.value })}
                required
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Contact first name"
                value={newAccount.contact_first_name}
                onChange={(e) => setNewAccount({ ...newAccount, contact_first_name: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Contact last name"
                value={newAccount.contact_last_name}
                onChange={(e) => setNewAccount({ ...newAccount, contact_last_name: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Phone"
                value={newAccount.phone_number}
                onChange={(e) => setNewAccount({ ...newAccount, phone_number: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Address"
                value={newAccount.address}
                onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="City"
                value={newAccount.city}
                onChange={(e) => setNewAccount({ ...newAccount, city: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="State"
                value={newAccount.state}
                onChange={(e) => setNewAccount({ ...newAccount, state: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Zip"
                value={newAccount.zip_code}
                onChange={(e) => setNewAccount({ ...newAccount, zip_code: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Region"
                value={newAccount.region}
                onChange={(e) => setNewAccount({ ...newAccount, region: e.target.value })}
              />
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newAccount.industry_id}
                onChange={(e) => setNewAccount({ ...newAccount, industry_id: e.target.value })}
              >
                <option value="">Industry</option>
                {industries.map((industry) => (
                  <option key={industry.industry_id} value={industry.industry_id}>
                    {industry.industry_name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newAccount.user_id}
                onChange={(e) => setNewAccount({ ...newAccount, user_id: e.target.value })}
              >
                <option value="">Assign sales rep</option>
                {userOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newAccount.branch_id}
                onChange={(e) => setNewAccount({ ...newAccount, branch_id: e.target.value })}
              >
                <option value="">Branch</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Create Account
            </button>
          </form>

          {editingAccount && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit Account</h3>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingAccount(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingAccount.business_name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, business_name: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  placeholder="Contact first name"
                  value={editingAccount.contact_first_name || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, contact_first_name: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  placeholder="Contact last name"
                  value={editingAccount.contact_last_name || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, contact_last_name: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingAccount.email || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  placeholder="Region"
                  value={editingAccount.region || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, region: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingAccount.sales_rep_id || ""}
                  onChange={(e) => setEditingAccount({ ...editingAccount, sales_rep_id: e.target.value })}
                >
                  <option value="">Sales rep</option>
                  {userOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdateAccount}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Accounts</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sales Rep
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accounts.map((acc) => (
                    <tr key={acc.account_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">
                        <Link className="text-primary hover:underline" to={`/accounts/details/${acc.account_id}`}>
                          {acc.business_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{acc.contact_name || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {userOptions.find((u) => u.value === acc.sales_rep_id)?.label || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() => setEditingAccount({ ...acc })}
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeleteAccount(acc.account_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateInvoice} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Create Invoice</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newInvoice.account_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, account_id: e.target.value })}
                required
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newInvoice.sales_rep_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, sales_rep_id: e.target.value })}
                required
              >
                <option value="">Sales rep</option>
                {userOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                required
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Tax rate (0.05)"
                value={newInvoice.tax_rate}
                onChange={(e) => setNewInvoice({ ...newInvoice, tax_rate: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Discount percent (0.1)"
                value={newInvoice.discount_percent}
                onChange={(e) => setNewInvoice({ ...newInvoice, discount_percent: e.target.value })}
              />
            </div>

            <div className="mt-4 space-y-2">
              {newInvoice.services.map((serviceRow, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-5">
                  <select
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    value={serviceRow.service_id}
                    onChange={(e) => {
                      const selected = services.find((s) => s.service_id === Number(e.target.value));
                      updateServiceRow(index, "service_id", e.target.value, "new");
                      if (selected) {
                        updateServiceRow(index, "price_per_unit", selected.price_per_unit, "new");
                      }
                    }}
                  >
                    <option value="">Service</option>
                    {services.map((service) => (
                      <option key={service.service_id} value={service.service_id}>
                        {service.service_name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    placeholder="Qty"
                    value={serviceRow.quantity}
                    onChange={(e) => updateServiceRow(index, "quantity", e.target.value, "new")}
                  />
                  <input
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    placeholder="Price"
                    value={serviceRow.price_per_unit}
                    onChange={(e) => updateServiceRow(index, "price_per_unit", e.target.value, "new")}
                  />
                  <input
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    placeholder="Discount %"
                    value={serviceRow.discount_percent}
                    onChange={(e) => updateServiceRow(index, "discount_percent", e.target.value, "new")}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => removeServiceRow(index, "new")}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => addServiceRow("new")}
              >
                + Add service
              </button>
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Create Invoice
            </button>
          </form>

          {editingInvoice && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit Invoice #{editingInvoice.invoice_id}</h3>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingInvoice(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingInvoice.due_date || ""}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, due_date: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingInvoice.tax_rate || 0}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, tax_rate: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingInvoice.discount_percent || 0}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, discount_percent: e.target.value })}
                />
              </div>

              <div className="mt-4 space-y-2">
                {(editingInvoice.services || []).map((serviceRow, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-5">
                    <select
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                      value={serviceRow.service_id}
                      onChange={(e) => updateServiceRow(index, "service_id", e.target.value, "edit")}
                    >
                      <option value="">Service</option>
                      {services.map((service) => (
                        <option key={service.service_id} value={service.service_id}>
                          {service.service_name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                      value={serviceRow.quantity}
                      onChange={(e) => updateServiceRow(index, "quantity", e.target.value, "edit")}
                    />
                    <input
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                      value={serviceRow.price_per_unit}
                      onChange={(e) => updateServiceRow(index, "price_per_unit", e.target.value, "edit")}
                    />
                    <input
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                      value={serviceRow.discount_percent || 0}
                      onChange={(e) => updateServiceRow(index, "discount_percent", e.target.value, "edit")}
                    />
                    <button
                      type="button"
                      className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => removeServiceRow(index, "edit")}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => addServiceRow("edit")}
                >
                  + Add service
                </button>
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdateInvoice}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Invoices</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.invoice_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">
                        <Link to={`/invoice/${inv.invoice_id}`} className="text-primary hover:underline">
                          #{inv.invoice_id}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{inv.account_id}</td>
                      <td className="px-3 py-2 text-muted-foreground">{inv.status}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() => handleEditInvoice(inv.invoice_id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeleteInvoice(inv.invoice_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateTask} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Task description"
                value={newTask.task_description}
                onChange={(e) => setNewTask({ ...newTask, task_description: e.target.value })}
                required
              />
              <input
                type="date"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                required
              />
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
              >
                <option value="">Assign to</option>
                {userOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newTask.account_id}
                onChange={(e) => setNewTask({ ...newTask, account_id: e.target.value })}
              >
                <option value="">Account</option>
                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Create Task
            </button>
          </form>

          {editingTask && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit Task</h3>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingTask.task_description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, task_description: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingTask.due_date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingTask.assigned_to || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                >
                  <option value="">Assign to</option>
                  {userOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingTask.account_id || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, account_id: e.target.value })}
                >
                  <option value="">Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.business_name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingTask.is_completed ? "true" : "false"}
                  onChange={(e) => setEditingTask({ ...editingTask, is_completed: e.target.value === "true" })}
                >
                  <option value="false">Open</option>
                  <option value="true">Completed</option>
                </select>
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdateTask}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Task
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Due Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Assigned To
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => (
                    <tr key={task.task_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">{task.task_description}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {userOptions.find((u) => u.value === Number(task.assigned_to))?.label || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {accountMap.get(task.account_id) || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {task.is_completed ? "Completed" : "Open"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() =>
                            setEditingTask({
                              ...task,
                              due_date: task.due_date
                                ? new Date(task.due_date).toISOString().split("T")[0]
                                : "",
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeleteTask(task.task_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreateEvent} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Create Calendar Event</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Event title"
                value={newEvent.event_title}
                onChange={(e) => setNewEvent({ ...newEvent, event_title: e.target.value })}
                required
              />
              <input
                type="date"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                required
              />
              <input
                type="date"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.end_date}
                onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                required
              />
              <input
                type="time"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                required
              />
              <input
                type="time"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                required
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
              <input
                type="number"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Reminder minutes"
                value={newEvent.reminder_minutes}
                onChange={(e) => setNewEvent({ ...newEvent, reminder_minutes: e.target.value })}
              />
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.user_id}
                onChange={(e) => setNewEvent({ ...newEvent, user_id: e.target.value })}
              >
                <option value="">Assign to</option>
                {userOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newEvent.account_id}
                onChange={(e) => setNewEvent({ ...newEvent, account_id: e.target.value })}
              >
                <option value="">Account</option>
                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.business_name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Contact name"
                value={newEvent.contact_name}
                onChange={(e) => setNewEvent({ ...newEvent, contact_name: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Phone number"
                value={newEvent.phone_number}
                onChange={(e) => setNewEvent({ ...newEvent, phone_number: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground md:col-span-3"
                placeholder="Notes"
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              />
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Create Event
            </button>
          </form>

          {editingEvent && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit Event</h3>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.event_title || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, event_title: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.start_date || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.end_date || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                />
                <input
                  type="time"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.start_time || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                />
                <input
                  type="time"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.end_time || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.location || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
                <input
                  type="number"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.reminder_minutes || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, reminder_minutes: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.user_id || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, user_id: e.target.value })}
                >
                  <option value="">Assign to</option>
                  {userOptions.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.account_id || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, account_id: e.target.value })}
                >
                  <option value="">Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.business_name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.contact_name || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, contact_name: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingEvent.phone_number || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, phone_number: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground md:col-span-3"
                  value={editingEvent.notes || ""}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                />
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdateEvent}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Calendar Events</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Event
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Assigned To
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {calendarEvents.map((event) => (
                    <tr key={event.event_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">{event.event_title}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {event.start_date ? format(new Date(event.start_date), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {event.start_time ? event.start_time : "—"} {event.end_time ? `– ${event.end_time}` : ""}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {userOptions.find((u) => u.value === Number(event.user_id))?.label || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {accountMap.get(event.account_id) || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() =>
                            setEditingEvent({
                              ...event,
                              start_time: event.start_time ? event.start_time.slice(0, 5) : "",
                              end_time: event.end_time ? event.end_time.slice(0, 5) : "",
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeleteEvent(event.event_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="mt-6 space-y-6">
          <form onSubmit={handleCreatePayment} className="rounded-md border border-border bg-card p-4 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Log Payment</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newPayment.invoice_id}
                onChange={(e) => {
                  const invoiceId = e.target.value;
                  const invoice = invoiceMap.get(Number(invoiceId));
                  setNewPayment((prev) => ({
                    ...prev,
                    invoice_id: invoiceId,
                    account_id: invoice ? invoice.account_id : "",
                    sales_rep_id: invoice ? invoice.sales_rep_id : "",
                  }));
                }}
                required
              >
                <option value="">Select invoice</option>
                {invoices.map((inv) => (
                  <option key={inv.invoice_id} value={inv.invoice_id}>
                    #{inv.invoice_id} • {accountMap.get(inv.account_id) || "Account"}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={newPayment.payment_method}
                onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                required
              >
                <option value="">Payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.method_id} value={method.method_id}>
                    {method.method_name}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Last four (optional)"
                value={newPayment.last_four_payment_method}
                onChange={(e) => setNewPayment({ ...newPayment, last_four_payment_method: e.target.value })}
                maxLength={4}
              />
              <input
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                placeholder="Amount"
                value={newPayment.total_paid}
                onChange={(e) => setNewPayment({ ...newPayment, total_paid: e.target.value })}
                required
              />
              <div className="text-xs text-muted-foreground md:col-span-3">
                Account: {accountMap.get(Number(newPayment.account_id)) || "—"} • Sales Rep:{" "}
                {userOptions.find((u) => u.value === Number(newPayment.sales_rep_id))?.label || "—"}
              </div>
            </div>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Log Payment
            </button>
          </form>

          {editingPayment && (
            <div className="rounded-md border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Edit Payment</h3>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingPayment(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <select
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingPayment.payment_method || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, payment_method: e.target.value })}
                >
                  <option value="">Payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.method_id} value={method.method_id}>
                      {method.method_name}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingPayment.last_four_payment_method || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, last_four_payment_method: e.target.value })}
                />
                <input
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingPayment.total_paid || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, total_paid: e.target.value })}
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={editingPayment.date_paid || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, date_paid: e.target.value })}
                />
              </div>
              <button
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={handleUpdatePayment}
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="rounded-md border border-border bg-card p-4 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Payments</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Method
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">
                        <Link to={`/invoice/${payment.invoice_id}`} className="text-primary hover:underline">
                          #{payment.invoice_id}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {payment.account_name || accountMap.get(payment.account_id) || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {payment.payment_method_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        ${Number(payment.total_paid || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {payment.date_paid ? format(new Date(payment.date_paid), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="mr-2 text-sm text-primary hover:underline"
                          onClick={() =>
                            setEditingPayment({
                              ...payment,
                              date_paid: payment.date_paid
                                ? new Date(payment.date_paid).toISOString().slice(0, 16)
                                : "",
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-destructive hover:underline"
                          onClick={() => handleDeletePayment(payment.payment_id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "account",
              "invoice",
              "task",
              "calendar_event",
              "payment",
              "user",
            ].map((tab) => (
              <button
                key={tab}
                className={cn(
                  "rounded-md border border-border px-3 py-1.5 text-sm font-medium transition",
                  auditTab === tab ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                )}
                onClick={() => setAuditTab(tab)}
              >
                {tab === "all" ? "All Activity" : tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {auditTab === "all" ? (
            <AuditSection title="All Activity" filters={{}} limit={200} />
          ) : (
            <AuditSection title={`${auditTab.replace("_", " ")} activity`} filters={{ entity_type: auditTab }} limit={200} />
          )}
        </div>
      )}
    </div>
  );
};

AdminPage.propTypes = {
  user: PropTypes.shape({
    user_id: PropTypes.number.isRequired,
    email: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
};

export default AdminPage;
