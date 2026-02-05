import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchAccountDetails, fetchAccountPurchaseHistory } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount, createNote } from "../services/notesService";
import { fetchTasksByAccount, createTask } from "../services/tasksService";
import { fetchUsers } from "../services/userService";
import { fetchRoleById } from "../services/userRoleService";
import { fetchContacts, createContactInteraction, setPrimaryContact } from "../services/contactService";
import { formatDateInTimeZone } from "../utils/timezone";
import PropTypes from "prop-types";

import InvoicesSection from "../components/InvoicesSection";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";
import AuditSection from "../components/AuditSection";
import ContactDetailsPage from "./ContactDetailsPage";

const AccountDetailsPage = ({ user }) => {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [userRole, setUserRole] = useState("");
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [purchaseSort, setPurchaseSort] = useState({ key: "quantity", order: "desc" });
    const [activeTab, setActiveTab] = useState("audit");
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [contactModal, setContactModal] = useState(null);
    const [interactionModal, setInteractionModal] = useState(null);
    const [interactionForm, setInteractionForm] = useState({
        interaction_type: "call",
        subject: "",
        notes: "",
    });
    const [interactionSaving, setInteractionSaving] = useState(false);
    const [contactsToast, setContactsToast] = useState("");
    const currentUserId = user?.user_id ?? user?.id ?? null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return formatDateInTimeZone(dateString, user, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
    };

    const formatPhone = (value) => {
        if (!value) return "—";
        const digits = String(value).replace(/\D/g, "");
        if (digits.length === 11 && digits.startsWith("1")) {
            return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        if (digits.length === 10) {
            return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        return value;
    };

    const refreshInvoices = useCallback(async (status = null) => {
        const fetched = await fetchInvoiceByAccount(accountId, status);
        setInvoices(fetched);
    }, [accountId]);

    const refreshPurchaseHistory = useCallback(async (sortKey = "quantity", order = "desc") => {
        const data = await fetchAccountPurchaseHistory(accountId, {
            sort: sortKey === "quantity" ? "quantity" : sortKey,
            order,
        });
        setPurchaseHistory(Array.isArray(data) ? data : []);
    }, [accountId]);

    const refreshNotes = useCallback(async () => {
        const updatedNotes = await fetchNotesByAccount(accountId);
        console.log("🔄 Updated Notes from Backend:", updatedNotes); //debugging
        setNotes(updatedNotes);
    }, [accountId]);

    const refreshContacts = useCallback(async () => {
        setContactsLoading(true);
        const data = await fetchContacts({ account_id: accountId });
        setContacts(data || []);
        setContactsLoading(false);
    }, [accountId]);
    
    const refreshTasks = async () => {
        const updatedTasks = await fetchTasksByAccount(accountId);
        console.log(" 🔄 Refreshed tasks:", updatedTasks); //debugging
        setTasks(updatedTasks);
    };

    const handleSetPrimaryContact = async (contactId) => {
        if (!account?.account_id || !currentUserId) return;
        const result = await setPrimaryContact(contactId, account.account_id, currentUserId, user?.email);
        if (result) {
            const updatedAccount = await fetchAccountDetails(accountId);
            setAccount(updatedAccount);
            await refreshContacts();
            setContactsToast("Default contact updated.");
            setTimeout(() => setContactsToast(""), 3000);
        }
    };

    const handleOpenInteraction = (contact) => {
        setInteractionModal(contact);
        setInteractionForm({
            interaction_type: "call",
            subject: "",
            notes: "",
        });
    };

    const handleSaveInteraction = async () => {
        if (!interactionModal || !currentUserId) return;
        if (!interactionForm.subject && !interactionForm.notes) return;
        setInteractionSaving(true);
        const payload = {
            interaction_type: interactionForm.interaction_type,
            subject: interactionForm.subject,
            notes: interactionForm.notes,
            account_id: Number(accountId),
            actor_user_id: currentUserId,
            actor_email: user?.email,
        };
        const created = await createContactInteraction(interactionModal.contact_id, payload);
        if (created) {
            const contactName = `${interactionModal.first_name || ""} ${interactionModal.last_name || ""}`.trim() || "Contact";
            const noteTextParts = [
                `Interaction with ${contactName}`,
                interactionForm.subject ? `Subject: ${interactionForm.subject}` : null,
                interactionForm.notes ? `Notes: ${interactionForm.notes}` : null,
            ].filter(Boolean);
            await createNote({
                account_id: Number(accountId),
                user_id: currentUserId,
                note_text: noteTextParts.join(" • "),
            });
            await refreshNotes();
            setContactsToast("Interaction logged.");
            setTimeout(() => setContactsToast(""), 3000);
        }
        setInteractionSaving(false);
        setInteractionModal(null);
    };
    // Fetch Users
    useEffect(() => {
        async function loadUsers() {
            try {
            const fetchedUsers = await fetchUsers();
            console.log("Fetched users in AccountDetailsPage:", fetchedUsers); //debugging 
            if (fetchedUsers && fetchedUsers.length > 0) {
                const normalizedUsers = fetchedUsers.map((user) => ({
                    ...user,
                    // If username is missing, derive it from the email. Temporary.
                    username: user.username || (user.email ? user.email.split("@")[0] : "unknown")
                }));
                setUsers(normalizedUsers);
            }
            } catch (error) {
                console.error("❌ Error fetching users:", error);
            }
        }
        
            loadUsers();
        }, []);
        
    
    useEffect(() => {
        async function loadUserRole() {
            if (user.role_id) {
                const roleData = await fetchRoleById(user.role_id);
                setUserRole(roleData?.role_name || "Unknown Role");
            }
        }
        loadUserRole();
    }, [user.role_id]);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setAccount(await fetchAccountDetails(accountId));
                await refreshInvoices();
                await refreshNotes();
                await refreshContacts();
                
                setTasks(await fetchTasksByAccount(accountId)); 
                        
            } catch (error) {
                console.error("❌ Error loading account details:", error);
                console.error("🔍 Full Error Object:", error?.response || error);
            } finally {
                setLoading(false);
            }
        }
    
        if (accountId) {
            loadData();
        }
    }, [accountId, refreshNotes, refreshInvoices, refreshContacts]);

    useEffect(() => {
        if (!accountId) return;
        refreshPurchaseHistory(purchaseSort.key, purchaseSort.order);
    }, [accountId, purchaseSort.key, purchaseSort.order, refreshPurchaseHistory]);

    const formatCurrency = (value) => {
        const amount = Number(value || 0);
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const handlePurchaseSort = (key) => {
        setPurchaseSort((prev) => {
            if (prev.key === key) {
                return { key, order: prev.order === "desc" ? "asc" : "desc" };
            }
            return { key, order: "desc" };
        });
    };
// debugging useEffect to verify whenever the users prop updates debugging
    useEffect(() => {
        console.log("TasksSection: users prop updated:", users);
    }, [users]);



    if (loading) return <p className="text-muted-foreground text-center">Loading account details...</p>;
    if (!account) return <p className="text-red-600 text-center">Account not found.</p>;

    const mostPurchased = purchaseHistory[0];
    const leastPurchased = purchaseHistory[purchaseHistory.length - 1];
    const lastPurchaseDate = purchaseHistory.reduce((latest, item) => {
        if (!item.last_purchase) return latest;
        if (!latest) return item.last_purchase;
        return new Date(item.last_purchase) > new Date(latest) ? item.last_purchase : latest;
    }, null);

    return (
        <div className="p-6 max-w-6xl mx-auto bg-card border border-border shadow-lg rounded-lg">
            {contactsToast && (
                <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    {contactsToast}
                </div>
            )}
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="w-1/2">
                    <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 text-left">{account.business_name}</h1>
                    <p className="text-muted-foreground text-left">
                        <strong>Created:</strong> {formatDate(account.date_created)} <strong>| Updated: </strong>{formatDate(account.date_updated)}
                    </p>
                    <p className="text-foreground text-left">
                        <strong>Contact:</strong>{" "}
                        {account.primary_contact_id ? (
                            <Link
                                className="font-semibold underline text-primary hover:text-primary/80"
                                to={`/contacts/${account.primary_contact_id}`}
                            >
                                {account.primary_contact_name || account.contact_name || "View Contact"}
                            </Link>
                        ) : (
                            <span className="font-semibold text-foreground">
                                {account.contact_name || "N/A"}
                            </span>
                        )}
                    </p>
                    <p className="text-foreground text-left"><strong>Phone:</strong> {account.phone_number}</p>
                    <p className="text-foreground text-left">
                        <strong>Email:</strong>{" "}
                        {account.email ? (
                            <a
                                className="text-primary hover:underline"
                                href={`mailto:${account.email}?subject=${encodeURIComponent(account.business_name || "Account")}`}
                            >
                                {account.email}
                            </a>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </p>
                    <p className="text-foreground text-left"><strong>Address:</strong> {account.address}</p>
                    <p className="text-foreground text-left">{account.city}, {account.state} {account.zip_code}</p>
                    <p className="text-foreground text-left"><strong>Industry:</strong> {account.industry || "N/A"}</p>
                    <p className="text-foreground text-left"><strong>Region:</strong> {account.region_name || account.region || "N/A"}</p>
                </div>
                <div className="w-1/2 text-right text-foreground">
                    <p className="text-lg font-semibold">Account Number: {account.account_id}</p>
                    {/* Update Account Button - `user` is passed via state */}
                    <button
                        className="bg-secondary text-secondary-foreground px-3 py-2 rounded my-2 border border-border hover:bg-secondary/80"
                        onClick={() => navigate(`/accounts/update/${account.account_id}`, { state: { user } })}
                    >
                        Update Account
                    </button>

                    <p><strong>Sales Rep:</strong> {account.sales_rep?.first_name} {account.sales_rep?.last_name || "N/A"}</p>
                    <p><strong>Branch:</strong> {account.branch?.branch_name || "N/A"}</p>
                    <p>{account.branch?.address}</p>
                    <p>{account.branch?.city}, {account.branch?.state} {account.branch?.zip_code}</p>
                    <p><strong>Phone Number: </strong>{account.branch?.phone_number} <strong>| Ext: </strong>{account.sales_rep?.extension || "N/A"}</p>
                    <p>
                        <strong>Email: </strong>
                        {account.sales_rep?.email ? (
                            <a
                                className="text-primary hover:underline"
                                href={`mailto:${account.sales_rep.email}?subject=${encodeURIComponent(account.business_name || "Account")}`}
                            >
                                {account.sales_rep.email}
                            </a>
                        ) : (
                            "N/A"
                        )}
                    </p>
                </div>
            </div>

            {/* Sections */}
            <InvoicesSection 
            invoices={invoices || []} 
            onCreateInvoice={() => navigate(`/create-invoice/${account.account_id}`)}
            refreshInvoices={refreshInvoices}
            />

            <div className="mt-6 rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Account Activity</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <button
                        className={`rounded-full px-3 py-1 ${
                            activeTab === "audit" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setActiveTab("audit")}
                    >
                        Audit
                    </button>
                    <button
                        className={`rounded-full px-3 py-1 ${
                            activeTab === "notes" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setActiveTab("notes")}
                    >
                        Notes
                    </button>
                    <button
                        className={`rounded-full px-3 py-1 ${
                            activeTab === "tasks" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setActiveTab("tasks")}
                    >
                        Tasks
                    </button>
                    <button
                        className={`rounded-full px-3 py-1 ${
                            activeTab === "contacts" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setActiveTab("contacts")}
                    >
                        Contacts
                    </button>
                    <button
                        className={`rounded-full px-3 py-1 ${
                            activeTab === "purchase" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() => setActiveTab("purchase")}
                    >
                        Purchase History
                    </button>
                </div>

                <div className="mt-4">
                    {activeTab === "audit" && (
                        <AuditSection
                            title="Account Audit Trail"
                            filters={{ account_id: account.account_id }}
                            limit={100}
                        />
                    )}

                    {activeTab === "notes" && (
                        <NotesSection 
                            notes={notes}
                            accountId={account?.account_id || 0}
                            userId={user?.user_id ?? user?.id ?? 0}
                            setNotes={setNotes}
                            refreshNotes={refreshNotes}
                            invoiceId={invoices.length > 0 ? invoices[0].invoice_id : null}
                        />
                    )}

                    {activeTab === "tasks" && (
                        <TasksSection
                            tasks={tasks}
                            users={users}  
                            userId={user?.user_id ?? user?.id ?? 0}  
                            userEmail={user?.email}
                            accountId={account?.account_id || 0}  
                            setTasks={setTasks}
                            refreshTasks={refreshTasks}
                        />
                    )}

                    {activeTab === "contacts" && (
                        <div className="border border-border p-4 rounded-lg bg-card">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
                                <span className="text-xs text-muted-foreground">
                                    {contacts.length} total
                                </span>
                            </div>
                            {contactsLoading ? (
                                <p className="mt-3 text-sm text-muted-foreground">Loading contacts...</p>
                            ) : contacts.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">No contacts linked to this account.</p>
                            ) : (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Name</th>
                                                <th className="px-3 py-2 text-left">Role</th>
                                                <th className="px-3 py-2 text-left">Email</th>
                                                <th className="px-3 py-2 text-left">Phone</th>
                                                <th className="px-3 py-2 text-left">Owner</th>
                                                <th className="px-3 py-2 text-left">Default</th>
                                                <th className="px-3 py-2 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {contacts.map((contact) => {
                                                const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
                                                const isPrimary = contact.contact_id === account.primary_contact_id;
                                                return (
                                                    <tr
                                                        key={contact.contact_id}
                                                        className="hover:bg-muted/40 cursor-pointer"
                                                        onClick={() => setContactModal(contact)}
                                                    >
                                                        <td className="px-3 py-2 text-foreground font-semibold">
                                                            {name || `Contact #${contact.contact_id}`}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {contact.title || "—"}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {contact.email ? (
                                                                <a
                                                                    className="text-primary hover:underline"
                                                                    href={`mailto:${contact.email}?subject=${encodeURIComponent(account.business_name || "Account")}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {contact.email}
                                                                </a>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {formatPhone(contact.phone)}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {contact.contact_owner_name || "—"}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {isPrimary ? (
                                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                                                    Default
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSetPrimaryContact(contact.contact_id);
                                                                    }}
                                                                >
                                                                    Set Default
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenInteraction(contact);
                                                                    }}
                                                                >
                                                                    Log Interaction
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "purchase" && (
                        <div className="border border-border p-4 rounded-lg bg-card">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Purchase History</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {mostPurchased ? `Most purchased: ${mostPurchased.service_name} (${mostPurchased.total_quantity})` : "No purchases yet."}
                                        {leastPurchased && purchaseHistory.length > 1 ? ` • Least purchased: ${leastPurchased.service_name} (${leastPurchased.total_quantity})` : ""}
                                        {lastPurchaseDate ? ` • Last purchase: ${formatDate(lastPurchaseDate)}` : ""}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <button
                                        className={`rounded-full px-3 py-1 font-semibold ${
                                            purchaseSort.key === "quantity" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                        }`}
                                        onClick={() => handlePurchaseSort("quantity")}
                                    >
                                        Quantity
                                    </button>
                                    <button
                                        className={`rounded-full px-3 py-1 font-semibold ${
                                            purchaseSort.key === "total_spent" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                        }`}
                                        onClick={() => handlePurchaseSort("total_spent")}
                                    >
                                        Spend
                                    </button>
                                    <button
                                        className={`rounded-full px-3 py-1 font-semibold ${
                                            purchaseSort.key === "last_purchase" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                        }`}
                                        onClick={() => handlePurchaseSort("last_purchase")}
                                    >
                                        Last Purchase
                                    </button>
                                    <button
                                        className="rounded-full px-3 py-1 font-semibold bg-muted text-muted-foreground"
                                        onClick={() => setPurchaseSort((prev) => ({ ...prev, order: prev.order === "desc" ? "asc" : "desc" }))}
                                    >
                                        {purchaseSort.order === "desc" ? "Desc" : "Asc"}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                {purchaseHistory.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No purchase history available.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Item</th>
                                                <th className="px-3 py-2 text-left">Total Quantity</th>
                                                <th className="px-3 py-2 text-left">Total Spend</th>
                                                <th className="px-3 py-2 text-left">Last Purchased</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {purchaseHistory.map((item) => (
                                                <tr key={item.service_id} className="hover:bg-muted/40">
                                                    <td className="px-3 py-2 text-foreground">{item.service_name}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">{item.total_quantity}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">{formatCurrency(item.total_spent)}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">
                                                        {item.last_purchase ? formatDate(item.last_purchase) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {contactModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setContactModal(null)}
                >
                    <div
                        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ContactDetailsPage
                            user={user}
                            embedded
                            contactIdOverride={contactModal.contact_id}
                            onClose={() => setContactModal(null)}
                        />
                    </div>
                </div>
            )}

            {interactionModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setInteractionModal(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Log Interaction</h2>
                            <button
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => setInteractionModal(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            <select
                                className="w-full rounded border border-border bg-card p-2 text-sm text-foreground"
                                value={interactionForm.interaction_type}
                                onChange={(e) => setInteractionForm((prev) => ({ ...prev, interaction_type: e.target.value }))}
                            >
                                <option value="call">Phone Call</option>
                                <option value="email">Email</option>
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
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                                onClick={() => setInteractionModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                                onClick={handleSaveInteraction}
                                disabled={interactionSaving}
                            >
                                {interactionSaving ? "Saving..." : "Save Interaction"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// PropTypes Validation
AccountDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        username: PropTypes.string,
        email: PropTypes.string,
        role_id: PropTypes.number.isRequired,
    }).isRequired,

    account: PropTypes.shape({
        account_id: PropTypes.number.isRequired,
        business_name: PropTypes.string.isRequired,
        contact_name: PropTypes.string,
        primary_contact_id: PropTypes.number,
        primary_contact_name: PropTypes.string,
        phone_number: PropTypes.string,
        email: PropTypes.string,
        address: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        zip_code: PropTypes.string,
        industry: PropTypes.string,
        region_id: PropTypes.number,
        region_name: PropTypes.string,
        date_created: PropTypes.string,
        date_updated: PropTypes.string,
        
        // Assigned Sales Representative (Sales Rep Info)
        sales_rep: PropTypes.shape({
            user_id: PropTypes.number.isRequired,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            username: PropTypes.string,
            email: PropTypes.string,
            phone_number: PropTypes.string,
            extension: PropTypes.string,
        }),

        // Branch Details for Sales Rep
        branch: PropTypes.shape({
            branch_id: PropTypes.number,
            branch_name: PropTypes.string,
            address: PropTypes.string,
            city: PropTypes.string,
            state: PropTypes.string,
            zip_code: PropTypes.string,
            phone_number: PropTypes.string,
        }),
    }),

    invoices: PropTypes.arrayOf(
        PropTypes.shape({
            invoice_id: PropTypes.number.isRequired,
            date_created: PropTypes.string,
            date_updated: PropTypes.string,
            due_date: PropTypes.string,
            final_total: PropTypes.number,
            status: PropTypes.string.isRequired,
        })
    ),

    notes: PropTypes.arrayOf(
        PropTypes.shape({
            note_id: PropTypes.number.isRequired,
            user_id: PropTypes.number,
            username: PropTypes.string,
            date_created: PropTypes.string.isRequired,
            note_text: PropTypes.string.isRequired,
            invoice_id: PropTypes.number,
        })
    ),

    tasks: PropTypes.arrayOf(
        PropTypes.shape({
            task_id: PropTypes.number.isRequired,
            created_by: PropTypes.number,
            assigned_to: PropTypes.number,
            task_description: PropTypes.string.isRequired,
            due_date: PropTypes.string,
            completed: PropTypes.bool,
        })
    ),
};

export default AccountDetailsPage;
