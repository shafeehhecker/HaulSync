import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RFQList from './pages/RFQ/RFQList';
import CreateRFQ from './pages/RFQ/CreateRFQ';
import RFQDetail from './pages/RFQ/RFQDetail';
import ShipmentList from './pages/Shipments/ShipmentList';
import ShipmentDetail from './pages/Shipments/ShipmentDetail';
import CreateShipment from './pages/Shipments/CreateShipment';
import FleetList from './pages/Fleet/FleetList';
import DriverList from './pages/Drivers/DriverList';
import CompanyList from './pages/Companies/CompanyList';
import InvoiceList from './pages/Invoices/InvoiceList';
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard';
import UserManagement from './pages/Users/UserManagement';
import RouteManagement from './pages/Routes/RouteManagement';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="rfq" element={<RFQList />} />
        <Route path="rfq/new" element={<CreateRFQ />} />
        <Route path="rfq/:id" element={<RFQDetail />} />
        <Route path="shipments" element={<ShipmentList />} />
        <Route path="shipments/new" element={<CreateShipment />} />
        <Route path="shipments/:id" element={<ShipmentDetail />} />
        <Route path="fleet" element={<FleetList />} />
        <Route path="drivers" element={<DriverList />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="routes" element={<RouteManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
