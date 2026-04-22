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
  const [form, setForm] = useState({ username: '', email: '', password: '', userRoles: [] });
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
    setForm({ username: '', email: '', password: '', userRoles: [] });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    // u.userRoles: [{ roleId, cargo, Role: { name } }, ...]
    const mappedRoles = u.userRoles.map(ur => ({ 
      id: ur.roleId, 
      cargo: ur.cargo || '',
      name: ur.Role?.name 
    }));
    setForm({ username: u.username, email: u.email, password: '', userRoles: mappedRoles });
    setShowModal(true);
  };

  const addRole = () => {
    setForm(p => ({
      ...p,
      userRoles: [...p.userRoles, { id: roles[0]?.id, cargo: roles[0]?.name || '', name: roles[0]?.name }]
    }));
  };

  const removeRole = (index) => {
    setForm(p => ({
      ...p,
      userRoles: p.userRoles.filter((_, i) => i !== index)
    }));
  };

  const updateRoleField = (index, field, value) => {
    const newRoles = [...form.userRoles];
    if (field === 'id') {
      const role = roles.find(r => r.id === parseInt(value));
      newRoles[index].id = role.id;
      newRoles[index].name = role.name;
    } else {
      newRoles[index][field] = value;
    }
    setForm(p => ({ ...p, userRoles: newRoles }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { 
        username: form.username, 
        email: form.email, 
        roles: form.userRoles.map(r => ({ id: r.id, cargo: r.cargo }))
      };
      
      if (form.password) payload.password = form.password;

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
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
    'Asistente': 'bg-secondary-100 text-secondary',
    'Ejecutor': 'bg-amber-100 text-amber-600',
    'Firmante': 'bg-primary-100 text-primary',
  };

  return (
    <Layout title="Gestión de Usuarios">
      <div className="flex items-center justify-between mb-8">
        <p className="text-slate-500">{users.length} usuarios registrados</p>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-500 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-primary/30 transition-all"
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
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roles / Cargos</th>
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
                  <div className="flex flex-wrap gap-2">
                    {u.userRoles?.map((ur, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className={`px-2 py-0.5 rounded-t-md text-[10px] font-bold uppercase w-fit ${roleColors[ur.Role?.name] || 'bg-slate-100 text-slate-500'}`}>
                          {ur.Role?.name}
                        </span>
                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-b-md rounded-tr-md text-xs text-slate-600 font-medium">
                          {ur.cargo || 'Sin cargo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
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
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Contraseña {editingUser && <span className="text-slate-300">(dejar vacío)</span>}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Roles y Cargos</label>
                    <button 
                      onClick={addRole}
                      className="text-primary hover:text-primary-600 text-xs font-bold flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Añadir Rol
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {form.userRoles.map((ur, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
                        <button 
                          onClick={() => removeRole(idx)}
                          className="absolute -top-2 -right-2 bg-white border border-slate-200 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="space-y-2">
                          <select
                            value={ur.id}
                            onChange={(e) => updateRoleField(idx, 'id', e.target.value)}
                            className="w-full bg-white text-xs font-bold border border-slate-200 rounded-lg p-2 outline-none"
                          >
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Cargo / Puesto (ej. Gerente General)"
                            value={ur.cargo}
                            onChange={(e) => updateRoleField(idx, 'cargo', e.target.value)}
                            className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    {form.userRoles.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                        No hay roles asignados
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !form.username || !form.email || (!editingUser && !form.password)}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
