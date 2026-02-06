import PropTypes from "prop-types";
import { DollarSign, Users, FileText, Percent } from "lucide-react";
import { cn } from "../lib/utils";

const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

const SummaryCard = ({ title, value, helper, icon: Icon, accent, onClick }) => {
    const cardClass = cn(
        "w-full rounded-md border border-border bg-card p-4 shadow-card text-left transition",
        onClick && "cursor-pointer hover:shadow-lg hover:bg-muted/30"
    );

    const content = (
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                {helper && (
                    <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                )}
            </div>
            <div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md",
                    accent
                )}
            >
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClass}>
                {content}
            </button>
        );
    }

    return <div className={cardClass}>{content}</div>;
};

SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    helper: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    accent: PropTypes.string.isRequired,
    onClick: PropTypes.func,
};

const DashboardSummaryCards = ({
    totalRevenue,
    activeAccounts,
    openInvoices,
    currentCommission,
    onActiveAccountsClick,
    onOpenInvoicesClick,
    onCommissionClick,
}) => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
                title="Total Revenue"
                value={formatter.format(totalRevenue)}
                helper="Assigned accounts to date"
                icon={DollarSign}
                accent="bg-primary/10 text-primary"
            />
            <SummaryCard
                title="Active Accounts"
                value={activeAccounts.toString()}
                helper="Accounts assigned to you"
                icon={Users}
                accent="bg-info/10 text-info"
                onClick={onActiveAccountsClick}
            />
            <SummaryCard
                title="Open Invoices"
                value={openInvoices.toString()}
                helper="Pending or past due"
                icon={FileText}
                accent="bg-warning/15 text-warning"
                onClick={onOpenInvoicesClick}
            />
            <SummaryCard
                title="Commission (MTD)"
                value={formatter.format(currentCommission)}
                helper="Month-to-date"
                icon={Percent}
                accent="bg-success/15 text-success"
                onClick={onCommissionClick}
            />
        </div>
    );
};

DashboardSummaryCards.propTypes = {
    totalRevenue: PropTypes.number.isRequired,
    activeAccounts: PropTypes.number.isRequired,
    openInvoices: PropTypes.number.isRequired,
    currentCommission: PropTypes.number.isRequired,
    onActiveAccountsClick: PropTypes.func,
    onOpenInvoicesClick: PropTypes.func,
    onCommissionClick: PropTypes.func,
};

export default DashboardSummaryCards;
