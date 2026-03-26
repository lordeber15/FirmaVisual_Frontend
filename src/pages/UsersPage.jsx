import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import {
  Users, Plus, Pencil, Trash2, X, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', roleId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: '', email: '', password: '', roleId: roles[3]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, email: u.email, password: '', roleId: u.roleId });
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingUser) {
        const payload = { username: form.username, email: form.email, roleId: form.roleId };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`¿Eliminar al usuario "${u.username}"?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const roleColors = {
    'Administrador': 'bg-red-100 text-red-600',
    'Asistente': 'bg-violet-100 text-violet-600',
    'Ejecutor': 'bg-amber-100 text-amber-600',
    'Firmante': 'bg-blue-100 text-blue-600',
  };

  return (
    <Layout title="Gestión de Usuarios">
      <div className="flex items-center justify-between mb-8">
        <p className="text-slate-500">{users.length} usuarios registrados</p>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Creado</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 uppercase">
                      {u.username[0]}
                    </div>
                    <span className="font-semibold text-slate-900">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors[u.Role?.name] || 'bg-slate-100 text-slate-500'}`}>
                    {u.Role?.name || 'Sin rol'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Contraseña {editingUser && <span className="text-slate-300">(dejar vacío para mantener)</span>}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder={editingUser ? '••••••••' : ''}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Rol</label>
                  <select
                    value={form.roleId}
                    onChange={(e) => setForm(p => ({ ...p, roleId: parseInt(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !form.username || !form.email || (!editingUser && !form.password)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
