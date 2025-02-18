import PropTypes from "prop-types";

const RelatedAccounts = ({ commissions }) => {
    // ✅ Group invoices by account
    const groupedAccounts = commissions.reduce((acc, com) => {
        const account = com.invoice?.account || {};
        const accountId = account.account_id || "unknown";

        if (!acc[accountId]) {
            acc[accountId] = {
                accountName: account.business_name || "Unknown Account",
                accountId: account.account_id,
                invoices: [],
            };
        }

        acc[accountId].invoices.push({
            invoiceId: com.invoice?.invoice_id || "N/A",
            finalTotal: com.invoice?.final_total || 0,
            commissionAmount: com.commission_amount || 0,
        });

        return acc;
    }, {});

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Related Accounts & Invoices</h2>
            {Object.keys(groupedAccounts).length > 0 ? (
                Object.values(groupedAccounts).map((account, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4 bg-white shadow-lg">
                        {/* Account Section */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">
                                <a href={`/account/${account.accountId}`} className="text-blue-600 underline">
                                    {account.accountName}
                                </a>
                            </h2>
                            <a
                                href={`/account/${account.accountId}`}
                                className="px-3 py-1 bg-blue-500 text-white rounded shadow"
                            >
                                View Account
                            </a>
                        </div>
                        <hr className="my-2" />

                        {/* Invoice List */}
                        <div className="mt-2">
                            {account.invoices.map((invoice, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 border-b">
                                    <div>
                                        <p className="text-sm font-medium">
                                            Invoice{" "}
                                            <a href={`/invoice/${invoice.invoiceId}`} className="text-blue-600 underline">
                                                #{invoice.invoiceId}
                                            </a>
                                        </p>
                                        <p className="text-gray-600 text-xs">
                                            Total: <span className="font-semibold">${invoice.finalTotal.toFixed(2)}</span> |
                                            Commission: <span className="text-green-600 font-semibold">${invoice.commissionAmount.toFixed(2)}</span>
                                        </p>
                                    </div>
                                    <a
                                        href={`/invoice/${invoice.invoiceId}`}
                                        className="px-3 py-1 bg-gray-200 rounded shadow"
                                    >
                                        View Invoice
                                    </a>
                                </div>
                            ))}
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
