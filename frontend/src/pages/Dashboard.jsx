import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TasksComponent from "../components/TaskComponent";
import AccountsTable from "../components/AccountsTable";
import CreateCalendarEvent from "../components/CreateCalendarEvent";
import CalendarMobileMini from "../components/CalendarMobileMini";
import TasksMobileMini from "../components/TasksMobileMini";
import AccountsMobileMini from "../components/AccountsMobileMini";
import EventDetailsModal from "../components/EventDetailsModal";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardCalendarSection } from "../components/DashboardCalendarSection";
import DashboardSummaryCards from "../components/DashboardSummaryCards";
import { fetchCalendarEvents } from "../services/calendarService";
import { fetchTasks } from "../services/tasksService";
import { fetchUserProfile } from "../services/userService";
import { fetchAssignedAccounts, fetchAccountMetrics } from "../services/accountService";
import { fetchInvoices } from "../services/invoiceService";
import { fetchCurrentMonthCommissions } from "../services/commissionsService";
import { fetchPipelineSummary } from "../services/pipelineService";
import { PIPELINE_STAGES, PIPELINE_STAGE_MAP } from "../utils/pipelineStages";
import PipelineStatusBar from "../components/PipelineStatusBar";
import PropTypes from "prop-types";

const Dashboard = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        activeAccounts: 0,
        openInvoices: 0,
        currentCommission: 0,
    });
    const [pipelineSummary, setPipelineSummary] = useState([]);
    const [pipelineRange, setPipelineRange] = useState("month");
    const navigate = useNavigate();

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Sales performance moved to Analytics

    const refreshDashboardData = useCallback(async (userId) => {
        setLoading(true);
        try {
            // Fetch sequentially to avoid overwhelming Cloudflare tunnel
            const tasksData = await fetchTasks(userId);
            setTasks(tasksData);

            const eventsData = await fetchCalendarEvents(userId);
            setEvents(eventsData);
        } catch (error) {
            console.error("❌ Error refreshing dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user || !user.id) return;

        async function loadUserProfile() {
            const profile = await fetchUserProfile(user.id);
            if (profile) {
                console.log("✅ Full User Profile in Dashboard:", profile); //debugging

                if (!profile.branch_id) {
                    console.warn("⚠️ API Response Missing `branch_id`! Check Backend Response."); //debugging
                }

                setUserData(profile);
            }
        }

        loadUserProfile();
    }, [user]);

    useEffect(() => {
        if (!userData || !userData.branch_id) {
            return;
        }

        console.log("📢 Passing `userData` to `SalesChart` (before rendering):", userData); //debugging
        refreshDashboardData(userData.user_id);

        async function fetchData() {
            setLoading(true);
            try {
                // Fetch sequentially to avoid overwhelming Cloudflare tunnel
                const tasksData = await fetchTasks(userData.user_id);
                setTasks(tasksData);

                const eventsData = await fetchCalendarEvents(userData.user_id);
                console.log("📅 Events fetched from API:", eventsData);
                if (eventsData && eventsData.length > 0) {
                    console.log("📅 First event sample:", eventsData[0]);
                }
                setEvents(eventsData);
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [userData, refreshDashboardData]);

    useEffect(() => {
        if (!userData || !userData.user_id) return;

        async function loadSummary() {
            try {
                const [metrics, accounts, invoices, commissions] = await Promise.all([
                    fetchAccountMetrics(userData.user_id),
                    fetchAssignedAccounts(userData.user_id),
                    fetchInvoices(userData.user_id),
                    fetchCurrentMonthCommissions(userData.user_id),
                ]);

                const totalRevenue = Array.isArray(metrics)
                    ? metrics.reduce((sum, item) => sum + (item.total_revenue || 0), 0)
                    : 0;

                const openInvoices = Array.isArray(invoices)
                    ? invoices.filter((inv) => {
                        const status = (inv.status || "").toLowerCase();
                        return status && status !== "paid";
                    }).length
                    : 0;

                setSummary({
                    totalRevenue,
                    activeAccounts: Array.isArray(accounts) ? accounts.length : 0,
                    openInvoices,
                    currentCommission: commissions?.total_commissions || 0,
                });
            } catch (error) {
                console.error("❌ Error loading dashboard summary:", error);
            }
        }

        loadSummary();
    }, [userData]);

    const getPipelineDateRange = (range) => {
        const now = new Date();
        let start = new Date(now);
        if (range === "day") {
            start.setHours(0, 0, 0, 0);
        } else if (range === "week") {
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
        } else if (range === "month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (range === "quarter") {
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), quarterStart, 1);
        } else if (range === "year") {
            start = new Date(now.getFullYear(), 0, 1);
        }
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const fmt = (date) => date.toISOString().split("T")[0];
        return {
            date_from: fmt(start),
            date_to: fmt(end),
        };
    };

    useEffect(() => {
        if (!userData?.user_id) return;
        async function loadPipelineSummary() {
            const range = getPipelineDateRange(pipelineRange);
            const data = await fetchPipelineSummary(userData.user_id, {
                date_from: range.date_from,
                date_to: range.date_to,
                date_field: "created",
            });
            setPipelineSummary(Array.isArray(data) ? data : []);
        }
        loadPipelineSummary();
    }, [userData, pipelineRange]);

    if (!userData) {
        return <p className="text-center text-muted-foreground">Loading user profile...</p>;
    }

    if (loading) {
        return <p className="text-center text-muted-foreground">Loading dashboard...</p>;
    }

    const handleRefreshTasks = async () => {
        const updatedTasks = await fetchTasks(userData.user_id);
        setTasks(updatedTasks);
    };

    const pipelineSummaryMap = pipelineSummary.reduce((acc, item) => {
        acc[item.stage] = item;
        return acc;
    }, {});

    const topStage = PIPELINE_STAGES.reduce((best, stage) => {
        const count = pipelineSummaryMap[stage.key]?.invoice_count || 0;
        if (!best || count > (pipelineSummaryMap[best.key]?.invoice_count || 0)) return stage;
        return best;
    }, null);

    return (
        <div className="w-full">
            <div className="flex-1 p-4 sm:p-6 space-y-6">
                <DashboardHeader
                    userName={`${userData.first_name} ${userData.last_name}`}
                    roleName={userData.role_name || "Sales"}
                />

                <DashboardSummaryCards
                    totalRevenue={summary.totalRevenue}
                    activeAccounts={summary.activeAccounts}
                    openInvoices={summary.openInvoices}
                    currentCommission={summary.currentCommission}
                />

                <div className="rounded-lg border border-border bg-card p-5 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Pipeline Snapshot</h2>
                            <p className="text-xs text-muted-foreground">Invoices by current pipeline stage.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                                onClick={() => navigate("/pipelines")}
                            >
                                Open Pipeline
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {[
                            { key: "day", label: "Day" },
                            { key: "week", label: "Week" },
                            { key: "month", label: "Month" },
                            { key: "quarter", label: "Quarter" },
                            { key: "year", label: "Year" },
                        ].map((range) => (
                            <button
                                key={range.key}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    pipelineRange === range.key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                }`}
                                onClick={() => setPipelineRange(range.key)}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-border bg-background p-4">
                        <PipelineStatusBar currentStage={topStage?.key || "order_placed"} compact />
                        <div className="mt-4 overflow-x-auto">
                            <div className="grid min-w-[980px] grid-cols-7 gap-2">
                                {PIPELINE_STAGES.map((stage) => (
                                    <button
                                        key={stage.key}
                                        className="rounded-md border border-border p-3 text-left transition hover:bg-muted/60"
                                        onClick={() => navigate(`/pipelines?stage=${stage.key}`)}
                                    >
                                        <p className="text-[11px] uppercase text-muted-foreground">
                                            {PIPELINE_STAGE_MAP[stage.key]?.label || stage.label}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-foreground">
                                            {pipelineSummaryMap[stage.key]?.invoice_count || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {pipelineSummaryMap[stage.key]?.account_count || 0} accounts
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🏢 Accounts - Mobile vs Desktop */}
                {isMobile ? (
                    <AccountsMobileMini user={userData} />
                ) : (
                    <AccountsTable user={userData} />
                )}

                {/* Calendar + Tasks */}
                {isMobile ? (
                    <>
                        <CalendarMobileMini
                            events={events}
                            onEventClick={(event) => {
                                setSelectedEvent(event);
                                setShowEventDetailsModal(true);
                            }}
                            onCreateEvent={(date) => {
                                setSelectedDate(date);
                                setShowCreateModal(true);
                            }}
                        />
                        <TasksMobileMini
                            tasks={tasks}
                            user={userData}
                            refreshTasks={handleRefreshTasks}
                        />
                    </>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <DashboardCalendarSection
                            events={events}
                            onAddEvent={(date) => {
                                setSelectedDate(date);
                                setShowCreateModal(true);
                            }}
                            onDateSelect={(date) => {
                                if (!date) return;
                                const formatted = date.toISOString().split("T")[0];
                                navigate(`/calendar?date=${formatted}`);
                            }}
                            onEventClick={(event) => {
                                setSelectedEvent(event);
                                setShowEventDetailsModal(true);
                            }}
                        />
                        <TasksComponent
                            tasks={tasks}
                            user={userData}
                            refreshTasks={handleRefreshTasks}
                        />
                    </div>
                )}
            </div>
            {/* EVENT DETAILS MODAL - Mobile */}
            <EventDetailsModal
                event={selectedEvent}
                isOpen={showEventDetailsModal}
                onClose={() => {
                    setShowEventDetailsModal(false);
                    setSelectedEvent(null);
                }}
                onRefresh={() => {
                    refreshDashboardData(userData?.user_id);
                }}
            />

            {/* MODAL FOR CREATE EVENT */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-card p-4 sm:p-6 rounded-lg w-full max-w-3xl shadow-lg">
                        <CreateCalendarEvent
                            userId={userData.user_id}
                            setEvents={setEvents}
                            closeForm={() => {
                                setShowCreateModal(false);
                                setSelectedDate(null);
                            }}
                            refreshDashboardData={refreshDashboardData}
                            selectedDate={selectedDate}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

Dashboard.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
    }).isRequired,
};

export default Dashboard;
