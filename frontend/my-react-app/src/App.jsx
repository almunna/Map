import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./login";
import RegisterForm from "./Register";
import GISPage from "./GISPage";
import "./App.css";
import 'leaflet/dist/leaflet.css';
import ResetPasswordPage from "./ResetPasswordPage";
import AdminPanel from "./AdminPanel";

// ✅ User/Role based route protection
const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");

  if (!token) return <Navigate to="/auth/login" replace />;

  // If roleRequired is provided (like "ADMIN"), check that too
  if (roleRequired && role !== roleRequired) return <Navigate to="/auth/login" replace />;

  return children;
};

function App() {
  return (
    <Router>
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute roleRequired="USER">
                <GISPage />
              </PrivateRoute>
            }
          />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute roleRequired="ADMIN">
                <AdminPanel />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
