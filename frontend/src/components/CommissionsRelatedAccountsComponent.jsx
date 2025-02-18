

const RelatedAccounts = ({ commissions }) => {
    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Related Accounts & Invoices</h2>
            {commissions.length > 0 ? (
                commissions.map((com, index) => {
                    const invoice = com.invoice ?? {};
                    const account = invoice.account ?? {};
                    return (
                        <div
                            key={index}
                            className="border rounded-lg p-4 mb-4 bg-white shadow flex justify-between items-center"
                        >
                            <div>
                                <h2 className="text-lg font-bold">
                                    <a
                                        href={`/account/${account.account_id}`}
                                        className="text-blue-600 underline"
                                    >
                                        {account.business_name || "Unknown"}
                                    </a>
                                </h2>
                                <hr className="my-2" />
                                <p>
                                    Invoice
                                    <a
                                        href={`/invoice/${invoice.invoice_id}`}
                                        className="text-blue-600 underline"
                                    >
                                        #{invoice.invoice_id || "N/A"}
                                    </a>
                                    - ${com.commission_amount ? com.commission_amount.toFixed(2) : "0.00"}
                                </p>
                            </div>
                            <div>
                                <a
                                    href={`/invoice/${invoice.invoice_id}`}
                                    className="px-3 py-1 bg-gray-200 rounded shadow"
                                >
                                    View Invoice
                                </a>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500">No commission data available.</p>
            )}
        </div>
    );
};