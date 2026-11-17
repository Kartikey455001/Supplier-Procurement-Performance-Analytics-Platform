import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import Layout from './components/layout/Layout';

// Pages
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/:id" element={<SupplierProfile />} />
              <Route path="/orders" element={<PurchaseOrders />} />
              <Route path="/procurement-analytics" element={<CostAnalytics />} />
              <Route path="/supplier-performance" element={<SupplierPerformance />} />
              <Route path="/quality-analysis" element={<QualityDelivery />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/csv-center" element={<CsvDataCenter />} />
              <Route path="/settings" element={<Settings />} />
              {/* Redirect /login to dashboard */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
