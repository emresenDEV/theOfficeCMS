import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { formatDateInTimeZone } from "../utils/timezone";

const RelatedAccounts = ({ commissions }) => {
    const navigate = useNavigate();
    console.log("🔍 Received Commissions in RelatedAccounts:", commissions);

    if (!Array.isArray(commissions) || commissions.length === 0) {
        console.warn("⚠️ No commissions available.");
        return <p className="text-center text-muted-foreground">No commission data available.</p>;
    }

    //  Group invoices by account
    const groupedAccounts = commissions.reduce((acc, com) => {
        const account = com?.invoice?.account;
        if (!account || !com.date_paid) return acc;

        const accountId = account.account_id;
        if (!acc[accountId]) {
            acc[accountId] = {
                accountName: account.business_name || "Unknown Account",
                accountId,
                invoices: [],
                totalCommission: 0,
            };
        }

        const commissionAmount = Number(com.commission_amount || 0);

        acc[accountId].invoices.push({
            invoiceId: com.invoice.invoice_id ?? "N/A",
            finalTotal: com.invoice.final_total ? Number(com.invoice.final_total).toFixed(2) : "0.00",
            commissionAmount: commissionAmount.toFixed(2),
            datePaid: com.date_paid
                ? formatDateInTimeZone(com.date_paid, null, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })
                : "Not Paid",
            rawDate: com.date_paid,
        });

        acc[accountId].totalCommission += commissionAmount;
        return acc;
    }, {});

    // Sort invoices newest first
    Object.values(groupedAccounts).forEach(account => {
        account.invoices.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
    });

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Related Accounts & Invoices</h2>
            {Object.keys(groupedAccounts).length > 0 ? (
                Object.values(groupedAccounts).map((account, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 mb-4 bg-card shadow-lg">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">
                                <button 
                                    onClick={() => navigate(`/accounts/details/${account.accountId}`)} 
                                    className="text-primary underline"
                                >
                                    {account.accountName}
                                </button>
                            </h2>
                            <button
                                onClick={() => navigate(`/accounts/details/${account.accountId}`)}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded shadow"
                            >
                                View Account
                            </button>
                        </div>

                        <p className="mt-1 text-green-700 text-sm font-semibold text-right">
                            Total Commissions Earned: ${account.totalCommission.toFixed(2)}
                        </p>

                        <hr className="my-2" />

                        <div className="mt-2">
                            {account.invoices.length > 0 ? (
                                account.invoices.map((invoice, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border-b">
                                        <div>
                                            <p className="text-sm font-medium text-left">
                                                Invoice{" "}
                                                <button 
                                                    onClick={() => navigate(`/invoice/${invoice.invoiceId}`)} 
                                                    className="text-primary underline"
                                                >
                                                    #{invoice.invoiceId}
                                                </button>
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                <span className="font-semibold">Total:</span> ${invoice.finalTotal} |
                                                <span className="text-green-600 font-semibold"> Commission:</span> ${invoice.commissionAmount}
                                            </p>
                                            <p className="text-muted-foreground text-xs text-left">
                                                <span className="font-semibold">Date Paid:</span> {invoice.datePaid}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/invoice/${invoice.invoiceId}`)}
                                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded shadow"
                                        >
                                            View Invoice
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground">No paid invoices available.</p>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground">No commission data available.</p>
            )}
        </div>
    );
};

RelatedAccounts.propTypes = {
    commissions: PropTypes.arrayOf(
        PropTypes.shape({
            commission_id: PropTypes.number.isRequired,
            commission_amount: PropTypes.number.isRequired,
            date_paid: PropTypes.string,
            payment_id: PropTypes.number,
            invoice_id: PropTypes.number,
            invoice: PropTypes.shape({
                invoice_id: PropTypes.number.isRequired,
                final_total: PropTypes.number,
                status: PropTypes.string,
                date_paid: PropTypes.string,
                account: PropTypes.shape({
                    account_id: PropTypes.number.isRequired,
                    business_name: PropTypes.string.isRequired,
                }).isRequired,
            }).isRequired,
        })
    ).isRequired,
};

export default RelatedAccounts;
