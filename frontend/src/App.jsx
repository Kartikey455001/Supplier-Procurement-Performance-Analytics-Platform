import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import SupplierProfile from './pages/SupplierProfile';
import PurchaseOrders from './pages/PurchaseOrders';
import SupplierPerformance from './pages/SupplierPerformance';
import CostAnalytics from './pages/CostAnalytics';
import QualityDelivery from './pages/QualityDelivery';
import Reports from './pages/Reports';
import CsvDataCenter from './pages/CsvDataCenter';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/suppliers" element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            } />

            <Route path="/suppliers/:id" element={
              <ProtectedRoute>
                <SupplierProfile />
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            } />

            <Route path="/procurement-analytics" element={
              <ProtectedRoute>
                <CostAnalytics />
              </ProtectedRoute>
            } />

            <Route path="/supplier-performance" element={
              <ProtectedRoute>
                <SupplierPerformance />
              </ProtectedRoute>
            } />

            <Route path="/quality-analysis" element={
              <ProtectedRoute>
                <QualityDelivery />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/csv-center" element={
              <ProtectedRoute>
                <CsvDataCenter />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
