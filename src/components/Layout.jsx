import { useAuth } from '../features/auth/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  LogOut,
  ShieldCheck,
  History,
  LayoutDashboard,
  Users,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="flex h-screen bg-[hsl(210,20%,98%)] overflow-hidden relative">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-primary text-white p-2 rounded-xl shadow-inst-lg border border-primary-700"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-primary-900/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 text-white flex flex-col p-6 shadow-2xl transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(135deg, #23376E 0%, #2A428A 100%)' }}
      >
        <div className="mb-10 px-2 flex items-center space-x-3 mt-12 lg:mt-0">
          <div className="bg-accent p-2 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-primary-900" />
          </div>
          <span className="text-xl font-bold tracking-tight">Firma Visual</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.filter(item => item.roles.includes(user?.role)).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                    ? 'bg-accent/20 text-accent'
                    : 'hover:bg-white/10 text-white/80'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-white/50'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center space-x-3 px-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shrink-0">
              <span className="text-accent font-bold">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate text-sm">{user?.username}</p>
              <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{user?.role}</p>
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
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pt-20 lg:pt-12">
        <header className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-primary-900">{title}</h2>
          <p className="text-sm md:text-base text-primary-300">Bienvenido de nuevo, {user?.username}.</p>
        </header>
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
