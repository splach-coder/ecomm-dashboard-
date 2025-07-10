import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/Profile";
import ProductManagement from "./pages/Products";
import AdminProductDetail from "./pages/Product";
import SalesTransactions from "./pages/SalesTransactions";
import TradeFlow from "./pages/TradeFlow";
import ExternalTradeFlow from "./pages/ExternalTradeFlow";
import Expenses from "./pages/Expenses";
import Home from "./pages/Home";
import ResetPassword from "./pages/ResetPassword";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading ? (
            <div>Loading...</div>
          ) : user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/"
        element={
          loading ? (
            <div>Loading...</div>
          ) : user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <SalesTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trade"
        element={
          <ProtectedRoute>
            <TradeFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/external trade"
        element={
          <ProtectedRoute>
            <ExternalTradeFlow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProtectedRoute>
            <AdminProductDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </I18nextProvider>
  );
}

export default App;
