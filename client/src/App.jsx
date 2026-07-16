import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import ProductionCalculator from './pages/ProductionCalculator';
import Inventory from './pages/Inventory';
import ProductionHistory from './pages/ProductionHistory';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Users from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/recipes"
            element={
              <PrivateRoute roles={['Administrator', 'Manager']}>
                <Recipes />
              </PrivateRoute>
            }
          />
          <Route
            path="/calculator"
            element={
              <PrivateRoute roles={['Administrator', 'Manager', 'Production Operator']}>
                <ProductionCalculator />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute roles={['Administrator', 'Manager', 'Store Keeper']}>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route path="/production-history" element={<ProductionHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/settings"
            element={
              <PrivateRoute roles={['Administrator', 'Manager']}>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute roles={['Administrator']}>
                <Users />
              </PrivateRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
