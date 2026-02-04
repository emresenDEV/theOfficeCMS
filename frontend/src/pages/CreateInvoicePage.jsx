import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAccountDetails } from "../services/accountService";
import { fetchSalesReps } from "../services/userService";
import { fetchServices } from "../services/servicesService";
import { createInvoice } from "../services/invoiceService";
import PropTypes from "prop-types";

const CreateInvoicePage = ({ user, setUser }) => {
const { accountId } = useParams();
const navigate = useNavigate();

const [account, setAccount] = useState(null);
const [salesReps, setSalesReps] = useState([]);
const [branch, setBranch] = useState(null);
const [selectedSalesRep, setSelectedSalesRep] = useState(null);
const [allServices, setAllServices] = useState([]);
const [selectedServices, setSelectedServices] = useState([]);
const [form, setForm] = useState({
    sales_rep_id: "",
    tax_rate: 0.08, // Default to 8%
    discount_percent: 0,
    due_date: "",
});

useEffect(() => {
    async function loadInitialData() {
    try {
        const acc = await fetchAccountDetails(accountId);
        setAccount(acc);
        setBranch(acc.branch || null);
        setForm((prev) => ({
        ...prev,
        tax_rate: acc.tax_rate ?? 0.08,
        sales_rep_id: user?.user_id || "",
        }));

        const reps = await fetchSalesReps();
        setSalesReps(reps);
        setSelectedSalesRep(reps.find(r => r.user_id === user?.user_id) || null);

        const services = await fetchServices();
        setAllServices(services);
    } catch (err) {
        console.error("❌ Error loading create invoice data:", err);
    }
    }
    loadInitialData();
}, [accountId, user]);

const handleAddService = () => {
    setSelectedServices([
    ...selectedServices,
    { service_id: "", quantity: 1, discount_percent: 0 },
    ]);
};

const handleServiceChange = (index, field, value) => {
    const updated = [...selectedServices];

    updated[index] = {
    ...updated[index],
    [field]:
        field === "discount_percent"
        ? parseFloat(value) / 100 || 0
        : field === "quantity"
        ? parseInt(value) || 1
        : value,
    };

    setSelectedServices(updated);
};




const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "sales_rep_id") {
    const selected = salesReps.find(rep => rep.user_id === parseInt(value));
    setSelectedSalesRep(selected || null);
    }
};

const calculateTotals = () => {
    let subtotal = 0;
    let serviceDiscount = 0;

    selectedServices.forEach((s) => {
    const found = allServices.find(svc => svc.service_id === parseInt(s.service_id));
    const price = found?.price_per_unit || 0;
    subtotal += price * s.quantity;
    serviceDiscount += price * s.quantity * (s.discount_percent || 0);
    });

    const invoiceDiscount = (subtotal - serviceDiscount) * form.discount_percent;
    const taxAmount = (subtotal - serviceDiscount - invoiceDiscount) * form.tax_rate;
    const final = subtotal - serviceDiscount - invoiceDiscount + taxAmount;

    return { subtotal, serviceDiscount, invoiceDiscount, taxAmount, final };
};

const handleSubmit = async (e) => {
    e.preventDefault();
    
        const invoicePayload = {
        account_id: parseInt(accountId),
        sales_rep_id: parseInt(form.sales_rep_id),
        tax_rate: form.tax_rate,
        discount_percent: form.discount_percent,
        due_date: form.due_date,
        services: selectedServices.map((s) => {
            const service = allServices.find((svc) => svc.service_id === parseInt(s.service_id));
            const price_per_unit = service?.price_per_unit || 0;
    
            return {
            service_id: parseInt(s.service_id),
            quantity: parseInt(s.quantity) || 1,
            discount_percent: s.discount_percent || 0,
            price_per_unit: price_per_unit,
            };
        }),
        actor_user_id: user?.user_id || null,
        actor_email: user?.email || null,
        };
    
        const res = await createInvoice(invoicePayload);
        if (res.success) {
            const storedUser = localStorage.getItem("user");
            if (!user && storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
            
                // Delay navigation until setUser is processed
                setTimeout(() => {
                    navigate(`/invoice/${res.invoice_id}`);
                }, 100);
                } else {
                navigate(`/invoice/${res.invoice_id}`);
                }
            }
            
    };


if (!account) return <p className="p-6 text-muted-foreground">Loading...</p>;

const totals = calculateTotals();

