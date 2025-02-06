import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/AccountsPage";
import SettingsPage from "./pages/SettingsPage";
import EmployeesPage from "./pages/EmployeesPage";
import LoginPage from "./pages/LoginPage";

import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    return storedUser || null; // ✅ Ensure stored user persists
  });

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
    const updateLastActive = () => {
      localStorage.setItem("lastActive", Date.now().toString());
    };

    window.addEventListener("mousemove", updateLastActive);
    window.addEventListener("keydown", updateLastActive);

    return () => {
      window.removeEventListener("mousemove", updateLastActive);
      window.removeEventListener("keydown", updateLastActive);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("lastActive");
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        {/* ✅ Ensure user is defined before passing it to Dashboard */}
        <Route path="/" element={user ? <Dashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/accounts" element={user ? <AccountsPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/employees" element={user ? <EmployeesPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <SettingsPage user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
