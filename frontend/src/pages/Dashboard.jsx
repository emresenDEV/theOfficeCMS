import { useEffect, useState, useCallback } from "react";
import SalesChart from "../components/SalesChart";
import TasksComponent from "../components/TaskComponent";
import AccountsTable from "../components/AccountsTable";
import CreateCalendarEvent from "../components/CreateCalendarEvent";
import DashboardSalesChartMobile from "../components/DashboardSalesChartMobile";
import CalendarMobileMini from "../components/CalendarMobileMini";
import TasksMobileMini from "../components/TasksMobileMini";
import AccountsMobileMini from "../components/AccountsMobileMini";
import EventDetailsModal from "../components/EventDetailsModal";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardCalendarSection } from "../components/DashboardCalendarSection";
import { fetchCalendarEvents } from "../services/calendarService";
import { fetchTasks } from "../services/tasksService";
import { fetchUserProfile } from "../services/userService";
import { fetchUsers } from "../services/userService";
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
    const [allSalesReps, setAllSalesReps] = useState([]);
    const [userSalesData, setUserSalesData] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch sales data for mobile chart
    useEffect(() => {
        if (!userData || !userData.user_id) return;

        async function fetchSalesData() {
            try {
                const users = await fetchUsers();
                setAllSalesReps(users);

                // Transform users to sales data format
                const salesData = users.map((u) => ({
                    user_id: u.user_id,
                    name: `${u.first_name} ${u.last_name}`,
                    branch_id: u.branch_id,
                    total_sales: u.total_sales || 0,
                }));
                setUserSalesData(salesData);
            } catch (error) {
                console.error("❌ Error fetching sales data:", error);
            }
        }

        fetchSalesData();
    }, [userData]);

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

    if (!userData) {
        return <p className="text-center text-slate-500 dark:text-slate-400">Loading user profile...</p>;
    }

    if (loading) {
        return <p className="text-center text-slate-500 dark:text-slate-400">Loading dashboard...</p>;
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

                {/* 📊 Sales Chart - Mobile vs Desktop */}
                {isMobile ? (
                    <DashboardSalesChartMobile
                        userData={userData}
                        userSalesData={userSalesData}
                        allSalesReps={allSalesReps}
                    />
                ) : userData.branch_id ? (
                    <SalesChart userProfile={userData} />
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400">Loading Sales Data...</p>
                )}

                {/* 📅 Calendar - Mobile vs Desktop */}
                {isMobile ? (
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
                ) : (
                    <DashboardCalendarSection
                        events={events}
                        onAddEvent={(date) => {
                            setSelectedDate(date);
                            setShowCreateModal(true);
                        }}
                        onEventClick={(event) => {
                            setSelectedEvent(event);
                            setShowEventDetailsModal(true);
                        }}
                    />
                )}

                {/* 📋 Tasks - Mobile vs Desktop */}
                {isMobile ? (
                    <TasksMobileMini
                        tasks={tasks}
                        user={userData}
                        refreshTasks={handleRefreshTasks}
                    />
                ) : (
                    <TasksComponent
                        tasks={tasks}
                        user={userData}
                        refreshTasks={handleRefreshTasks}
                    />
                )}

                {/* 🏢 Accounts - Mobile vs Desktop */}
                {isMobile ? (
                    <AccountsMobileMini user={userData} />
                ) : (
                    <AccountsTable user={userData} />
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
                    <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-lg">
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
