import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { History, User, Activity, Globe, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 15;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit?page=${page}&limit=${limit}`);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Registro de Auditoría">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-600">
            <Activity className="w-5 h-5" />
            <span className="font-semibold text-lg">Trazabilidad de Acciones</span>
          </div>
          <span className="text-xs bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full">
            {totalLogs} Registros Totales
          </span>
        </div>
        
        <div className="overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 text-slate-500 text-xs uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Acción</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Detalles</th>
                <th className="px-6 py-4">Dirección IP</th>
                <th className="px-6 py-4">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, index) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      log.action.includes('SIGN') ? 'bg-success-100 text-success' : 
                      log.action.includes('REPLACE') ? 'bg-amber-100 text-amber-700' :
                      'bg-primary-100 text-primary-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{log.User?.username || 'Sistema'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{log.details}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-slate-400">
                      <Globe className="w-3 h-3 mr-1" />
                      {log.ip || 'Localhost'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación Premium */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              Mostrando página <span className="font-bold text-slate-800">{page}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Mostrar solo algunas páginas si hay muchas
                  if (totalPages > 7) {
                    if (p !== 1 && p !== totalPages && (p < page - 1 || p > page + 1)) {
                      if (p === page - 2 || p === page + 2) return <span key={p} className="text-slate-300">...</span>;
                      return null;
                    }
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        page === p 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
