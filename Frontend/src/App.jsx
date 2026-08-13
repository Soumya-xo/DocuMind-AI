import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import Landing from "./pages/Landing.jsx";
import Documents from "./pages/Documents.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import ProfileSettings from "./pages/settings/ProfileSettings.jsx";
import ChangePassword from "./pages/settings/ChangePassword.jsx";
import DeleteAccount from "./pages/settings/DeleteAccount.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Protected route component - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// Public route - redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return !token ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
          v7_normalizeFormMethod: true,
        }}
      >
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />

          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/profile"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/delete-account"
            element={
              <ProtectedRoute>
                <DeleteAccount />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
