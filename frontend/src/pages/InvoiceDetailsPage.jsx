import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    fetchInvoiceById,
    updateInvoice,
    deleteInvoice,
    fetchPaymentMethods,
    logInvoicePayment,
    deleteInvoiceService
} from "../services/invoiceService";
import {
fetchServices,
createService,
updateService,
} from "../services/servicesService";
import { fetchNotesByInvoice } from "../services/notesService";
import { fetchSalesReps, fetchUsers } from "../services/userService";
import { updatePayment, deletePayment } from "../services/paymentService";
import { createTask, fetchTasksByInvoice, updateTask } from "../services/tasksService";
// import Sidebar from "../components/Sidebar";
import NotesSection from "../components/NotesSection";
import AuditSection from "../components/AuditSection";
import InvoiceActions from "../components/InvoiceActions";
import PaidBox from "../components/PaidBox";
import { fetchAccountDetails } from "../services/accountService";
import { formatDateInTimeZone } from "../utils/timezone";
import PipelineStatusBar from "../components/PipelineStatusBar";
import { fetchPipelineDetail, updatePipelineStage } from "../services/pipelineService";
import { PIPELINE_STAGES, PIPELINE_STAGE_MAP } from "../utils/pipelineStages";
import PropTypes from "prop-types";

const PIPELINE_STAGE_FIELDS = {
    contact_customer: "contacted_at",
    order_placed: "order_placed_at",
    payment_not_received: "payment_not_received_at",
    payment_received: "payment_received_at",
    order_packaged: "order_packaged_at",
    order_shipped: "order_shipped_at",
    order_delivered: "order_delivered_at",
};

const InvoiceDetailsPage = ({ user }) => {
const { invoiceId } = useParams();
const navigate = useNavigate();
const location = useLocation();
const [salesReps, setSalesReps] = useState([]);
const [invoice, setInvoice] = useState(null);
const [notes, setNotes] = useState([]);
const [paymentMethods, setPaymentMethods] = useState([]);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentForm, setPaymentForm] = useState({
    payment_method: "",
    last_four_payment_method: "",
    total_paid: "",
});
const [loggedPayment, setLoggedPayment] = useState(null);
const [payments, setPayments] = useState([]);
const [services, setServices] = useState([]);
const [allServiceOptions, setAllServiceOptions] = useState([]);
const [addingService, setAddingService] = useState(false);
const [newServiceRow, setNewServiceRow] = useState({
    service_name: "",
    price_per_unit: "",
    quantity: 1,
    discount_percent: 0,
    isNew: false,
    });
const [servicesToDelete, setServicesToDelete] = useState([]);
const [showEditInvoiceForm, setShowEditInvoiceForm] = useState(false);
const [invoiceForm, setInvoiceForm] = useState({
    discount_percent: 0,
    tax_rate: 0,
    sales_rep_id: null,
    due_date: null,
    });

const [deletedServiceIndex, setDeletedServiceIndex] = useState(null);
const [undoTimeoutId, setUndoTimeoutId] = useState(null);
const [editingIndex, setEditingIndex] = useState(null);

const [accountDetails, setAccountDetails] = useState(null);
const [branch, setBranch] = useState(null);
const [invoiceTasks, setInvoiceTasks] = useState([]);
const [taskUsers, setTaskUsers] = useState([]);
const [newTaskDescription, setNewTaskDescription] = useState("");
const [newTaskDueDate, setNewTaskDueDate] = useState("");
const [newTaskAssignee, setNewTaskAssignee] = useState("");
const [highlightTaskId, setHighlightTaskId] = useState(null);
const [activeTab, setActiveTab] = useState("audit");
const [pipelineDetail, setPipelineDetail] = useState(null);
const [pipelineStage, setPipelineStage] = useState("order_placed");
const [pipelineNote, setPipelineNote] = useState("");
const [pipelineSaving, setPipelineSaving] = useState(false);
const [pipelineToast, setPipelineToast] = useState("");

const openPaymentModal = () => {
    setPaymentForm({
        payment_method: "",
        last_four_payment_method: "",
        total_paid: "",
    });
    setShowPaymentModal(true);
};

const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentForm({
        payment_method: "",
        last_four_payment_method: "",
        total_paid: "",
    });
};