return (
    <div className="p-6 max-w-6xl mx-auto bg-card border border-border shadow-lg rounded-lg">
    <div className="flex justify-between mb-6">
        <button
        onClick={() => navigate(`/accounts/details/${accountId}`)}
        className="bg-muted text-foreground px-4 py-2 rounded hover:bg-secondary/80"
        >
        ← Back to Account
        </button>
        <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-left">
        {/* LEFT: Account Details */}
        <div>
        <h2 className="text-xl font-semibold mb-1">{account.business_name}</h2>
        <p>{account.address}</p>
        <p>{account.city}, {account.state} {account.zipcode}</p>
        <p>Tax Rate: {(form.tax_rate * 100).toFixed(2)}%</p>
        <br />
        <p><strong>Contact:</strong> {account.contact_name}</p>
        <p><strong>Phone:</strong> {account.phone_number}</p>
        <p><strong>Email:</strong> {account.email}</p>
        </div>

        {/* RIGHT: Sales Rep */}
        <div>
        <label className="block font-bold text-sm mb-1 text-right text-muted-foreground">Sales Representative</label>
        <select
            className="w-full border border-border bg-card text-foreground p-2 rounded mb-2 text-right"
            value={form.sales_rep_id}
            onChange={(e) => handleFormChange("sales_rep_id", e.target.value)}
        >
            <option value="">-- Select Rep --</option>
            {salesReps.map(rep => (
            <option key={rep.user_id} value={rep.user_id}>
                {rep.first_name} {rep.last_name}
            </option>
            ))}
        </select>

        {selectedSalesRep && (
            <div className="mt-2">
            <p><strong>Name:</strong> {selectedSalesRep.first_name} {selectedSalesRep.last_name}</p>
            <p><strong>Email:</strong> {selectedSalesRep.email}</p>
            </div>
        )}
        </div>
    </div>

    {/* SERVICES SECTION */}
    <section className="mb-6 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-left">Add Service</h2>
        <div className="grid grid-cols-6 font-bold text-sm mb-2 border-b pb-1">
        <p>Service</p>
        <p>Price Per Unit</p>
        <p>Quantity</p>
        <p>Discount%</p>
        <p>Discount Amt</p>
        <p>Total</p>
        </div>
        {selectedServices.map((s, i) => {
        const service = allServices.find(svc => svc.service_id === parseInt(s.service_id));
        const price = service?.price_per_unit || 0;
        const discountAmt = price * s.quantity * (s.discount_percent || 0);
        const total = price * s.quantity - discountAmt;

        return (
            <div key={i} className="grid grid-cols-6 gap-2 mb-2">
            <select
                className="border p-2 rounded"
                value={s.service_id}
                onChange={(e) => handleServiceChange(i, "service_id", e.target.value)}
            >
                <option value="">-- Select --</option>
                {allServices.map(svc => (
                <option key={svc.service_id} value={svc.service_id}>
                    {svc.service_name}
                </option>
                ))}
            </select>
            <p className="p-2 text-right">${price.toFixed(2)}</p>
                <input
                    type="number"
                    className="border p-2 rounded text-right"
                    min="1"
                    value={s.quantity}
                    onChange={(e) => handleServiceChange(i, "quantity", e.target.value)}            
                />
                {/* <input
                    type="number"
                    className="border p-2 rounded text-right"
                    min="1"
                    value={s.quantity === "" ? "" : s.quantity}
                    onChange={(e) => handleServiceChange(i, "quantity", e.target.value)}
                    onBlur={(e) => {
                        if (e.target.value === "") {
                        handleServiceChange(i, "quantity", 1);
                        }
                    }}
                    /> */}
            <div className="relative">
                <input
                    type="number"
                    className="border p-2 pr-8 rounded text-right w-full"
                    value={
                        typeof s.discount_percent === "number"
                        ? (s.discount_percent * 100).toFixed(0)
                        : ""
                    }
                    onChange={(e) =>
                        handleServiceChange(i, "discount_percent", e.target.value)
                    }
                />
                <span className="absolute right-2 top-2 text-muted-foreground">%</span>
            </div>


            <p className="p-2 text-right">${discountAmt.toFixed(2)}</p>
            <p className="p-2 text-right">${total.toFixed(2)}</p>
            </div>
        );
        })}
        <div className="flex justify-end mt-2">
        <button onClick={handleAddService} className="bg-blue-600 text-white px-4 py-2 rounded">
            + Add Service
        </button>
        </div>
    </section>

    {/* INVOICE SETTINGS */}
    <section className="mb-6 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-left">Invoice Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label className="block font-bold text-sm mb-1">Invoice Discount</label>
            <div className="relative">
                <input
                    type="number"
                    className="w-full border p-2 pr-8 rounded text-right"
                    value={isNaN(form.discount_percent) ? "" : (form.discount_percent * 100).toFixed(0)}
                    onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                        handleFormChange("discount_percent", "");
                    } else {
                        const num = parseFloat(raw);
                        handleFormChange("discount_percent", isNaN(num) ? "" : num / 100);
                    }
                    }}
                />
                <span className="absolute right-2 top-2 text-muted-foreground">%</span>
            </div>
        </div>
        <div>
            <label className="block font-bold text-sm mb-1">Due Date</label>
            <input
            type="date"
            className="w-full border p-2 rounded"
            value={form.due_date}
            onChange={(e) => handleFormChange("due_date", e.target.value)}
            />
        </div>
        </div>
    </section>

    {/* FINANCIAL SUMMARY */}
    <section className="mb-6 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-left">Financial Summary</h2>
            <p className="text-left"><strong>Service Total:</strong> ${totals.subtotal.toFixed(2)}</p>
            <p className="text-left"><strong>Service Discount:</strong> ${totals.serviceDiscount.toFixed(2)}</p>
            <p className="text-left"><strong>Invoice Discount:</strong> ${totals.invoiceDiscount.toFixed(2)}</p>
            <p className="text-left"><strong>Tax:</strong> ${totals.taxAmount.toFixed(2)}</p>
            <p className="font-bold text-lg text-left"><strong>Total:</strong> ${totals.final.toFixed(2)}</p>
    </section>


    {/* SAVE BUTTON */}
    <div className="flex justify-end">
        <button
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        onClick={handleSubmit}
        >
        Save Invoice
        </button>
    </div>
    </div>
);
};

CreateInvoicePage.propTypes = {
user: PropTypes.shape({
    user_id: PropTypes.number.isRequired,
    username: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
}).isRequired,
setUser: PropTypes.func.isRequired,
};

export default CreateInvoicePage;
