import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails, fetchAccountPurchaseHistory } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount } from "../services/notesService";
import { fetchTasksByAccount, createTask } from "../services/tasksService";
import { fetchUsers } from "../services/userService";
import { fetchRoleById } from "../services/userRoleService";
import { formatDateInTimeZone } from "../utils/timezone";
import PropTypes from "prop-types";

import InvoicesSection from "../components/InvoicesSection";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";
import AuditSection from "../components/AuditSection";

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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return formatDateInTimeZone(dateString, user, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
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
    
    const refreshTasks = async () => {
        const updatedTasks = await fetchTasksByAccount(accountId);
        console.log(" 🔄 Refreshed tasks:", updatedTasks); //debugging
        setTasks(updatedTasks);
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
    }, [accountId, refreshNotes, refreshInvoices]);

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
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="w-1/2">
                    <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-300 text-left">{account.business_name}</h1>
                    <p className="text-muted-foreground text-left">
                        <strong>Created:</strong> {formatDate(account.date_created)} <strong>| Updated: </strong>{formatDate(account.date_updated)}
                    </p>
                    <p className="text-foreground text-left"><strong>Contact:</strong> {account.contact_name}</p>
                    <p className="text-foreground text-left"><strong>Phone:</strong> {account.phone_number}</p>
                    <p className="text-foreground text-left"><strong>Email:</strong> {account.email}</p>
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
                    <p><strong>Email: </strong>{account.sales_rep?.email || "N/A"}</p>
                </div>
            </div>

            {/* Sections */}
            <InvoicesSection 
            invoices={invoices || []} 
            onCreateInvoice={() => navigate(`/create-invoice/${account.account_id}`)}
            refreshInvoices={refreshInvoices}
            />

            <div className="mt-6 border border-border p-4 rounded-lg bg-card">
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


            <NotesSection 
                notes={notes}
                accountId={account?.account_id || 0}
                userId={user?.user_id ?? user?.id ?? 0}
                setNotes={setNotes}
                refreshNotes={refreshNotes}
                invoiceId={invoices.length > 0 ? invoices[0].invoice_id : null}
            />
            
            <TasksSection
                tasks={tasks}
                users={users}  
                userId={user?.user_id ?? user?.id ?? 0}  
                accountId={account?.account_id || 0}  
                setTasks={setTasks}
                refreshTasks={refreshTasks}
            />

            <AuditSection
                title="Account Audit Trail"
                filters={{ account_id: account.account_id }}
                limit={100}
            />
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
