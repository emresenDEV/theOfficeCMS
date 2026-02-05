import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatDateInTimeZone } from "../utils/timezone";
import { fetchInvoices, fetchPaymentMethods, logInvoicePayment } from "../services/invoiceService";
import { fetchAccounts } from "../services/accountService";
import { fetchSalesReps } from "../services/userService";
import { fetchPayments } from "../services/paymentService";

const PaymentsPage = ({ user }) => {
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("All");
    const [salesRepFilter, setSalesRepFilter] = useState(user?.user_id ? String(user.user_id) : "All");
    const [formState, setFormState] = useState({
        invoice_id: "",
        account_id: "",
        sales_rep_id: "",
        payment_method: "",
        last_four_payment_method: "",
        total_paid: "",
    });

    const invoiceMap = useMemo(() => new Map(invoices.map((inv) => [inv.invoice_id, inv])), [invoices]);
    const accountMap = useMemo(() => new Map(accounts.map((acc) => [acc.account_id, acc])), [accounts]);

    const invoiceStatusOptions = useMemo(() => {
        const unique = Array.from(new Set(invoices.map((inv) => inv.status).filter(Boolean))).sort();
        return ["All", ...unique];
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        let filtered = invoices;
        if (invoiceStatusFilter !== "All") {
            filtered = filtered.filter((inv) => inv.status === invoiceStatusFilter);
        }
        if (salesRepFilter !== "All") {
            filtered = filtered.filter(
                (inv) => String(inv.sales_rep_id) === String(salesRepFilter)
            );
        }
        return filtered;
    }, [invoices, invoiceStatusFilter, salesRepFilter]);

    useEffect(() => {
        if (!formState.invoice_id) return;
        const stillVisible = filteredInvoices.some(
            (inv) => String(inv.invoice_id) === String(formState.invoice_id)
        );
        if (!stillVisible) {
            setFormState((prev) => ({
                ...prev,
                invoice_id: "",
                account_id: "",
                sales_rep_id: "",
            }));
        }
    }, [filteredInvoices, formState.invoice_id]);

    useEffect(() => {
        const load = async () => {
            const [invoiceList, methodList, accountList, salesRepList] = await Promise.all([
                fetchInvoices(),
                fetchPaymentMethods(),
                fetchAccounts(),
                fetchSalesReps(),
            ]);
            setInvoices(invoiceList);
            setPaymentMethods(methodList);
            setAccounts(accountList);
            setSalesReps(salesRepList);
        };
        load();
    }, [user.user_id]);

    const refreshPayments = async (repFilter = salesRepFilter) => {
        const params = repFilter === "All" ? {} : { sales_rep_id: Number(repFilter) };
        const paymentList = await fetchPayments(params);
        setPayments(paymentList);
    };

    useEffect(() => {
        refreshPayments(salesRepFilter);
    }, [salesRepFilter]);

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        if (!formState.invoice_id) return;

        await logInvoicePayment(Number(formState.invoice_id), {
            invoice_id: Number(formState.invoice_id),
            account_id: Number(formState.account_id),
            sales_rep_id: Number(formState.sales_rep_id),
            logged_by: user.username,
            payment_method: Number(formState.payment_method),
            last_four_payment_method: formState.last_four_payment_method || null,
            total_paid: Number(formState.total_paid || 0),
            actor_user_id: user.user_id,
            actor_email: user.email,
        });

        setFormState({
            invoice_id: "",
            account_id: "",
            sales_rep_id: "",
            payment_method: "",
            last_four_payment_method: "",
            total_paid: "",
        });
        refreshPayments();
    };

    return (
        <div className="w-full">
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
                    <p className="text-sm text-muted-foreground">
                        Log payments and apply them to invoices.
                    </p>
                </div>

                <form onSubmit={handleCreatePayment} className="rounded-md border border-border bg-card p-4 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground">Log a Payment</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <select
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={invoiceStatusFilter}
                            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                        >
                            {invoiceStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status} invoices
                                </option>
                            ))}
                        </select>
                        <select
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={salesRepFilter}
                            onChange={(e) => setSalesRepFilter(e.target.value)}
                        >
                            <option value="All">All sales reps</option>
                            {salesReps.map((rep) => (
                                <option key={rep.user_id} value={rep.user_id}>
                                    {rep.first_name} {rep.last_name}
                                    {rep.user_id === user.user_id ? " (Me)" : ""}
                                </option>
                            ))}
                            {!salesReps.some((rep) => rep.user_id === user.user_id) && (
                                <option value={String(user.user_id)}>My invoices</option>
                            )}
                        </select>
                        <select
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={formState.invoice_id}
                            onChange={(e) => {
                                const invoiceId = e.target.value;
                                const invoice = invoiceMap.get(Number(invoiceId));
                                setFormState((prev) => ({
                                    ...prev,
                                    invoice_id: invoiceId,
                                    account_id: invoice ? invoice.account_id : "",
                                    sales_rep_id: invoice ? invoice.sales_rep_id : "",
                                }));
                            }}
                            required
                        >
                            <option value="">Select invoice</option>
                            {filteredInvoices.map((inv) => {
                                const accountName =
                                    accountMap.get(inv.account_id)?.business_name || `Account ${inv.account_id}`;
                                const dueDate = inv.due_date ? formatDateInTimeZone(inv.due_date, user, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }) : "No due date";
                                return (
                                    <option key={inv.invoice_id} value={inv.invoice_id}>
                                        #{inv.invoice_id} • {accountName} • {inv.status} • Due {dueDate}
                                    </option>
                                );
                            })}
                        </select>
                        <select
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            value={formState.payment_method}
                            onChange={(e) => setFormState({ ...formState, payment_method: e.target.value })}
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
                            value={formState.last_four_payment_method}
                            onChange={(e) => setFormState({ ...formState, last_four_payment_method: e.target.value })}
                            maxLength={4}
                        />
                        <input
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                            placeholder="Amount"
                            value={formState.total_paid}
                            onChange={(e) => setFormState({ ...formState, total_paid: e.target.value })}
                            required
                        />
                    </div>
                    <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                        Log Payment
                    </button>
                </form>

                <div className="rounded-md border border-border bg-card p-4 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Invoice
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
                                            {payment.payment_method_name || "—"}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            ${Number(payment.total_paid || 0).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {payment.date_paid
                                                ? formatDateInTimeZone(payment.date_paid, user, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

PaymentsPage.propTypes = {
    user: PropTypes.shape({
        user_id: PropTypes.number.isRequired,
        username: PropTypes.string,
        email: PropTypes.string,
    }).isRequired,
};

export default PaymentsPage;
