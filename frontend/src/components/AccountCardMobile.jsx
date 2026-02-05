import { formatDateInTimeZone } from "../utils/timezone";
import PropTypes from "prop-types";

const AccountCardMobile = ({ account, onViewAccount }) => {
    return (
        <button
            onClick={() => onViewAccount(account.account_id)}
            className="w-full border rounded-lg p-4 bg-card hover:bg-muted/60 transition text-left"
        >
            {/* Business Name - Clickable Button Style */}
            <h2 className="text-base font-semibold text-primary hover:text-primary/80 mb-3">
                {account.business_name}
            </h2>

            {/* Stacked Information */}
            <div className="space-y-2 text-sm">
                {/* Contact Name */}
                <div>
                    <span className="font-medium text-muted-foreground">Contact:</span>
                    <span className="text-muted-foreground ml-2">{account.contact_name}</span>
                </div>

                {/* Phone Number */}
                <div>
                    <span className="font-medium text-muted-foreground">Phone:</span>
                    <span className="text-muted-foreground ml-2">{account.phone_number}</span>
                </div>

                {/* Industry (if available) */}
                {account.industry && (
                    <div>
                        <span className="font-medium text-muted-foreground">Industry:</span>
                        <span className="text-muted-foreground ml-2">{account.industry}</span>
                    </div>
                )}

                {/* Revenue (if available) */}
                {account.revenue && (
                    <div>
                        <span className="font-medium text-muted-foreground">Revenue:</span>
                        <span className="text-muted-foreground ml-2">
                            ${parseInt(account.revenue).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Last Invoice Date (if available) */}
                {account.last_invoice_date && (
                    <div>
                        <span className="font-medium text-muted-foreground">Last Invoice:</span>
                        <span className="text-muted-foreground ml-2">
                            {formatDateInTimeZone(account.last_invoice_date, null, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                )}

                {/* Sales Representative */}
                {account.sales_rep ? (
                    <div>
                        <span className="font-medium text-muted-foreground">Sales Rep:</span>
                        <span className="text-muted-foreground ml-2">
                            {account.sales_rep.first_name} {account.sales_rep.last_name}
                        </span>
                    </div>
                ) : (
                    <div>
                        <span className="font-medium text-muted-foreground">Sales Rep:</span>
                        <span className="text-muted-foreground ml-2">Unassigned</span>
                    </div>
                )}

                {/* Task Count (if available) */}
                {typeof account.task_count !== "undefined" && (
                    <div>
                        <span className="font-medium text-muted-foreground">Tasks:</span>
                        <span className="text-muted-foreground ml-2">{account.task_count}</span>
                    </div>
                )}
            </div>

            {/* View Account Arrow Indicator */}
            <div className="mt-3 text-blue-600 text-xs font-medium flex items-center">
                View Details →
            </div>
        </button>
    );
};

AccountCardMobile.propTypes = {
    account: PropTypes.shape({
        account_id: PropTypes.number.isRequired,
        business_name: PropTypes.string.isRequired,
        contact_name: PropTypes.string,
        phone_number: PropTypes.string,
        industry: PropTypes.string,
        revenue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        last_invoice_date: PropTypes.string,
        sales_rep: PropTypes.shape({
            first_name: PropTypes.string,
            last_name: PropTypes.string,
        }),
        task_count: PropTypes.number,
    }).isRequired,
    onViewAccount: PropTypes.func.isRequired,
};

export default AccountCardMobile;
