import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { fetchSalesReps } from "../services/userService";
import { updatePayment, deletePayment } from "../services/paymentService";
// import Sidebar from "../components/Sidebar";
import NotesSection from "../components/NotesSection";
import InvoiceActions from "../components/InvoiceActions";
import PaidBox from "../components/PaidBox";
import { fetchAccountDetails } from "../services/accountService";
import { format } from "date-fns";
import PropTypes from "prop-types";


const InvoiceDetailsPage = ({ user }) => {
const { invoiceId } = useParams();
const navigate = useNavigate();
const [salesReps, setSalesReps] = useState([]);
const [invoice, setInvoice] = useState(null);
const [notes, setNotes] = useState([]);
const [paymentMethods, setPaymentMethods] = useState([]);
const [showPaymentForm, setShowPaymentForm] = useState(false);
const [paymentForm, setPaymentForm] = useState({
    payment_method: "",
    last_four_payment_method: "",
    total_paid: 0,
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
            total_paid: parseFloat(data.final_total) || 0,
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
    if (!rawDate) return "N/A";
    try {
        return format(new Date(rawDate), "MM/dd/yyyy");
        } catch (e) {
        console.error("❌ formatDate error:", rawDate, e);
        return "Invalid Date";
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
    updateInvoice(invoiceId, { services });
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
        const payload = {
            account_id: invoice.account_id,
            sales_rep_id: invoice.sales_rep_id,
            logged_by: user.id,
            payment_method: paymentForm.payment_method,
            last_four_payment_method: paymentForm.last_four_payment_method || null,
            total_paid: parseFloat(paymentForm.total_paid),
        };
    
        const response = await logInvoicePayment(invoiceId, payload);
        if (response && response.payment_id) {
            const updatedInvoice = await fetchInvoiceById(invoiceId);
            setInvoice(updatedInvoice);
            setPayments(updatedInvoice.payments || []);
    
            // Reset form and close
            setShowPaymentForm(false);
            setPaymentForm({
            payment_method: "",
            last_four_payment_method: "",
            total_paid: parseFloat(updatedInvoice.final_total || 0),
            });
        }
        } catch (error) {
        console.error("❌ Payment logging failed:", error);
        alert("Error logging payment.");
        }
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
    return <p className="text-center text-slate-500 dark:text-slate-400">Loading invoice details...</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(`/accounts/details/${invoice.account_id}`)}
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
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
                    <p className="text-gray-700 bg-gray-100 border border-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
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
                    <p>{invoice.address}, {invoice.city}, {invoice.state} {invoice.zip_code}</p>
                    <p className="text-blue-600 font-medium">{invoice.email}</p>
                    <p>{invoice.phone_number}</p>              
                </div>
                <div className="text-right">
                    <p><strong>Sales Representative:</strong></p>
                    <p className="text-lg font-semibold">{invoice.branch_name}</p>
                    <p>{invoice.sales_rep_name}</p>
                    <p>{invoice.sales_rep_email}</p>
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
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
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
                        <span className="absolute right-2 top-2 text-gray-400 font-bold">%</span>
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
                        <span className="absolute right-2 top-2 text-gray-400 font-bold">%</span>
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
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={async () => {
                            try {
                                await updateInvoice(invoiceId, {
                                    discount_percent: invoiceForm.discount_percent,
                                    tax_rate: invoiceForm.tax_rate,
                                    sales_rep_id: invoiceForm.sales_rep_id,
                                    due_date: invoiceForm.due_date, 
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
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
                className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                >Add Service</button>
            </div>
            <div className="overflow-y-auto max-h-64 border rounded-lg">
                <table className="w-full">
                <thead className="sticky top-0 bg-white shadow-sm">
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
                        <tr key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                        <td className="p-2 border-b border-r text-left">
                            {editingIndex === index ? (
                            <select
                                className="w-full p-1 border rounded"
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
                                className="w-full p-1 border rounded text-right"
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
                                className="w-full p-1 border rounded text-right"
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
                                className="bg-yellow-500 text-white px-2 py-1 rounded"
                            >
                                Undo
                            </button>
                            ) : editingIndex === index ? (
                            <>
                                <button
                                onClick={() => handleSaveEdit(index)}
                                className="bg-green-500 text-white px-2 py-1 rounded"
                                >
                                Save
                                </button>
                                <button
                                onClick={() => setEditingIndex(null)}
                                className="bg-gray-500 text-white px-2 py-1 rounded"
                                >
                                Cancel
                                </button>
                            </>
                            ) : (
                            <>
                                <button
                                onClick={() => handleEditService(index)}
                                className="bg-blue-500 text-white px-2 py-1 rounded"
                                >
                                Edit
                                </button>
                                <button
                                onClick={() => handleDeleteService(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
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
                        <tr className="bg-green-50">
                        <td className="p-2 border-b border-r text-left">
                            <select
                            className="w-full p-1 border rounded"
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
                            className="w-full p-1 border rounded text-right"
                            type="number"
                            value={newServiceRow.price_per_unit}
                            readOnly
                            />
                        </td>
                        <td className="p-2 border-b border-r text-right">
                            <input
                            className="w-full p-1 border rounded text-right"
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
                            className="w-full p-1 border rounded text-right"
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
                            className="bg-green-600 text-white px-2 py-1 rounded"
                            >
                            Save
                            </button>
                            <button
                            onClick={() => setAddingService(false)}
                            className="bg-gray-500 text-white px-2 py-1 rounded"
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

            {/* FInancial Summary */}
            <section className="mb-6 border p-4 rounded-lg text-left">
            <h2 className="text-xl font-semibold mb-2">Financial Summary</h2>
            <p className="text-sm text-gray-600 mb-4">
                Discounts are applied in two ways:
                <ul className="list-disc list-inside mt-1">
                <li><strong>Service Discount</strong> — applied per service.</li>
                <li><strong>Invoice Discount</strong> — applied on the subtotal before tax.</li>
                </ul>
            </p>

            <div className="space-y-1 text-left">
                <p><strong>Service Total:</strong> {formatCurrency(
                services.reduce((sum, s) => sum + s.price_per_unit * s.quantity, 0)
                )}</p>

                <p><strong>Service Discount:</strong> {formatCurrency(calculateFinancials().perServiceDiscountTotal)}</p>

                <p><strong>Invoice Discount:</strong> {formatCurrency(calculateFinancials().invoiceLevelDiscountAmount)} ({(invoice.discount_percent * 100).toFixed(0)}%)</p>

                <p><strong>Tax:</strong> {formatCurrency(calculateFinancials().taxAmount)} ({(invoice.tax_rate * 100).toFixed(2)}%)</p>

                <p className="font-bold text-lg"><strong>Total:</strong> {formatCurrency(calculateFinancials().total)}</p>

                <p><strong>Due Date:</strong> {formatDate(invoice.due_date)}</p>
            </div>
            </section>

            {/* LOG PAYMENT */}
            <section className="mb-6 border p-4 rounded-lg text-left">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Log Payment</h2>
                {!showPaymentForm && (
                <button
                    className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
                    onClick={() => setShowPaymentForm(true)}
                >
                    Log Payment
                </button>
                )}
            </div>

            {showPaymentForm && (
                <div className="bg-gray-100 p-4 rounded border">
                <div className="mb-2">
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

                <div className="mb-2">
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

                <div className="mb-2">
                    <label className="block text-sm font-medium">Total Paid</label>
                    <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={paymentForm.total_paid}
                    onChange={(e) =>
                        setPaymentForm((prev) => ({
                        ...prev,
                        total_paid: parseFloat(e.target.value) || 0,
                        }))
                    }
                    />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    onClick={handleLogPayment}
                    >
                    Log Payment
                    </button>
                    <button
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    onClick={() => setShowPaymentForm(false)}
                    >
                    Cancel
                    </button>
                </div>
                </div>
            )}
            </section>

            {/* PAYMENT RECORDS */}
            {payments.length > 0 && (
            <section className="mb-6 border p-4 rounded-lg text-left">
                <h2 className="text-xl font-semibold mb-3">Payment Records</h2>
                {payments.map((payment, idx) => (
                <PaidBox
                    key={payment.payment_id}
                    payment={payment}
                    paymentMethods={paymentMethods}
                    invoiceTotal={invoice.final_total}
                    totalPaidSoFar={payments.reduce((sum, p) => sum + parseFloat(p.total_paid || 0), 0)}
                    loggedInUsername={user.username}
                    onUpdate={async (updatedPayment) => {
                        const res = await updatePayment(payment.payment_id, updatedPayment);
                        if (res) {
                            const updatedPayments = [...payments];
                            updatedPayments[idx] = res;
                            setPayments(updatedPayments);
                        }
                    }}
                    
                    onDelete={async (paymentId) => {
                        const res = await deletePayment(paymentId);
                        if (res) {
                            const updated = payments.filter(p => p.payment_id !== paymentId);
                            setPayments(updated);
                        }
                    }}
                    
                />
                ))}
            </section>
            )}

            {/* SHARE INVOICE PDF */}
            <section className="mb-6 border p-4 rounded-lg text-left">
            <h2 className="text-xl font-semibold mb-2">Share Invoice</h2>
            <div className="text-sm text-gray-600 mb-4">
            <p>Discounts are applied in two ways:</p>
                <ul className="list-disc list-inside mt-1">
                    <li><strong>Service Discount</strong> — applied per service.</li>
                    <li><strong>Invoice Discount</strong> — applied on the subtotal before tax.</li>
                </ul>
            </div>

            <div className="flex justify-end gap-4">
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
            </section>

            {/* NOTES TABLE */}
            <NotesSection
                notes={notes}
                accountId={invoice.account_id}
                userId={user.id}
                setNotes={setNotes}
                refreshNotes={async () => {
                    const updated = await fetchNotesByInvoice(invoiceId);
                    setNotes(updated);
            }}
            invoiceId={invoiceId}
            />

            <div className="flex justify-end mt-6">
            <button
                onClick={() => deleteInvoice(invoiceId).then(() => navigate(`/accounts/details/${invoice.account_id}`))}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
