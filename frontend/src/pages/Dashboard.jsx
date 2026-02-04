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
                    <div className="bg-card p-6 rounded-lg w-full max-w-3xl shadow-lg">
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
