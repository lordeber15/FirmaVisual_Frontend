import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import {
  FolderOpen, Plus, FileText, CheckCircle, X, ChevronRight, Users, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  // Modal de asignación de miembros
  const [showAssignMembers, setShowAssignMembers] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const canManage = ['Administrador', 'Ejecutor'].includes(user?.role);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newProject.name.trim()) return;
    setLoading(true);
    try {
      await api.post('/projects', newProject);
      setShowCreate(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAssignMembers = async (projectId) => {
    setShowAssignMembers(projectId);
    setAssignLoading(true);
    try {
      const { data } = await api.get('/documents/available-signers');
      setAvailableUsers(data);
      const proj = projects.find(p => p.id === projectId);
      setSelectedMemberIds((proj?.members || []).map(m => m.userId));
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignMembers = async () => {
    if (!showAssignMembers || selectedMemberIds.length === 0) return;
    setAssignLoading(true);
    try {
      await api.post(`/projects/${showAssignMembers}/members`, { userIds: selectedMemberIds });
      setShowAssignMembers(null);
      setSelectedMemberIds([]);
      fetchProjects();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(i => i !== userId) : [...prev, userId]
    );
  };

  const statusColors = {
    'ACTIVE': 'bg-blue-100 text-blue-600',
    'COMPLETED': 'bg-emerald-100 text-emerald-600',
    'ARCHIVED': 'bg-slate-100 text-slate-500',
  };

  return (
    <Layout title="Proyectos">
      <div className="flex items-center justify-between mb-8">
        <p className="text-slate-500">Gestiona tus proyectos y documentos asociados</p>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Proyecto</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const docs = project.documents || [];
          const completedDocs = docs.filter(d => d.status === 'COMPLETED').length;
          const totalDocs = docs.length;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{project.name}</h3>
                      {project.creator && (
                        <p className="text-xs text-slate-400">por {project.creator.username}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-bold">{totalDocs}</span>
                      <span>docs</span>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="font-bold">{completedDocs}</span>
                      <span>firmados</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                {totalDocs > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Document list preview */}
                {docs.slice(0, 3).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-slate-600 truncate flex-1">{doc.filename}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full font-bold ${
                      doc.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600'
                      : doc.status === 'PARTIAL' ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
                {docs.length > 3 && (
                  <p className="text-xs text-slate-400 mt-1">+{docs.length - 3} más</p>
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between">
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Ver detalle</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                {canManage && (
                  <button
                    onClick={() => openAssignMembers(project.id)}
                    className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors"
                    title="Asignar miembros"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Miembros</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No hay proyectos. Crea el primero.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nuevo Proyecto</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nombre</label>
                  <input
                    value={newProject.name}
                    onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre del proyecto"
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Descripción</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descripción del proyecto (opcional)"
                    rows={3}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newProject.name.trim() || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Members Modal */}
      <AnimatePresence>
        {showAssignMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAssignMembers(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2 text-violet-600" />
                  Asignar Miembros al Proyecto
                </h3>
                <button onClick={() => setShowAssignMembers(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {assignLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                    {availableUsers.map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedMemberIds.includes(u.id) ? 'border-violet-300 bg-violet-50' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" checked={selectedMemberIds.includes(u.id)} onChange={() => toggleMember(u.id)} className="w-4 h-4 rounded text-violet-600" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{u.username}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                          {u.Role?.name || 'Sin rol'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{selectedMemberIds.length} seleccionado{selectedMemberIds.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={handleAssignMembers}
                      disabled={selectedMemberIds.length === 0 || assignLoading}
                      className="bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-50 shadow-lg shadow-violet-500/30 transition-all"
                    >
                      Asignar Miembros
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
