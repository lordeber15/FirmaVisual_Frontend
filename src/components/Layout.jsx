import { useAuth } from '../features/auth/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FolderOpen,
  LogOut,
  ShieldCheck,
  History,
  LayoutDashboard,
  Users
} from 'lucide-react';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Administrador', 'Asistente', 'Ejecutor', 'Firmante'] },
    { label: 'Proyectos', icon: FolderOpen, path: '/projects', roles: ['Administrador', 'Asistente', 'Ejecutor', 'Firmante'] },
    { label: 'Configuración', icon: ShieldCheck, path: '/signature-settings', roles: ['Administrador', 'Ejecutor', 'Firmante'] },
    { label: 'Usuarios', icon: Users, path: '/users', roles: ['Administrador'] },
    { label: 'Auditoría', icon: History, path: '/audit', roles: ['Administrador'] },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 shadow-2xl">
        <div className="mb-10 px-2 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Firma Visual</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.filter(item => item.roles.includes(user?.role)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'hover:bg-white/10 text-white/80'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center space-x-3 px-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-blue-400 font-bold">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user?.username}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500">Bienvenido de nuevo, {user?.username}.</p>
        </header>
        {children}
      </main>
    </div>
  );
}
