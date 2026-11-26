import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RoleGuard } from './components/RoleGuard';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminMenuPage } from './features/admin/AdminMenuPage';
import { AdminTablesPage } from './features/admin/AdminTablesPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { ForbiddenPage } from './features/auth/ForbiddenPage';
import { LoginPage } from './features/auth/LoginPage';
import { KdsBoardPage } from './features/kds/KdsBoardPage';
import { FloorMapPage } from './features/pos/FloorMapPage';
import { OrderHistoryPage } from './features/pos/OrderHistoryPage';
import { OrderPadPage } from './features/pos/OrderPadPage';
import { AuthProvider, useAuth } from './store/AuthContext';
import { RealtimeProvider } from './store/RealtimeContext';
import { ToastProvider } from './store/ToastContext';
import { getHomeRouteForRole } from './utils/navigation';

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<RoleGuard />}>
        <Route element={<AppShell />}>
          {/* POS Routes */}
          <Route element={<RoleGuard allowedRoles={['STAFF', 'ADMIN']} />}>
            <Route path="/pos/tables" element={<FloorMapPage />} />
            <Route path="/pos/orders/:tableId" element={<OrderPadPage />} />
            <Route path="/pos/history" element={<OrderHistoryPage />} />
          </Route>

          {/* KDS Route */}
          <Route element={<RoleGuard allowedRoles={['KITCHEN', 'ADMIN']} />}>
            <Route path="/kds" element={<KdsBoardPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/admin/menu" element={<AdminMenuPage />} />
            <Route path="/admin/tables" element={<AdminTablesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/settings" element={<AdminDashboardPage initialTab="SETTINGS" />} />
            <Route path="/admin/audit-logs" element={<AdminDashboardPage initialTab="AUDIT" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <RealtimeProvider>
            <AppRoutes />
          </RealtimeProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
