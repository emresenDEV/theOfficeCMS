import { useNavigate } from "react-router-dom"; 
import PropTypes from "prop-types";

const RelatedAccounts = ({ commissions }) => {
    const navigate = useNavigate();
    console.log("🔍 Received Commissions in RelatedAccounts:", commissions);

    if (!Array.isArray(commissions) || commissions.length === 0) {
        console.warn("⚠️ No commissions available.");
        return <p className="text-center text-gray-500">No commission data available.</p>;
    }

    // ✅ Group invoices by account while ensuring correct filtering
    const groupedAccounts = commissions.reduce((acc, com) => {
        const account = com?.invoice?.account;
        if (!account) return acc; // ✅ Skip if no account

        const accountId = account.account_id;

        if (!acc[accountId]) {
            acc[accountId] = {
                accountName: account.business_name || "Unknown Account",
                accountId: account.account_id,
                invoices: [],
            };
        }

        // ✅ Ensure invoices meet selected criteria (i.e., paid invoices)
        if (com.invoice?.paid) {
            acc[accountId].invoices.push({
                invoiceId: com.invoice.invoice_id ?? "N/A",
                finalTotal: com.invoice.final_total ? Number(com.invoice.final_total).toFixed(2) : "0.00",
                commissionAmount: com.commission_amount ? Number(com.commission_amount).toFixed(2) : "0.00",
                datePaid: com.invoice.date_paid
                    ? new Date(com.invoice.date_paid).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })
                    : "Not Paid",
            });
        }

        return acc;
    }, {});

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Related Accounts & Invoices</h2>
            {Object.keys(groupedAccounts).length > 0 ? (
                Object.values(groupedAccounts).map((account, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-white shadow-lg">
                        {/* ✅ Account Section with View Account Button */}
                        <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">
                                <button 
                                    onClick={() => navigate(`/accounts/details/${account.accountId}`)} 
                                    className="text-blue-600 underline"
                                >
                                    {account.accountName}
                                </button>
                            </h2>
                            <button
                                onClick={() => navigate(`/accounts/details/${account.accountId}`)}
                                className="px-3 py-1 bg-blue-500 text-white rounded shadow"
                            >
                                View Account
                            </button>
                        </div>
                        <hr className="my-2" />

                        {/* ✅ Invoice List */}
                        <div className="mt-2">
                            {account.invoices.length > 0 ? (
                                account.invoices.map((invoice, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 border-b">
                                        <div>
                                            <p className="text-sm font-medium text-left">
                                                Invoice{" "}
                                                <button 
                                                    onClick={() => navigate(`/invoice/${invoice.invoiceId}`)} 
                                                    className="text-blue-600 underline"
                                                >
                                                    #{invoice.invoiceId}
                                                </button>
                                            </p>
                                            <p className="text-gray-600 text-xs">
                                                <span className="font-semibold">Total:</span> ${invoice.finalTotal} |
                                                <span className="text-green-600 font-semibold"> Commission:</span> ${invoice.commissionAmount}
                                            </p>
                                            <p className="text-gray-500 text-xs text-left">
                                                <span className="font-semibold">Date Paid:</span> {invoice.datePaid}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/invoice/${invoice.invoiceId}`)}
                                            className="px-3 py-1 bg-gray-200 rounded shadow"
                                        >
                                            View Invoice
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No paid invoices available.</p>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">No commission data available.</p>
            )}
        </div>
    );
};

// ✅ Prop Validations
RelatedAccounts.propTypes = {
    commissions: PropTypes.arrayOf(
        PropTypes.shape({
            commission_id: PropTypes.number.isRequired,
            commission_amount: PropTypes.number.isRequired,
            invoice: PropTypes.shape({
                invoice_id: PropTypes.number,
                final_total: PropTypes.number,
                status: PropTypes.string,
                paid: PropTypes.bool,
                date_paid: PropTypes.string,
                account: PropTypes.shape({
                    account_id: PropTypes.number,
                    business_name: PropTypes.string,
                }),
            }),
        })
    ).isRequired,
};

export default RelatedAccounts;
