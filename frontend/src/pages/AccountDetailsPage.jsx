import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccountDetails } from "../services/accountService";
import { fetchInvoiceByAccount } from "../services/invoiceService";
import { fetchNotesByAccount } from "../services/notesService";
import { fetchTasksByAccount } from "../services/tasksService";
import PropTypes from "prop-types";

import InvoicesSection from "../components/InvoicesSection";
import NotesSection from "../components/NotesSection";
import TasksSection from "../components/TasksSection";
import CreateNote from "../components/CreateNote";
import CreateTask from "../components/CreateTask";

const AccountDetailsPage = () => {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setAccount(await fetchAccountDetails(accountId));
                setInvoices(await fetchInvoiceByAccount(accountId));
                setNotes(await fetchNotesByAccount(accountId));
                setTasks(await fetchTasksByAccount(accountId));
            } catch (error) {
                console.error("❌ Error loading account details:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [accountId]);

    if (loading) return <p className="text-gray-600 text-center">Loading account details...</p>;
    if (!account) return <p className="text-red-600 text-center">Account not found.</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg ml-64">
            {/* ✅ Header Section */}
            <div className="flex justify-between items-start">
                <div className="w-1/2">
                    <h1 className="text-3xl font-bold text-blue-700">{account.business_name}</h1>
                    <p className="text-gray-500">Created: {account.date_created} | Updated: {account.date_updated}</p>
                    <p className="text-gray-700"><strong>Contact:</strong> {account.contact_name}</p>
                    <p className="text-gray-700"><strong>Phone:</strong> {account.phone_number}</p>
                    <p className="text-gray-700"><strong>Email:</strong> {account.email}</p>
                    <p className="text-gray-700"><strong>Address:</strong> {account.address}</p>
                    <p className="text-gray-700">{account.city}, {account.state} {account.zip_code}</p>
                    <p className="text-gray-700"><strong>Industry:</strong> {account.industry || "N/A"}</p>
                    <p className="text-gray-700"><strong>Notes:</strong> {account.notes || "N/A"}</p>
                </div>
                <div className="w-1/2 text-right">
                    <p className="text-lg font-semibold">Account Number: {account.account_id}</p>
                    {/* Update Account Button */}
                    <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded my-2"
                        onClick={() => navigate(`/accounts/update/${account.account_id}`)}
                    >
                        Update Account
                    </button>
                    <p><strong>Sales Rep:</strong> {account.sales_rep?.first_name} {account.sales_rep?.last_name || "N/A"}</p>
                    <p><strong>Branch:</strong> {account.branch?.branch_name || "N/A"}</p>
                    <p>{account.branch?.address}</p>
                    <p>{account.branch?.city}, {account.branch?.state} {account.branch?.zip_code}</p>
                    <p>Phone Number: {account.branch?.phone_number} | Ext: {account.sales_rep?.extension || "N/A"}</p>
                    <p>Email: {account.sales_rep?.email}</p>
                </div>
            </div>

            {/* ✅ Sections */}
            <InvoicesSection invoices={invoices} onCreateInvoice={() => navigate("/create-invoice")} />
            <NotesSection notes={notes} onCreateNote={() => navigate("/create-note")} />
            <TasksSection tasks={tasks} onCreateTask={() => navigate("/create-task")} />

            {/* ✅ Create New Note and Task Forms */}
            <div className="mt-6">
                <h2 className="text-xl font-semibold">Create a New Note</h2>
                <CreateNote accountId={account.account_id} />
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold">Create a New Task</h2>
                <CreateTask accountId={account.account_id} />
            </div>
        </div>
    );
};

// ✅ PropTypes Validation
AccountDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
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
        
        // ✅ Assigned Sales Representative (Sales Rep Info)
        sales_rep: PropTypes.shape({
            user_id: PropTypes.number.isRequired,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            phone_number: PropTypes.string,
            extension: PropTypes.string,
        }),

        // ✅ Branch Details for Sales Rep
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