useEffect(() => {
    async function loadData() {
    try {
        const data = await fetchInvoiceById(invoiceId);
        if (!data) throw new Error("Invoice not found");
        setInvoice(data);
        setPayments(data.payments || []);

        const account = await fetchAccountDetails(data.account_id);
        setAccountDetails(account);

        setPaymentForm((prev) => ({
            ...prev,
            total_paid: "",
        }));
    
        setInvoiceForm({
            discount_percent: data.discount_percent || 0,
            tax_rate: data.tax_rate || 0,
            sales_rep_id: data.sales_rep_id || null,
            due_date: data.due_date,
            });
        
        setServices(data.services);
    } catch (error) {
        console.error("Error fetching invoice:", error);
    }
    try {
        const reps = await fetchSalesReps();
        setSalesReps(reps);
        } catch (err) {
        console.error("❌ Error loading sales reps:", err);
    }

    try {
        const notes = await fetchNotesByInvoice(invoiceId);
        setNotes(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
    }

    try {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
    } catch (error) {
        console.error("Error fetching payment methods:", error);
    }

    try {
        const availableServices = await fetchServices();
        setAllServiceOptions(
        availableServices.sort((a, b) =>
            a.service_name.localeCompare(b.service_name)
        )
        );
    } catch (error) {
        console.error("Error fetching available services:", error);
    }
    }

    loadData();
}, [invoiceId]);

useEffect(() => {
    async function loadPipeline() {
        const detail = await fetchPipelineDetail(invoiceId);
        if (detail) {
            setPipelineDetail(detail);
            setPipelineStage(detail.effective_stage || detail.pipeline?.current_stage || "order_placed");
        }
    }
    loadPipeline();
}, [invoiceId]);

useEffect(() => {
    if (!pipelineToast) return;
    const timer = setTimeout(() => setPipelineToast(""), 3000);
    return () => clearTimeout(timer);
}, [pipelineToast]);

useEffect(() => {
    const loadTasks = async () => {
        const [tasks, usersList] = await Promise.all([
            fetchTasksByInvoice(invoiceId),
            fetchUsers(),
        ]);
        setInvoiceTasks(tasks || []);
        setTaskUsers(usersList || []);
    };
    loadTasks();
}, [invoiceId]);

useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskId");
    if (!taskId) return;
    setHighlightTaskId(taskId);
    const timeoutId = setTimeout(() => {
        const element = document.getElementById(`invoice-task-${taskId}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 150);
    const clearId = setTimeout(() => setHighlightTaskId(null), 10000);
    return () => {
        clearTimeout(timeoutId);
        clearTimeout(clearId);
    };
}, [location.search, invoiceTasks]);

useEffect(() => {
    async function loadAccountBranch() {
        if (!invoice?.account_id) return;
    
        try {
            const accountData = await fetchAccountDetails(invoice.account_id);
            console.log("✅ Account Data:", accountData);
            setAccountDetails(accountData);
            setBranch(accountData.branch); 
        } catch (err) {
            console.error("❌ Failed to load account/branch:", err); // debugging
        }
        }
    
        loadAccountBranch();
    }, [invoice?.account_id]);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    }).format(amount);
};

const formatDate = (rawDate) => {
    const formatted = formatDateInTimeZone(rawDate, user, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
    return formatted === "—" ? "N/A" : formatted;
};

const refreshInvoiceTasks = async () => {
    const tasks = await fetchTasksByInvoice(invoiceId);
    setInvoiceTasks(tasks || []);
};

const handleCreateInvoiceTask = async () => {
    if (!newTaskDescription.trim()) {
        alert("Task description is required.");
        return;
    }
    const actorId = user?.user_id ?? user?.id;
    const payload = {
        account_id: invoice?.account_id || null,
        invoice_id: Number(invoiceId),
        task_description: newTaskDescription.trim(),
        due_date: newTaskDueDate
            ? new Date(newTaskDueDate).toISOString().replace("T", " ").split(".")[0]
            : null,
        assigned_to: newTaskAssignee ? Number(newTaskAssignee) : actorId,
        user_id: actorId,
        actor_user_id: actorId,
        actor_email: user?.email,
    };
    const created = await createTask(payload);
    if (created) {
        setNewTaskDescription("");
        setNewTaskDueDate("");
        setNewTaskAssignee("");
        refreshInvoiceTasks();
    }
};

const handleToggleInvoiceTask = async (task) => {
    const actorId = user?.user_id ?? user?.id;
    const updated = await updateTask(task.task_id, {
        is_completed: !task.is_completed,
        actor_user_id: actorId,
        actor_email: user?.email,
    });
    if (updated) {
        refreshInvoiceTasks();
    }
};

const calculateFinancials = () => {
    const subtotalBeforeInvoiceDiscount = services.reduce(
        (sum, s) => sum + s.price_per_unit * s.quantity * (1 - (s.discount_percent || 0)),
    0
    );

    const perServiceDiscountTotal = services.reduce(
        (sum, s) => sum + s.price_per_unit * s.quantity * (s.discount_percent || 0),
    0
    );

    const invoiceLevelDiscountAmount = subtotalBeforeInvoiceDiscount * (invoice.discount_percent || 0);

    const taxAmount = (subtotalBeforeInvoiceDiscount - invoiceLevelDiscountAmount) * (invoice.tax_rate || 0);
    const total = subtotalBeforeInvoiceDiscount - invoiceLevelDiscountAmount + taxAmount;

    return {
        perServiceDiscountTotal,
        invoiceLevelDiscountAmount,
        taxAmount,
        total,
    };
};

const handleEditService = (index) => {
setEditingIndex(index);
};

const handleSaveEdit = (index) => {
    const updatedService = services[index];
    if (updatedService.service_id) {
        updateService(updatedService.service_id, updatedService);
    }
    setEditingIndex(null);
    updateInvoice(invoiceId, { services, actor_user_id: user.id, actor_email: user.email });
    };

const handleServiceFieldChange = (index, field, value) => {
    const updatedServices = [...services];

    if (field === "discount_percent") {
        const parsed = parseFloat(value);
        updatedServices[index][field] = isNaN(parsed) ? 0 : parsed / 100;
    } else if (field === "quantity" || field === "price_per_unit") {
        const parsed = parseFloat(value);
        updatedServices[index][field] = isNaN(parsed) ? 0 : parsed;
    } else {
        updatedServices[index][field] = value;
    }

    const s = updatedServices[index];
    s.total_price = s.quantity * s.price_per_unit * (1 - (s.discount_percent || 0));
    setServices(updatedServices);
    };

const handleLogPayment = async () => {
    try {
        const totalPaid = parseFloat(paymentForm.total_paid);
        if (!paymentForm.total_paid || Number.isNaN(totalPaid)) {
            alert("Please enter the total paid amount.");
            return;
        }
        const payload = {
            account_id: invoice.account_id,
            sales_rep_id: invoice.sales_rep_id,
            logged_by: user.id,
            payment_method: paymentForm.payment_method,
            last_four_payment_method: paymentForm.last_four_payment_method || null,
            total_paid: totalPaid,
            actor_user_id: user.id,
            actor_email: user.email,
        };
    
        const response = await logInvoicePayment(invoiceId, payload);
        if (response && response.payment_id) {
            const updatedInvoice = await fetchInvoiceById(invoiceId);
            setInvoice(updatedInvoice);
            setPayments(updatedInvoice.payments || []);
    
            // Reset form and close
            closePaymentModal();
            setPaymentForm({
            payment_method: "",
            last_four_payment_method: "",
            total_paid: "",
            });
        }
        } catch (error) {
        console.error("❌ Payment logging failed:", error);
        alert("Error logging payment.");
        }
    };

const handleUpdatePipeline = async () => {
    const actorId = user?.user_id ?? user?.id;
    if (!actorId || !pipelineStage) return;
    setPipelineSaving(true);
    const updated = await updatePipelineStage(invoiceId, {
        stage: pipelineStage,
        note: pipelineNote,
        actor_user_id: actorId,
        actor_email: user?.email,
    });
    if (updated) {
        const refreshed = await fetchPipelineDetail(invoiceId);
        setPipelineDetail(refreshed);
        setPipelineNote("");
        setPipelineToast("Pipeline updated.");
    }
    setPipelineSaving(false);
};
const handleDeleteService = async (index) => {
    const serviceToDelete = services[index];

    if (!serviceToDelete.invoice_service_id) {
        setServices((prev) => prev.filter((_, i) => i !== index));
        return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${serviceToDelete.service_name}" from the invoice?`);
    if (!confirmed) return;

    try {
        await deleteInvoiceService(serviceToDelete.invoice_service_id);

        // Remove from UI
        const updatedServices = services.filter((_, i) => i !== index);
        setServices(updatedServices);

        // 🧠 Recalculate invoice on backend (to sync discounts, totals, status)
        await updateInvoice(invoiceId, {
            services: updatedServices,
            discount_percent: invoiceForm.discount_percent,
            tax_rate: invoiceForm.tax_rate,
            sales_rep_id: invoiceForm.sales_rep_id,
            due_date: invoiceForm.due_date,
            actor_user_id: user.id,
            actor_email: user.email,
        });

        // 🧼 Refresh invoice data from DB
        const updated = await fetchInvoiceById(invoiceId);
        setInvoice(updated);
        setServices(updated.services || []);
    } catch (error) {
        console.error("❌ Failed to delete invoice service:", error);
        alert("Error deleting service.");
    }
};


const undoDelete = () => {
    clearTimeout(undoTimeoutId);
    setDeletedServiceIndex(null);
    setUndoTimeoutId(null);
    };

    const handleAddServiceRow = () => {
    setAddingService(true);
    };

const handleAddServiceSave = async () => {
    let newEntry = { ...newServiceRow };
    if (newEntry.isNew && newEntry.service_name && newEntry.price_per_unit) {
    const created = await createService({
        service_name: newEntry.service_name,
        price_per_unit: parseFloat(newEntry.price_per_unit),
    });
    newEntry.service_id = created.service_id;
    } else {
    const match = allServiceOptions.find(
        (s) => s.service_name === newEntry.service_name
    );
    if (match)
        newEntry = {
            ...match,
            quantity: newEntry.quantity,
            price_per_unit: match.price_per_unit,
            discount_percent: newEntry.discount_percent || 0,
        };
    }
    if (newEntry.quantity <= 0) {
        alert("Quantity must be greater than 0.");
        return;
    }              
    newEntry.total_price =
        newEntry.price_per_unit * newEntry.quantity * (1 - (newEntry.discount_percent || 0));
    setServices((prev) => [...prev, newEntry]);
    await updateInvoice(invoiceId, {
        services: [...services, newEntry],
        discount_percent: invoiceForm.discount_percent,
        tax_rate: invoiceForm.tax_rate,
        sales_rep_id: invoiceForm.sales_rep_id,
        due_date: invoiceForm.due_date,
        actor_user_id: user.id,
        actor_email: user.email,
    });
    
    const updated = await fetchInvoiceById(invoiceId);
    setInvoice(updated);
    setServices(updated.services);

    setNewServiceRow({
        service_name: "",
        price_per_unit: "",
        quantity: 1,
        discount_percent: 0,
        isNew: false,
    });

    setAddingService(false);
};

if (!invoice)
    return <p className="text-center text-muted-foreground">Loading invoice details...</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-card border border-border shadow-lg rounded-lg">
            {pipelineToast && (
                <div className="fixed right-6 bottom-6 z-50 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
                    {pipelineToast}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/accounts/details/${invoice.account_id}`)}
                    className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80"
                >
                    ← Back to Account
                </button>

                {/* Status Icon Badge on Right Side */}
                <div>
                    {invoice.status === "Paid" && (
                    <p className="text-green-700 bg-green-100 border border-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                        ✅ Paid in Full
                    </p>
                    )}
                    {invoice.status === "Partial" && (
                    <p className="text-yellow-800 bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
                        ⚠️ Partial Payment
                    </p>
                    )}
                    {invoice.status === "Past Due" && (
                    <p className="text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full text-sm font-semibold">
                        ❗ Past Due
                    </p>
                    )}
                    {invoice.status === "Pending" && (
                    <p className="text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                        ⏳ Pending
                    </p>
                    )}
                    {!invoice.status && (
                    <p className="text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full text-sm font-semibold">
                        Unknown Status
                    </p>
                    )}

                </div>
            </div>

            <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-left">{invoice.business_name}</h1>
            <h1 className="text-3xl font-bold text-right">Invoice #{invoice.invoice_id}</h1>
            </div>
            {/* Date Created and Updated */}
            <div className="flex justify-between items-start mb-4">
            <p>Created: {formatDate(invoice.date_created)}</p>
            <p>Updated: {formatDate(invoice.date_updated)}</p>
            </div>

            <div className="flex justify-between mb-6">
                <div className="text-left">
                    <p className="text-lg font-semibold">{invoice.business_name}</p>
                    {invoice.contact_name && (
                        <p className="text-sm text-muted-foreground">
                            Contact:{" "}
                            {invoice.primary_contact_id ? (
                                <Link
                                    className="font-semibold underline text-primary hover:text-primary/80"
                                    to={`/contacts/${invoice.primary_contact_id}`}
                                >
                                    {invoice.primary_contact_name || invoice.contact_name}
                                </Link>
                            ) : (
                                <span className="font-semibold text-foreground">{invoice.contact_name}</span>
                            )}
                        </p>
                    )}
                    <p>{invoice.address}, {invoice.city}, {invoice.state} {invoice.zip_code}</p>
                    {invoice.email ? (
                        <a
                            className="text-blue-600 font-medium hover:underline"
                            href={`mailto:${invoice.email}?subject=${encodeURIComponent(`Invoice #${invoice.invoice_id}`)}`}
                        >
                            {invoice.email}
                        </a>
                    ) : (
                        <p className="text-muted-foreground">—</p>
                    )}
                    <p>{invoice.phone_number}</p>              
                </div>
                <div className="text-right">
                    <p><strong>Sales Representative:</strong></p>
                    <p className="text-lg font-semibold">{invoice.branch_name}</p>
                    <p>{invoice.sales_rep_name}</p>
                    {invoice.sales_rep_email ? (
                        <a
                            className="text-blue-600 hover:underline"
                            href={`mailto:${invoice.sales_rep_email}?subject=${encodeURIComponent(`Invoice #${invoice.invoice_id}`)}`}
                        >
                            {invoice.sales_rep_email}
                        </a>
                    ) : (
                        <p className="text-muted-foreground">—</p>
                    )}
                    <p>{invoice.sales_rep_phone}</p>
                    {user?.id === invoice.sales_rep_id && (
                    <p><strong>Commission:</strong> {formatCurrency(invoice.commission_amount)} ({(invoice.commission_amount / invoice.final_total * 100).toFixed(2)}%)</p>
                    )}
                </div>
            </div>
            {/* Edit Invoice Form */}
            <section className="mb-6 border p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-left">Edit Invoice</h2>
                    {!showEditInvoiceForm && (
                    <button
                        onClick={() => setShowEditInvoiceForm(true)}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
                    >
                        Edit Invoice
                    </button>
                    )}
                </div>

                {showEditInvoiceForm && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end mt-4">
                    {/* Invoice Discount */}
                    <div>
                        <label className="block font-bold text-sm mb-1">Invoice Discount</label>
                        <div className="relative">
                        <input
                            type="number"
                            value={(invoiceForm.discount_percent * 100).toFixed(0)}
                            onChange={(e) =>
                            setInvoiceForm((prev) => ({
                                ...prev,
                                discount_percent: parseFloat(e.target.value) / 100 || 0,
                            }))
                            }
                            className="w-full border p-2 pr-6 rounded text-right"
                        />
                        <span className="absolute right-2 top-2 text-muted-foreground font-bold">%</span>
                        </div>
                    </div>

                    {/* Tax Rate */}
                    <div>
                        <label className="block font-bold text-sm mb-1">Tax Rate</label>
                        <div className="relative">
                        <input
                            type="number"
                            value={(invoiceForm.tax_rate * 100).toFixed(2)}
                            onChange={(e) =>
                            setInvoiceForm((prev) => ({
                                ...prev,
                                tax_rate: parseFloat(e.target.value) / 100 || 0,
                            }))
                            }
                            className="w-full border p-2 pr-6 rounded text-right"
                        />
                        <span className="absolute right-2 top-2 text-muted-foreground font-bold">%</span>
                        </div>
                    </div>

                    {/* Sales Rep Dropdown */}
                    <div>
                        <label className="block font-bold text-sm mb-1">Sales Representative</label>
                        <select
                        className="w-full border p-2 rounded text-left"
                        value={invoice.sales_rep_id || ""}
                        onChange={(e) =>
                            setInvoiceForm((prev) => ({
                                ...prev,
                                sales_rep_id: parseInt(e.target.value),
                            }))
                            }
                        >
                        <option value="">-- Select --</option>
                        {salesReps.map((rep) => (
                            <option key={rep.user_id} value={rep.user_id}>
                            {rep.first_name} {rep.last_name}
                            </option>
                        ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block font-bold text-sm mb-1">Due Date</label>
                        <input
                        type="date"
                        className="w-full border p-2 rounded"
                        value={invoiceForm.due_date || ""}
                        onChange={(e) =>
                            setInvoiceForm((prev) => ({ ...prev, due_date: e.target.value }))
                        }
                        />
                    </div>
                    </div>
                )}

                {showEditInvoiceForm && (
                    <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                        onClick={async () => {
                            try {
                                await updateInvoice(invoiceId, {
                                    discount_percent: invoiceForm.discount_percent,
                                    tax_rate: invoiceForm.tax_rate,
                                    sales_rep_id: invoiceForm.sales_rep_id,
                                    due_date: invoiceForm.due_date, 
                                    actor_user_id: user.id,
                                    actor_email: user.email,
                                });
                            
                                const updated = await fetchInvoiceById(invoiceId);
                                setInvoice(updated);
                                setShowEditInvoiceForm(false);
                                } catch (error) {
                                console.error("❌ Failed to update invoice:", error);
                                alert("There was a problem saving the invoice. Try again.");
                                }
                            }}
                    >
                        Save Update
                    </button>
                    <button
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80"
                        onClick={() => setShowEditInvoiceForm(false)}
                    >
                        Cancel
                    </button>
                    </div>
                )}
                </section>


            {/* SERVICES TABLE */}
            <section className="mb-6 border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-left">Services</h2>
                <button
                onClick={handleAddServiceRow}
                className="bg-primary text-primary-foreground px-3 py-1 rounded shadow hover:bg-primary/90"
                >Add Service</button>
            </div>
            <div className="overflow-y-auto max-h-64 border rounded-lg">
                <table className="w-full">
                <thead className="sticky top-0 bg-card shadow-sm">
                    <tr>
                    <th className="font-bold p-2 border-b border-r text-left">Service</th>
                    <th className="font-bold p-2 border-b border-r text-right">Price / Unit</th>
                    <th className="font-bold p-2 border-b border-r text-right">Quantity</th>
                    <th className="font-bold p-2 border-b border-r text-right">Service Discount %</th>
                    <th className="font-bold p-2 border-b border-r text-right">Service Discount</th>
                    <th className="font-bold p-2 border-b border-r text-right">Total</th>
                    <th className="font-bold p-2 border-b text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s, index) => {
                        const displayDiscount = (s.discount_percent || 0) * 100;

                        return (
                        <tr key={index} className={index % 2 === 0 ? "bg-muted/40" : "bg-card"}>
                        <td className="p-2 border-b border-r text-left">
                            {editingIndex === index ? (
                            <select
                                className="w-full p-1 border border-border bg-card text-foreground rounded"
                                value={s.service_name}
                                onChange={(e) => {
                                const selected = allServiceOptions.find(
                                    (opt) => opt.service_name === e.target.value
                                );
                                handleServiceFieldChange(index, "service_name", selected.service_name);
                                handleServiceFieldChange(index, "price_per_unit", selected.price_per_unit);
                                }}
                            >
                                <option value="">-- Select a service --</option>
                                {allServiceOptions.map((opt) => (
                                <option key={opt.service_id} value={opt.service_name}>
                                    {opt.service_name}
                                </option>
                                ))}
                            </select>
                            ) : (
                            s.service_name
                            )}
                        </td>
                        {/* Price per unit */}
                        <td className="p-2 border-b border-r text-right">
                                {editingIndex === index ? (
                                <span className="block text-right px-1">${
                                    (s.price_per_unit || 0).toFixed(2)
                                }</span>
                                ) : (
                                formatCurrency(s.price_per_unit)
                                )}
                            </td>
                        {/* Quantity */}
                        <td className="p-2 border-b border-r text-right">
                            {editingIndex === index ? (
                            <input
                                className="w-full p-1 border border-border bg-card text-foreground rounded text-right"
                                type="number"
                                value={s.quantity}
                                onChange={(e) =>
                                handleServiceFieldChange(index, "quantity", e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
                            ) : (
                            s.quantity
                            )}
                        </td>
                        {/* Discount % */}
                        <td className="p-2 border-b border-r text-right">
                            {editingIndex === index ? (
                            <input
                                className="w-full p-1 border border-border bg-card text-foreground rounded text-right"
                                type="number"
                                value={isNaN(displayDiscount) ? "" : displayDiscount}
                                onChange={(e) =>
                                    handleServiceFieldChange(index, "discount_percent", e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
                            ) : (
                            `${displayDiscount.toFixed(0)}%`
                            )}
                        </td>
                        {/* Discount Amount */}
                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(
                            s.price_per_unit * s.quantity * (s.discount_percent || 0)
                            )}
                        </td>
                        {/* Final total */}
                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(s.total_price)}
                        </td>
                        {/* Action buttons */}
                        <td className="p-2 border-b text-center space-x-2">
                            {deletedServiceIndex === index ? (
                            <button
                                onClick={undoDelete}
                                className="bg-secondary text-secondary-foreground px-2 py-1 rounded"
                            >
                                Undo
                            </button>
                            ) : editingIndex === index ? (
                            <>
                                <button
                                onClick={() => handleSaveEdit(index)}
                                className="bg-primary text-primary-foreground px-2 py-1 rounded"
                                >
                                Save
                                </button>
                                <button
                                onClick={() => setEditingIndex(null)}
                                className="bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                >
                                Cancel
                                </button>
                            </>
                            ) : (
                            <>
                                <button
                                onClick={() => handleEditService(index)}
                                className="bg-secondary text-secondary-foreground px-2 py-1 rounded"
                                >
                                Edit
                                </button>
                                <button
                                onClick={() => handleDeleteService(index)}
                                className="bg-destructive text-destructive-foreground px-2 py-1 rounded"
                                >
                                Delete
                                </button>
                            </>
                            )}
                        </td>
                        </tr>
                    )})}
                    {/* Add New Row at the Bottom if Adding */}
                    {editingIndex === null && addingService && (
                        <tr className="bg-accent/40">
                        <td className="p-2 border-b border-r text-left">
                            <select
                            className="w-full p-1 border border-border bg-card text-foreground rounded"
                            value={newServiceRow.service_name}
                            onChange={(e) => {
                                const selected = allServiceOptions.find(
                                (opt) => opt.service_name === e.target.value
                                );
                                setNewServiceRow((prev) => ({
                                ...prev,
                                service_name: selected.service_name,
                                price_per_unit: selected.price_per_unit,
                                }));
                            }}
                            >
                            <option value="">-- Select a service --</option>
                            {allServiceOptions.map((opt) => (
                                <option key={opt.service_id} value={opt.service_name}>
                                {opt.service_name}
                                </option>
                            ))}
                            </select>
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            <input
                            className="w-full p-1 border border-border bg-card text-foreground rounded text-right"
                            type="number"
                            value={newServiceRow.price_per_unit}
                            readOnly
                            />
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            <input
                            className="w-full p-1 border border-border bg-card text-foreground rounded text-right"
                            type="number"
                            value={newServiceRow.quantity}
                            onChange={(e) =>
                                setNewServiceRow((prev) => ({
                                ...prev,
                                quantity: parseInt(e.target.value),
                                }))
                            }
                            />
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            <input
                            className="w-full p-1 border border-border bg-card text-foreground rounded text-right"
                            type="number"
                            value={(newServiceRow.discount_percent || 0) * 100}
                            onChange={(e) =>
                                setNewServiceRow((prev) => ({
                                ...prev,
                                discount_percent: parseFloat(e.target.value) / 100,
                                }))
                            }
                            />
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(
                            newServiceRow.price_per_unit *
                                newServiceRow.quantity *
                                (newServiceRow.discount_percent || 0)
                            )}
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(
                            newServiceRow.price_per_unit *
                                newServiceRow.quantity *
                                (1 - (newServiceRow.discount_percent || 0))
                            )}
                        </td>
                        <td className="p-2 border-b text-center space-x-2">
                            <button
                            onClick={handleAddServiceSave}
                            className="bg-primary text-primary-foreground px-2 py-1 rounded"
                            >
                            Save
                            </button>
                            <button
                            onClick={() => setAddingService(false)}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded"
                            >
                            Cancel
                            </button>
                        </td>
                        </tr>
                    )}
                    </tbody>

                </table>
            </div>
            </section>

            {/* Financial Summary */}
            <section className="mb-6 border p-4 rounded-lg text-left">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex-1 min-w-[240px]">
                        <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
                        <p className="text-sm text-muted-foreground">Discounts are applied in two ways:</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground">
                            <li><strong>Service Discount</strong> — applied per service.</li>
                            <li><strong>Invoice Discount</strong> — applied on the subtotal before tax.</li>
                        </ul>

                        <div className="mt-4 space-y-1 text-left">
                            <p><strong>Service Total:</strong> {formatCurrency(
                                services.reduce((sum, s) => sum + s.price_per_unit * s.quantity, 0)
                            )}</p>

                            <p><strong>Service Discount:</strong> {formatCurrency(calculateFinancials().perServiceDiscountTotal)}</p>

                            <p><strong>Invoice Discount:</strong> {formatCurrency(calculateFinancials().invoiceLevelDiscountAmount)} ({(invoice.discount_percent * 100).toFixed(0)}%)</p>

                            <p><strong>Tax:</strong> {formatCurrency(calculateFinancials().taxAmount)} ({(invoice.tax_rate * 100).toFixed(2)}%)</p>

                            <p className="font-bold text-lg"><strong>Total:</strong> {formatCurrency(calculateFinancials().total)}</p>

                            <p><strong>Due Date:</strong> {formatDate(invoice.due_date)}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Share Invoice</p>
                                <p className="text-xs text-muted-foreground">Send or download the invoice.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {accountDetails ? (
                                    <InvoiceActions
                                        invoice={invoice}
                                        services={services}
                                        salesRep={{
                                            first_name: invoice.sales_rep_name?.split(" ")[0] || "",
                                            last_name: invoice.sales_rep_name?.split(" ")[1] || "",
                                            email: invoice.sales_rep_email,
                                            phone_number: invoice.sales_rep_phone,
                                        }}
                                        branch={branch}
                                        accountDetails={accountDetails}
                                        payment={invoice.payments?.[0] || null}
                                        user={user}
                                    />
                                ) : (
                                    <p>Loading account details...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <button
                            className="bg-primary text-primary-foreground px-4 py-2 rounded shadow hover:bg-primary/90"
                            onClick={openPaymentModal}
                        >
                            Log Payment
                        </button>
                    </div>
                </div>
            </section>

            {/* Pipeline */}
            <section className="mb-6 border border-border p-4 rounded-lg bg-card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Paper Sales Pipeline</h2>
                        <p className="text-xs text-muted-foreground">Track invoice progress and customer updates.</p>
                    </div>
                    <button
                        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                        onClick={() => navigate(`/pipelines/invoice/${invoice.invoice_id}`)}
                    >
                        Open Pipeline
                    </button>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                    <PipelineStatusBar
                        currentStage={pipelineDetail?.effective_stage || pipelineDetail?.pipeline?.current_stage || "order_placed"}
                        onStageSelect={(stage) => setPipelineStage(stage)}
                    />
                </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
                            <div className="rounded-lg border border-border bg-card p-4">
                                <h3 className="text-sm font-semibold text-foreground">Update Stage</h3>
                                <p className="text-xs text-muted-foreground">
                                    Manual update with optional note. Effective stage is auto‑computed from payment status.
                                </p>
                        <div className="mt-3 space-y-3">
                            <select
                                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                value={pipelineStage}
                                onChange={(e) => setPipelineStage(e.target.value)}
                            >
                                {PIPELINE_STAGES.map((stage) => (
                                    <option key={stage.key} value={stage.key}>
                                        {stage.label}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                                rows={3}
                                placeholder="Add a note (optional)"
                                value={pipelineNote}
                                onChange={(e) => setPipelineNote(e.target.value)}
                            />
                            <button
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                onClick={handleUpdatePipeline}
                                disabled={pipelineSaving}
                            >
                                {pipelineSaving ? "Saving..." : "Update Pipeline"}
                            </button>
                            {pipelineStage === "payment_not_received" && (
                                <p className="text-xs text-amber-700">
                                    Payment issue email will be logged and escalated after 2 days if unresolved.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                        <h3 className="text-sm font-semibold text-foreground">Suggested Timeline</h3>
                        <p className="text-xs text-muted-foreground">Targets based on Day 1–5 timeline.</p>
                        <div className="mt-3 space-y-2 text-sm">
                            {PIPELINE_STAGES.map((stage) => {
                                const suggested = pipelineDetail?.suggested_dates?.[stage.key];
                                const actual = pipelineDetail?.pipeline?.[PIPELINE_STAGE_FIELDS[stage.key]];
                                return (
                                    <div key={stage.key} className="flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground">{stage.label}</span>
                                        <span className="text-xs text-foreground">
                                            {actual ? formatDate(actual) : suggested ? formatDate(suggested) : "—"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-6 border border-border p-4 rounded-lg bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">Invoice Activity</h2>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
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
                                activeTab === "tasks" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                            onClick={() => setActiveTab("tasks")}
                        >
                            Tasks
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
                                activeTab === "payments" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                            onClick={() => setActiveTab("payments")}
                        >
                            Payments
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    {activeTab === "audit" && (
                        <AuditSection
                            title="Invoice Audit Trail"
                            filters={{ invoice_id: Number(invoiceId) }}
                            limit={100}
                        />
                    )}

                    {activeTab === "tasks" && (
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <h2 className="text-xl font-semibold text-left text-foreground">Tasks</h2>
                                <span className="text-xs text-muted-foreground">
                                    {invoiceTasks.length} task{invoiceTasks.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <div className="grid gap-2 md:grid-cols-[2fr,1fr,1fr,auto]">
                                <input
                                    type="text"
                                    placeholder="New task for this invoice..."
                                    className="border border-border bg-card text-foreground p-2 rounded w-full"
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="border border-border bg-card text-foreground p-2 rounded w-full"
                                    value={newTaskDueDate}
                                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                                />
                                <select
                                    className="border border-border bg-card text-foreground p-2 rounded w-full"
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                >
                                    <option value="">Assign to me</option>
                                    {taskUsers.map((u) => (
                                        <option key={u.user_id} value={u.user_id}>
                                            {u.first_name} {u.last_name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleCreateInvoiceTask}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg hover:bg-primary/90 transition-colors"
                                >
                                    Add Task
                                </button>
                            </div>

                            <div className="mt-4 overflow-y-auto max-h-64 border border-border rounded-lg">
                                <table className="w-full text-foreground text-sm">
                                    <thead className="sticky top-0 bg-card shadow-sm">
                                        <tr>
                                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Task</th>
                                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Assigned To</th>
                                            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Due</th>
                                            <th className="font-bold p-2 border-b text-center text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceTasks.length > 0 ? (
                                            invoiceTasks.map((task, index) => {
                                                const assignee =
                                                    taskUsers.find((u) => Number(u.user_id) === Number(task.assigned_to)) || null;
                                                return (
                                                    <tr
                                                        key={task.task_id}
                                                        id={`invoice-task-${task.task_id}`}
                                                        className={`hover:bg-muted/60 ${
                                                            highlightTaskId === String(task.task_id)
                                                                ? "bg-accent/40"
                                                                : index % 2 === 0
                                                                    ? "bg-muted/40"
                                                                    : "bg-card"
                                                        }`}
                                                    >
                                                        <td className="p-2 border-b border-r text-left">
                                                            <Link className="text-primary hover:underline" to={`/tasks/${task.task_id}`}>
                                                                {task.task_description}
                                                            </Link>
                                                        </td>
                                                        <td className="p-2 border-b border-r text-left">
                                                            {assignee ? `${assignee.first_name} ${assignee.last_name}` : "Unassigned"}
                                                        </td>
                                                        <td className="p-2 border-b border-r text-left">
                                                            {task.due_date
                                                                ? formatDateInTimeZone(task.due_date, user, {
                                                                    month: "2-digit",
                                                                    day: "2-digit",
                                                                    year: "numeric",
                                                                })
                                                                : "—"}
                                                        </td>
                                                        <td className="p-2 border-b text-center">
                                                            <button
                                                                onClick={() => handleToggleInvoiceTask(task)}
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                    task.is_completed
                                                                        ? "bg-success text-success-foreground"
                                                                        : "bg-warning text-warning-foreground"
                                                                }`}
                                                            >
                                                                {task.is_completed ? "Completed" : "Active"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-muted-foreground">
                                                    No tasks for this invoice.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "notes" && (
                        <NotesSection
                            notes={notes}
                            accountId={invoice.account_id}
                            userId={user.user_id ?? user.id ?? 0}
                            setNotes={setNotes}
                            refreshNotes={async () => {
                                const updated = await fetchNotesByInvoice(invoiceId);
                                setNotes(updated);
                            }}
                            invoiceId={invoiceId}
                        />
                    )}

                    {activeTab === "payments" && (
                        <div>
                            {payments.length > 0 ? (
                                <div className="space-y-4">
                                    {payments.map((payment, idx) => (
                                        <PaidBox
                                            key={payment.payment_id}
                                            payment={payment}
                                            paymentMethods={paymentMethods}
                                            invoiceTotal={invoice.final_total}
                                            totalPaidSoFar={payments.reduce((sum, p) => sum + parseFloat(p.total_paid || 0), 0)}
                                            loggedInUsername={user.username}
                                            onUpdate={async (updatedPayment) => {
                                                const res = await updatePayment(payment.payment_id, updatedPayment, user.id, user.email);
                                                if (res) {
                                                    const updatedPayments = [...payments];
                                                    updatedPayments[idx] = res;
                                                    setPayments(updatedPayments);
                                                }
                                            }}
                                            onDelete={async (paymentId) => {
                                                const res = await deletePayment(paymentId, user.id, user.email);
                                                if (res) {
                                                    const updated = payments.filter(p => p.payment_id !== paymentId);
                                                    setPayments(updated);
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No payment records yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={closePaymentModal}
                >
                    <div
                        className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Log Payment</h2>
                            <button
                                className="text-xl text-muted-foreground hover:text-foreground"
                                onClick={closePaymentModal}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium">Payment Method</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.payment_method}
                                    onChange={(e) =>
                                        setPaymentForm((prev) => ({
                                            ...prev,
                                            payment_method: parseInt(e.target.value),
                                        }))
                                    }
                                >
                                    <option value="">-- Select a Method --</option>
                                    {paymentMethods.map((pm) => (
                                        <option key={pm.method_id} value={pm.method_id}>
                                            {pm.method_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Last Four (optional)</label>
                                <input
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.last_four_payment_method}
                                    onChange={(e) =>
                                        setPaymentForm((prev) => ({
                                            ...prev,
                                            last_four_payment_method: e.target.value,
                                        }))
                                    }
                                    placeholder="1234"
                                    maxLength={4}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Total Paid</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={paymentForm.total_paid}
                                    onChange={(e) =>
                                        setPaymentForm((prev) => ({
                                            ...prev,
                                            total_paid: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                                onClick={handleLogPayment}
                            >
                                Log Payment
                            </button>
                            <button
                                className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80"
                                onClick={closePaymentModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-end mt-6">
            <button
                onClick={() => deleteInvoice(invoiceId, user.id, user.email).then(() => navigate(`/accounts/details/${invoice.account_id}`))}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
            >
                Delete Invoice
            </button>
            </div>
        </div>
    );
    };

    InvoiceDetailsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string,
    }).isRequired,
    };

    export default InvoiceDetailsPage;
