import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchInvoiceById,
    updateInvoice,
    deleteInvoice,
    fetchPaymentMethods,
} from "../services/invoiceService";
import {
fetchServices,
createService,
updateService,
} from "../services/servicesService";
import { fetchNotesByInvoice } from "../services/notesService";
import Sidebar from "../components/Sidebar";
import NotesSection from "../components/NotesSection";
import PropTypes from "prop-types";
// import { format } from "date-fns";

const InvoiceDetailsPage = ({ user }) => {
const { invoiceId } = useParams();
const navigate = useNavigate();

const [invoice, setInvoice] = useState(null);
const [notes, setNotes] = useState([]);
const [paymentMethods, setPaymentMethods] = useState([]);
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

// const [newService, setNewService] = useState({
//     service_name: "",
//     price_per_unit: "",
//     quantity: 1,
//     isNew: false,
// });
const [deletedServiceIndex, setDeletedServiceIndex] = useState(null);
const [undoTimeoutId, setUndoTimeoutId] = useState(null);
const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        async function loadData() {
        try {
            const data = await fetchInvoiceById(invoiceId);
            if (!data) throw new Error("Invoice not found");
            setInvoice(data);
            setServices(data.services);
        } catch (error) {
            console.error("Error fetching invoice:", error);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        }).format(amount);
    };

    const calculateFinancials = () => {
        const subtotal = services.reduce(
          (sum, s) => sum + s.price_per_unit * s.quantity * (1 - (s.discount_percent || 0)),
            0
        );
        const discountAmount = services.reduce(
            (sum, s) => sum + s.price_per_unit * s.quantity * (s.discount_percent || 0),
            0
        );
        const taxAmount = subtotal * (invoice.tax_rate || 0);
        const total = subtotal + taxAmount;
        return {
            discountAmount,
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
        

    const handleDeleteService = (index) => {
        setDeletedServiceIndex(index);
        const timeoutId = setTimeout(() => {
            setServices((prev) => prev.filter((_, i) => i !== index));
            setDeletedServiceIndex(null);
        }, 5000);
        setUndoTimeoutId(timeoutId);
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
            newEntry.total_price =
                newEntry.price_per_unit * newEntry.quantity * (1 - (newEntry.discount_percent || 0));
            setServices((prev) => [...prev, newEntry]);
            setNewServiceRow({
                service_name: "",
                price_per_unit: "",
                quantity: 1,
                discount_percent: 0,
                isNew: false,
            });
            updateInvoice(invoiceId, { services: [...services, newEntry] });
        };

    if (!invoice)
        return <p className="text-center text-gray-600">Loading invoice details...</p>;

    return (
        <div className="flex">
        <Sidebar user={user} />
        <div className="flex-1 p-6 ml-64">
        <div className="flex justify-between mb-4">
            <button
                onClick={() => navigate(`/accounts/details/${invoice.account_id}`)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
            ← Back to Account
            </button>
        </div>
            <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-left">{invoice.business_name}</h1>
            <h1 className="text-3xl font-bold text-right">Invoice #{invoice.invoice_id}</h1>
            </div>

            <div className="flex justify-between mb-6">
            <div className="text-left">
                <p className="text-lg font-semibold">{invoice.business_name}</p>
                <p>{invoice.address}, {invoice.city}, {invoice.state} {invoice.zip_code}</p>
                {/* <p>{invoice.email}</p> */}
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
                    <th className="font-bold p-2 border-b border-r text-right">Discount %</th>
                    <th className="font-bold p-2 border-b border-r text-right">Discount</th>
                    <th className="font-bold p-2 border-b border-r text-right">Final</th>
                    <th className="font-bold p-2 border-b text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((s, index) => (
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

                        <td className="p-2 border-b border-r text-right">
                            {editingIndex === index ? (
                            <input
                                className="w-full p-1 border rounded text-right"
                                type="number"
                                value={s.price_per_unit}
                                readOnly
                            />
                            ) : (
                            formatCurrency(s.price_per_unit)
                            )}
                        </td>

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

                        <td className="p-2 border-b border-r text-right">
                            {editingIndex === index ? (
                            <input
                                className="w-full p-1 border rounded text-right"
                                type="number"
                                value={(s.discount_percent || 0) * 100}
                                onChange={(e) =>
                                handleServiceFieldChange(index, "discount_percent", e.target.value)
                                }
                                onFocus={(e) => e.target.select()}
                            />
                            ) : (
                            `${((s.discount_percent || 0) * 100).toFixed(2)}%`
                            )}
                        </td>

                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(
                            s.price_per_unit * s.quantity * (s.discount_percent || 0)
                            )}
                        </td>

                        <td className="p-2 border-b border-r text-right">
                            {formatCurrency(s.total_price)}
                        </td>

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
                    ))}
                    {/* ✅ Add New Row at the Bottom if Adding */}
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

            <section className="mb-6 text-left">
            <h2 className="text-xl font-semibold">Financial Summary</h2>
            <p><strong>Discount:</strong> {formatCurrency(calculateFinancials().discountAmount)} ({(invoice.discount_percent * 100).toFixed(2)}%)</p>
            <p><strong>Tax:</strong> {formatCurrency(calculateFinancials().taxAmount)} ({(invoice.tax_rate * 100).toFixed(2)}%)</p>
            <p><strong>Total:</strong> {formatCurrency(calculateFinancials().total)}</p>
            </section>
            {/* LOG PAYMENT */}
            <section className="mb-6 text-left">
                <h2 className="text-xl font-semibold mb-2">Log Payment</h2>
                    <p className="text-gray-500 italic">
                        [Coming soon] Form will appear here to log and view payments.
                    </p>
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
