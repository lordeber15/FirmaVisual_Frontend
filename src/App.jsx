import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import SignatureViewPage from './pages/SignatureViewPage';
import SignatureSettingsPage from './pages/SignatureSettingsPage';
import AuditPage from './pages/AuditPage';
import UsersPage from './pages/UsersPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute roles={['Administrador', 'Asistente', 'Ejecutor', 'Firmante']}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute roles={['Administrador', 'Asistente', 'Ejecutor', 'Firmante']}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signature/:id"
          element={
            <ProtectedRoute roles={['Administrador', 'Ejecutor', 'Firmante']}>
              <SignatureViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signature-settings"
          element={
            <ProtectedRoute roles={['Administrador', 'Ejecutor', 'Firmante']}>
              <SignatureSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['Administrador']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute roles={['Administrador']}>
              <AuditPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
