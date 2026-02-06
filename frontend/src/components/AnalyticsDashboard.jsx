import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    BarChart,
    Bar,
} from "recharts";
import { fetchAnalyticsOverview } from "../services/analyticsService";
import { fetchUserProfile, fetchUsers } from "../services/userService";
import { PIPELINE_STAGE_MAP, PIPELINE_STAGES } from "../utils/pipelineStages";
import SalesChart from "./SalesChart";

const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
];

const rangeOptions = [
    { key: "day", label: "Day", days: 1 },
    { key: "week", label: "Week", days: 7 },
    { key: "month", label: "Month", days: 30 },
    { key: "quarter", label: "Quarter", days: 90 },
    { key: "year", label: "Year", days: 365 },
];

const formatCurrency = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(number);
};

const SummaryCard = ({ title, value, helper }) => (
    <div className="rounded-md border border-border bg-card p-4 shadow-card">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
);

SummaryCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    helper: PropTypes.string,
};

const ChartCard = ({ title, subtitle, children }) => (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
    </div>
);

ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    children: PropTypes.node.isRequired,
};

const AnalyticsDashboard = ({ user, adminView }) => {
    const [profile, setProfile] = useState(null);
    const [users, setUsers] = useState([]);
    const [repFilter, setRepFilter] = useState("all");
    const [range, setRange] = useState("year");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user?.id && !user?.user_id) return;
        const userId = user.user_id ?? user.id;
        fetchUserProfile(userId).then(setProfile);
    }, [user]);

    useEffect(() => {
        if (!adminView) return;
        fetchUsers().then(setUsers);
    }, [adminView]);

    const isAdmin = useMemo(() => {
        if (adminView) return true;
        const role = (profile?.role_name || "").toLowerCase();
        return role.includes("admin") || profile?.role_id === 1;
    }, [adminView, profile]);

    const dateParams = useMemo(() => {
        const selected = rangeOptions.find((option) => option.key === range);
        const days = selected?.days || 30;
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const toDate = end.toISOString().split("T")[0];
        const fromDate = start.toISOString().split("T")[0];
        return { dateFrom: fromDate, dateTo: toDate };
    }, [range]);

    useEffect(() => {
        if (!profile && !adminView) return;
        const scopedUserId = isAdmin ? null : (profile?.user_id ?? user?.user_id ?? user?.id);
        const scopedRepId = isAdmin && repFilter !== "all" ? Number(repFilter) : null;

        setLoading(true);
        fetchAnalyticsOverview({
            userId: scopedUserId,
            salesRepId: scopedRepId,
            dateFrom: dateParams.dateFrom,
            dateTo: dateParams.dateTo,
        }).then((response) => {
            if (!response) {
                setError("Analytics data unavailable. Restart Flask or check the /analytics endpoint.");
                setData(null);
            } else {
                setError("");
                setData(response);
            }
            setLoading(false);
        });
    }, [adminView, isAdmin, profile, repFilter, dateParams, user]);

    const pipelineData = useMemo(() => {
        if (!data?.pipeline) return [];
        const stageMap = new Map(data.pipeline.map((row) => [row.stage, row]));
        return PIPELINE_STAGES.map((stage) => ({
            name: PIPELINE_STAGE_MAP[stage.key]?.label || stage.label,
            value: stageMap.get(stage.key)?.count || 0,
            amount: stageMap.get(stage.key)?.amount || 0,
        })).filter((row) => row.value > 0);
    }, [data]);

    if (!profile && !adminView) {
        return <p className="px-4 py-4 text-muted-foreground sm:px-6 sm:py-6">Loading analytics...</p>;
    }

    if (loading) {
        return <p className="px-4 py-4 text-muted-foreground sm:px-6 sm:py-6">Loading analytics...</p>;
    }
    if (error) {
        return (
            <div className="px-4 py-4 text-sm text-rose-500 sm:px-6 sm:py-6">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="p-4 sm:p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
                        <p className="text-sm text-muted-foreground">
                            Sales performance, pipeline health, and relationship activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {rangeOptions.map((option) => (
                            <button
                                key={option.key}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    range === option.key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                }`}
                                onClick={() => setRange(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                        {isAdmin && (
                            <select
                                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground"
                                value={repFilter}
                                onChange={(e) => setRepFilter(e.target.value)}
                            >
                                <option value="all">All reps</option>
                                {users.map((rep) => (
                                    <option key={rep.user_id} value={rep.user_id}>
                                        {rep.first_name} {rep.last_name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Revenue (Range)"
                        value={formatCurrency(data?.summary?.revenue)}
                        helper={`${data?.date_range?.from} → ${data?.date_range?.to}`}
                    />
                    <SummaryCard
                        title="Open AR"
                        value={formatCurrency(data?.summary?.open_invoice_amount)}
                        helper={`${data?.summary?.open_invoices || 0} open invoices`}
                    />
                    <SummaryCard
                        title="Past Due"
                        value={formatCurrency(data?.summary?.past_due_amount)}
                        helper="Outstanding past due balance"
                    />
                    <SummaryCard
                        title="Avg Days to Pay"
                        value={`${data?.summary?.avg_days_to_pay || 0} days`}
                        helper={`${data?.summary?.active_accounts || 0} active accounts`}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <ChartCard
                        title="Pipeline Distribution"
                        subtitle="Invoice count by stage"
                    >
                        {pipelineData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pipeline data in this range.</p>
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pipelineData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={3}
                                        >
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                color: "hsl(var(--foreground))",
                                            }}
                                        />
                                        <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard
                        title="Payments Trend"
                        subtitle={`Bucketed by ${data?.bucket || "range"}`}
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.payments_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            color: "hsl(var(--foreground))",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="hsl(var(--chart-1))"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <ChartCard
                        title="Contact Interactions"
                        subtitle={`Logged interactions (${data?.bucket || "range"} buckets)`}
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.interactions_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            color: "hsl(var(--foreground))",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Interaction Types"
                        subtitle="Calls, emails, followups"
                    >
                        {data?.interaction_types?.length ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.interaction_types.map((row) => ({
                                                name: row.type,
                                                value: row.count,
                                            }))}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={50}
                                            outerRadius={90}
                                            paddingAngle={2}
                                        >
                                            {data.interaction_types.map((row, index) => (
                                                <Cell key={row.type} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                color: "hsl(var(--foreground))",
                                            }}
                                        />
                                        <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No interaction activity in this range.</p>
                        )}
                    </ChartCard>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <ChartCard title="Tasks Overview" subtitle="Created vs completed">
                        <div className="space-y-3 text-sm text-foreground">
                            <div className="flex items-center justify-between">
                                <span>Created</span>
                                <span className="font-semibold">{data?.tasks?.created || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Completed</span>
                                <span className="font-semibold">{data?.tasks?.completed || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Overdue</span>
                                <span className="font-semibold text-rose-500">{data?.tasks?.overdue || 0}</span>
                            </div>
                        </div>
                    </ChartCard>

                    <ChartCard title="Contact Health" subtitle="Opt-outs & totals">
                        <div className="space-y-3 text-sm text-foreground">
                            <div className="flex items-center justify-between">
                                <span>Total contacts</span>
                                <span className="font-semibold">{data?.contacts?.total || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Do not call</span>
                                <span className="font-semibold text-amber-500">{data?.contacts?.do_not_call || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Email opt-out</span>
                                <span className="font-semibold text-rose-500">{data?.contacts?.email_opt_out || 0}</span>
                            </div>
                        </div>
                    </ChartCard>

                    <ChartCard title="Top Contacts" subtitle="Most active this range">
                        {data?.contacts?.top_contacts?.length ? (
                            <div className="space-y-3 text-sm text-foreground">
                                {data.contacts.top_contacts.map((contact) => (
                                    <div key={contact.contact_id} className="flex items-center justify-between">
                                        <span className="truncate">{contact.name}</span>
                                        <span className="font-semibold">{contact.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No contact activity yet.</p>
                        )}
                    </ChartCard>
                </div>

                {isAdmin && data?.overdue_by_rep?.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
                        <h3 className="text-base font-semibold text-foreground">Overdue Tasks by Rep</h3>
                        <div className="mt-3 overflow-x-auto">
                            <table className="min-w-[360px] w-full text-sm">
                                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Rep</th>
                                        <th className="px-3 py-2 text-right">Overdue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.overdue_by_rep.map((row) => (
                                        <tr key={row.user_id} className="hover:bg-muted/40">
                                            <td className="px-3 py-2 text-foreground">{row.name}</td>
                                            <td className="px-3 py-2 text-right text-foreground">{row.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {profile && <SalesChart userProfile={profile} />}
            </div>
        </div>
    );
};

AnalyticsDashboard.propTypes = {
    user: PropTypes.object,
    adminView: PropTypes.bool,
};

AnalyticsDashboard.defaultProps = {
    adminView: false,
};

export default AnalyticsDashboard;
