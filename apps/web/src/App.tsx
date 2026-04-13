import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PropertiesPage } from './pages/properties/PropertiesPage';
import { UnitsPage } from './pages/units/UnitsPage';
import { TenantsPage } from './pages/tenants/TenantsPage';
import { LeasesPage } from './pages/leases/LeasesPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { MaintenancePage } from './pages/maintenance/MaintenancePage';
import { VendorsPage } from './pages/vendors/VendorsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { TenantPortalPage } from './pages/portal/TenantPortalPage';
import { VendorPortalPage } from './pages/vendor/VendorPortalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Owner / Manager / Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['owner', 'manager', 'admin']} />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/properties/*" element={<PropertiesPage />} />
                <Route path="/units/*" element={<UnitsPage />} />
                <Route path="/tenants/*" element={<TenantsPage />} />
                <Route path="/leases/*" element={<LeasesPage />} />
                <Route path="/payments/*" element={<PaymentsPage />} />
                <Route path="/maintenance/*" element={<MaintenancePage />} />
                <Route path="/vendors/*" element={<VendorsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Tenant portal */}
            <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
              <Route element={<AppShell />}>
                <Route path="/portal" element={<TenantPortalPage />} />
              </Route>
            </Route>

            {/* Vendor portal */}
            <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
              <Route element={<AppShell />}>
                <Route path="/workorders" element={<VendorPortalPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
