import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AccountsPage from "./pages/AccountsPage";
import AccountDetailsPage from "./pages/AccountDetailsPage";
import AssignedAccountsPage from "./pages/AssignedAccountsPage";
import CommissionsPage from "./pages/CommissionsPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/EmployeesPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetailsPage from "./pages/InvoiceDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import PaidInvoicesPage from "./pages/PaidInvoicesPage";
import PastDueInvoicesPage from "./pages/PastDueInvoicesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TasksPage from "./pages/TaskPage";
import UnpaidInvoicesPage from "./pages/UnpaidInvoicesPage";
import Sidebar from "./components/Sidebar";
import { fetchUserSession } from "./services/authService";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1️⃣ Check Session On App Load
//   useEffect(() => {
//     async function checkSession() {
//         try {
//             const storedUser = localStorage.getItem("user"); // 🔹 Only check session if user data exists
//             if (!storedUser) {
//                 setLoading(false);
//                 return;
//             }

//             const sessionUser = await fetchUserSession();
//             if (sessionUser) {
//                 setUser({
//                     id: sessionUser.id,
//                     username: sessionUser.username,
//                     firstName: sessionUser.first_name,
//                     lastName: sessionUser.last_name,
//                     role: sessionUser.role_name,
//                 });
//             }
//         } catch (error) {
//             console.error("Session Check Failed:", error);
//         } finally {
//             setLoading(false);
//         }
//     }

//     checkSession();
// }, []);
  useEffect(() => {
    async function checkSession() {
        try {
            const sessionUser = await fetchUserSession();
            if (sessionUser) {
                setUser({
                    id: sessionUser.id,
                    username: sessionUser.username,
                    firstName: sessionUser.first_name || "",
                    lastName: sessionUser.last_name || "",
                    role: sessionUser.role_name || "",
                });
            }
        } catch (error) {
            console.error("Session Check Failed:", error);
        } finally {
            setLoading(false);
        }
    }
    checkSession();
  }, []);



  // ✅ 2️⃣ Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // ✅ 3️⃣ Inactivity timeout logic (Runs when user logs in)
  useEffect(() => {
    if (!user) return; // 🔹 Do nothing if user is not logged in

    const checkInactivity = () => {
      const now = Date.now();
      const lastActiveTime = parseInt(localStorage.getItem("lastActive"), 10) || now;

      if (now - lastActiveTime > 900000) { // 15 min timeout
        handleLogout();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // ✅ Runs every 60 sec

    return () => clearInterval(interval); // ✅ Cleanup interval
  }, [user]); // ✅ Runs when user changes

  // ✅ 4️⃣ Tracks user activity (Always Runs)
  useEffect(() => {
    const updateLastActive = () => localStorage.setItem("lastActive", Date.now().toString());

    window.addEventListener("mousemove", updateLastActive);
    window.addEventListener("keydown", updateLastActive);

    return () => {
      window.removeEventListener("mousemove", updateLastActive);
      window.removeEventListener("keydown", updateLastActive);
    };
  }, []); // ✅ Runs once on mount

  console.log("Current User in App:", user); // ✅ Debugging log

  // ✅ 5️⃣ Display loading screen until session check is complete
  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      {/* ✅ Sidebar only renders if a user is logged in */}
      {user && <Sidebar user={user} handleLogout={handleLogout} />}
      <Routes>
        {/* ✅ Public Route - Login */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />

        {/* ✅ Protected Routes */}
        <Route path="/" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute user={user}><SettingsPage user={user} /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute user={user}><EmployeesPage user={user} /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute user={user}><TasksPage user={user} /></ProtectedRoute>} />


        {/* ✅ Invoice Routes */}
        <Route path="/invoices" element={<ProtectedRoute user={user}><InvoicesPage user={user} /></ProtectedRoute>} />
        <Route path="/invoice/:invoiceId" element={<ProtectedRoute user={user}><InvoiceDetailsPage user={user} /></ProtectedRoute>} />
        <Route path="/create-invoice" element={<ProtectedRoute user={user}><CreateInvoicePage user={user} /></ProtectedRoute>} />
        <Route path="/invoices/paid" element={<ProtectedRoute user={user}><PaidInvoicesPage user={user} /></ProtectedRoute>} />
        <Route path="/invoices/unpaid" element={<ProtectedRoute user={user}><UnpaidInvoicesPage user={user} /></ProtectedRoute>} />
        <Route path="/invoices/past_due" element={<ProtectedRoute user={user}><PastDueInvoicesPage user={user} /></ProtectedRoute>} />

        {/* ✅ Accounts Routes */}
        <Route path="/accounts" element={<ProtectedRoute user={user}><AccountsPage user={user} /></ProtectedRoute>} />
        <Route path="/accounts/assigned" element={<ProtectedRoute user={user}><AssignedAccountsPage user={user} /></ProtectedRoute>} />
        <Route path="/account/:accountId" element={<ProtectedRoute user={user}><AccountDetailsPage user={user} /></ProtectedRoute>} />

        {/* ✅ Commissions */}
        <Route path="/commissions" element={<ProtectedRoute user={user}><CommissionsPage user={user} /></ProtectedRoute>} />

        {/* ✅ Redirect all unknown paths to Login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
