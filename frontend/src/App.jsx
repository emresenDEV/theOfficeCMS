import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AccountsPage from "./pages/AccountsPage";
import AccountDetailsPage from "./pages/AccountDetailsPage";
import AssignedAccountsPage from "./pages/AssignedAccountsPage";
import CalendarPage from "./pages/CalendarPage";
import CreateCalendarEvent from "./components/CreateCalendarEvent";
import CreateNewAccountPage from "./pages/CreateNewAccount";
import CommissionsPage from "./pages/CommissionsPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import Dashboard from "./pages/Dashboard";
import EditInvoicePage from "./pages/EditInvoicePage";
import EmployeesPage from "./pages/EmployeesPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetailsPage from "./pages/InvoiceDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import PaidInvoicesPage from "./pages/PaidInvoicesPage";
import PastDueInvoicesPage from "./pages/PastDueInvoicesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TasksPage from "./pages/TaskPage";
import UnpaidInvoicesPage from "./pages/UnpaidInvoicesPage";
import UpdateAccountPage from "./pages/UpdateAccountPage";
import Sidebar from "./components/Sidebar";
import { fetchUserSession } from "./services/authService";
import api from "./services/api";
import PropTypes from "prop-types";

import "./App.css";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function checkSession() {
      try {
        // Get session from backend (not from localStorage)
        const sessionUser = await fetchUserSession();
        const userId = sessionUser?.user_id || sessionUser?.id;
  
        if (!userId) {
          console.warn("⚠️ No valid session user ID found.");
          return;
        }
  
        // Fetch full user profile from backend
        const response = await api.get(`/users/details/${userId}`);
        const fullUser = response.data;
  
        // Save to React state + localStorage
        setUser(fullUser);
        localStorage.setItem("user", JSON.stringify(fullUser));
      } catch (error) {
        console.error("❌ Session Check Failed:", error);
      } finally {
        setLoading(false);
      }
    }
  
    checkSession();
  }, []);
  


  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // Inactivity timeout logic (Runs when user logs in)
  useEffect(() => {
    if (!user) return; // Do nothing if user is not logged in

    const checkInactivity = () => {
      const now = Date.now();
      const lastActiveTime = parseInt(localStorage.getItem("lastActive"), 10) || now;

      if (now - lastActiveTime > 900000) { // 15 min timeout
        handleLogout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Runs every 60 sec

    return () => clearInterval(interval); // Cleanup interval
  }, [user]); // Runs when user changes

  // Tracks user activity (Always Runs)
  useEffect(() => {
    const updateLastActive = () => localStorage.setItem("lastActive", Date.now().toString());

    window.addEventListener("mousemove", updateLastActive);
    window.addEventListener("keydown", updateLastActive);

    return () => {
      window.removeEventListener("mousemove", updateLastActive);
      window.removeEventListener("keydown", updateLastActive);
    };
  }, []); // Runs once on mount

  console.log("Current User in App:", user); // Debugging log

  return (
    <Router>
          {/* CUSTOM ROUTES WRAPPER FOR CONDITIONAL SIDEBAR */}
          <AppRoutes
            user={user}
            loading={loading}
            handleLogout={handleLogout}
            setUser={setUser}
          />
        </Router>
      );
    }
const AppRoutes = ({ user, loading, handleLogout, setUser }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login"; // DETECT LOGIN PAGE

  return (
    <>
    {/* SIDEBAR ONLY SHOWS IF USER EXISTS AND NOT ON LOGIN PAGE */}
    {!isLoginPage && user && <Sidebar user={user} handleLogout={handleLogout} />}

      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        {/* Redirect to login if `user` is null */}
        {!user ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
          ) : (
          <>
      
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute user={user} loading={loading}><Dashboard user={user} /></ProtectedRoute>} />

          <Route path="/settings" element={<ProtectedRoute user={user} loading={loading}><SettingsPage user={user} /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute user={user} loading={loading}><EmployeesPage user={user} /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute user={user} loading={loading}><TasksPage user={user} /></ProtectedRoute>} />

          {/* Calendar Routes */}
          <Route path="/calendar" element={<ProtectedRoute user={user} loading={loading}><CalendarPage user={user} /></ProtectedRoute>} />
          <Route path="/calendar/create" element={<ProtectedRoute user={user} loading={loading} ><CreateCalendarEvent user={user} userId={user.id} setEvents={() => {}} closeForm={() => {}}/></ProtectedRoute>} />

          {/* Invoice Routes */}
          <Route path="/invoices" element={<ProtectedRoute user={user} loading={loading}><InvoicesPage user={user} /></ProtectedRoute>} />
          <Route path="/invoice/:invoiceId" element={<ProtectedRoute user={user} loading={loading}><InvoiceDetailsPage user={user} /></ProtectedRoute>} />
          <Route path="/invoices/invoice/:invoiceId/edit" element={<ProtectedRoute user={user} loading={loading}><EditInvoicePage user={user} /></ProtectedRoute>} />
          <Route path="/create-invoice/:accountId" element={<ProtectedRoute user={user} loading={loading}><CreateInvoicePage user={user} setUser={setUser}/></ProtectedRoute>} />
          <Route path="/invoices/paid" element={<ProtectedRoute user={user} loading={loading}><PaidInvoicesPage user={user} /></ProtectedRoute>} />
          <Route path="/invoices/unpaid" element={<ProtectedRoute user={user} loading={loading}><UnpaidInvoicesPage user={user} /></ProtectedRoute>} />
          <Route path="/invoices/past_due" element={<ProtectedRoute user={user} loading={loading}><PastDueInvoicesPage user={user} /></ProtectedRoute>} />

          {/* Accounts Routes */}
          <Route path="/accounts" element={<ProtectedRoute user={user} loading={loading}><AccountsPage user={user} /></ProtectedRoute>} />
          <Route path="/accounts/assigned" element={<ProtectedRoute user={user} loading={loading}><AssignedAccountsPage user={user} /></ProtectedRoute>} />
          <Route path="/accounts/new" element={<ProtectedRoute user={user} loading={loading}><CreateNewAccountPage user={user} /></ProtectedRoute>} />
          <Route path="/accounts/details/:accountId" element={<ProtectedRoute user={user} loading={loading}><AccountDetailsPage user={user} /></ProtectedRoute>} />
          <Route path="/accounts/update/:accountId" element={<ProtectedRoute user={user} loading={loading}><UpdateAccountPage user={user} /></ProtectedRoute>} />
          <Route path="/accounts/create" element={<ProtectedRoute user={user} loading={loading}><CreateNewAccountPage user={user}/></ProtectedRoute>} />

          {/* Commissions */}
          <Route path="/commissions" element={<ProtectedRoute user={user} loading={loading}><CommissionsPage user={user} /></ProtectedRoute>} />
        
        {/* Redirect all unknown paths to Login */}
        <Route path="*" element={<Navigate to="/login" />} />
        </>
          )}
      </Routes>
    </>
  );
};

AppRoutes.propTypes = {
  user: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  handleLogout: PropTypes.func.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default App;
