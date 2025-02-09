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
import UnpaidInvoicesPage from "./pages/UnpaidInvoicesPage";
import { fetchUserSession } from "./services/api"; 
import "./App.css";

function App() {
  // const [user, setUser] = useState(() => {
  //   // const storedUser = JSON.parse(localStorage.getItem("user"));
  //   // return storedUser || null; // ✅ Ensure stored user persists
  //   return JSON.parse(localStorage.getItem("user")) || null;
  // });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
        const sessionUser = await fetchUserSession();
        setUser(sessionUser); 
        setLoading(false);  // ✅ Stop loading once session check is done
    }
    checkSession();
  }, []);

  const handleLogout = () => {
      localStorage.removeItem("user");
      setUser(null);
  };

  if (loading) return <div>Loading...</div>;




  useEffect(() => {
    if (!user) return; // ✅ Prevent running effect if user is not logged in

    const checkInactivity = setInterval(() => {
        const now = Date.now();
        const lastActiveTime = parseInt(localStorage.getItem("lastActive"), 10) || now;

        if (now - lastActiveTime > 900000) { // 15 min timeout
            handleLogout();
        }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(checkInactivity); // Cleanup function
  }, [user]);

  useEffect(() => {
    const updateLastActive = () => localStorage.setItem("lastActive", Date.now().toString());
    window.addEventListener("mousemove", updateLastActive);
    window.addEventListener("keydown", updateLastActive);
    return () => {
      window.removeEventListener("mousemove", updateLastActive);
      window.removeEventListener("keydown", updateLastActive);
    };
  }, []);

  console.log("Current User in App:", user); // ✅ Debug user


  return (
    <Router>
      <Routes>
        {/* ✅ Public Route - Login */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />

        {/* ✅ Protected Routes */}
        <Route path="/" element={<ProtectedRoute user={user}><Dashboard user={user} handleLogout={handleLogout} /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute user={user}><SettingsPage user={user} /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute user={user}><EmployeesPage user={user} /></ProtectedRoute>} />

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
