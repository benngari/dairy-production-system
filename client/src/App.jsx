import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormulaBuilder from './pages/FormulaBuilder';
import ProductionCalculator from './pages/ProductionCalculator';
import Inventory from './pages/Inventory';
import Packaging from './pages/Packaging';
import ProfitCalculator from './pages/ProfitCalculator';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="formula-builder" element={<FormulaBuilder />} />
        <Route path="production" element={<ProductionCalculator />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="packaging" element={<Packaging />} />
        <Route path="profit" element={<ProfitCalculator />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={user?.role === 'Administrator' ? <Users /> : <Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;