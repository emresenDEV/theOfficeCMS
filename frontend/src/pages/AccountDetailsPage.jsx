import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount } from "../services/notesService";
import { fetchTasksByAccount, createTask } from "../services/tasksService";
import { fetchUsers } from "../services/userService";
import { fetchRoleById } from "../services/userRoleService";
import { format } from "date-fns";
import PropTypes from "prop-types";

import InvoicesSection from "../components/InvoicesSection";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";

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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "MM/dd/yyyy");
    };

    const refreshInvoices = useCallback(async (status = null) => {
        const fetched = await fetchInvoiceByAccount(accountId, status);
        setInvoices(fetched);
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
// debugging useEffect to verify whenever the users prop updates debugging
    useEffect(() => {
        console.log("TasksSection: users prop updated:", users);
    }, [users]);



    if (loading) return <p className="text-gray-600 text-center">Loading account details...</p>;
    if (!account) return <p className="text-red-600 text-center">Account not found.</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg ml-64">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="w-1/2">
                    <h1 className="text-3xl font-bold text-blue-700 text-left">{account.business_name}</h1>
                    <p className="text-gray-500 text-left">
                        <strong>Created:</strong> {formatDate(account.date_created)} <strong>| Updated: </strong>{formatDate(account.date_updated)}
                    </p>
                    <p className="text-gray-700 text-left"><strong>Contact:</strong> {account.contact_name}</p>
                    <p className="text-gray-700 text-left"><strong>Phone:</strong> {account.phone_number}</p>
                    <p className="text-gray-700 text-left"><strong>Email:</strong> {account.email}</p>
                    <p className="text-gray-700 text-left"><strong>Address:</strong> {account.address}</p>
                    <p className="text-gray-700 text-left">{account.city}, {account.state} {account.zip_code}</p>
                    <p className="text-gray-700 text-left"><strong>Industry:</strong> {account.industry || "N/A"}</p>
                </div>
                <div className="w-1/2 text-right">
                    <p className="text-lg font-semibold">Account Number: {account.account_id}</p>
                    {/* Update Account Button - `user` is passed via state */}
                    <button
                        className="bg-yellow-500 text-white px-3 py-2 rounded my-2"
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


            <NotesSection 
                notes={notes}
                accountId={account?.account_id || 0}
                userId={user?.id || 0}
                setNotes={setNotes}
                refreshNotes={refreshNotes}
                invoiceId={invoices.length > 0 ? invoices[0].invoice_id : null}
            />
            
            <TasksSection
                tasks={tasks}
                users={users}  
                userId={user?.id || 0}  
                accountId={account?.account_id || 0}  
                setTasks={setTasks}
                refreshTasks={refreshTasks}
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
