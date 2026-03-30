import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import {
  FileText, Upload, ShieldCheck, Download, Clock, ChevronLeft,
  Users, UserPlus, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Assign modal
  const [showAssign, setShowAssign] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const canManage = ['Administrador', 'Ejecutor'].includes(user?.role);
  const canSign = user?.role !== 'Asistente';

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('projectId', id);

    try {
      await api.post('/documents', formData, {
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });
      setShowUpload(false);
      setUploadProgress(0);
      setFile(null);
      fetchProject();
    } catch (err) {
      alert('Error al subir: ' + err.message);
    }
  };

  const openAssignModal = async (docId) => {
    setShowAssign(docId);
    setAssignLoading(true);
    try {
      const { data } = await api.get('/documents/available-signers');
      setAvailableUsers(data);
      const doc = (project?.documents || []).find(d => d.id === docId);
      setSelectedUserIds((doc?.signers || []).map(s => s.userId));
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSigners = async () => {
    if (!showAssign || selectedUserIds.length === 0) return;
    setAssignLoading(true);
    try {
      await api.post(`/documents/${showAssign}/signers`, { userIds: selectedUserIds });
      setShowAssign(null);
      setSelectedUserIds([]);
      fetchProject();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(i => i !== userId) : [...prev, userId]
    );
  };

  const statusColors = {
    'PENDING': 'bg-amber-100 text-amber-600 border-amber-200',
    'PARTIAL': 'bg-primary-100 text-primary border-primary-200',
    'COMPLETED': 'bg-success-100 text-success border-success-200',
    'REPLACED': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const statusLabels = {
    'PENDING': 'Pendiente',
    'PARTIAL': 'Parcial',
    'COMPLETED': 'Completado',
    'REPLACED': 'Reemplazado',
  };

  if (loading) return (
    <Layout title="Cargando...">
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!project) return (
    <Layout title="Proyecto no encontrado">
      <Link to="/projects" className="text-primary hover:underline flex items-center">
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Proyectos
      </Link>
    </Layout>
  );

  const docs = project.documents || [];
  const completedDocs = docs.filter(d => d.status === 'COMPLETED').length;

  return (
    <Layout title={project.name}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/projects" className="text-sm text-primary hover:underline flex items-center mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Volver a Proyectos
          </Link>
          {project.description && (
            <p className="text-slate-500 text-sm">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>Creado por <strong className="text-slate-600">{project.creator?.username}</strong></span>
            <span>{docs.length} documentos</span>
            <span>{completedDocs} firmados</span>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowUpload(true)}
            className="bg-primary hover:bg-primary-500 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-primary/30 transition-all"
          >
            <Upload className="w-5 h-5" />
            <span>Subir Documento</span>
          </button>
        )}
      </div>

      {/* Progress */}
      {docs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-700">Progreso del proyecto</span>
            <span className="text-sm font-bold text-primary">{completedDocs}/{docs.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${completedDocs === docs.length ? 'bg-success' : 'bg-primary-500'}`}
              style={{ width: `${docs.length > 0 ? (completedDocs / docs.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Firmantes</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.length > 0 ? docs.map((doc) => {
              const signers = doc.signers || [];
              const signedCount = signers.filter(s => s.status === 'SIGNED').length;
              const totalSigners = signers.length;

              return (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-50 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{doc.filename}</p>
                        {doc.creator && <p className="text-xs text-slate-400">por {doc.creator.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status] || doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {totalSigners > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {signers.slice(0, 4).map((s) => (
                              <div
                                key={s.id}
                                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black uppercase ${
                                  s.status === 'SIGNED' ? 'bg-success-100 text-success' : 'bg-slate-100 text-slate-500'
                                }`}
                                title={`${s.user?.username || '?'} - ${s.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}`}
                              >
                                {(s.user?.username || '?')[0]}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{signedCount}/{totalSigners}</span>
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${signedCount === totalSigners ? 'bg-success' : 'bg-primary-500'}`}
                            style={{ width: `${(signedCount / totalSigners) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">v{doc.version}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {canSign && (
                        <Link
                          to={`/signature/${doc.id}`}
                          className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          title="Firmar"
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </Link>
                      )}
                      <a
                        href={`/uploads/${(doc.signedPath || doc.originalPath).split(/[\\/]/).pop()}`}
                        download
                        className="p-2 text-success hover:bg-success-50 rounded-lg transition-colors"
                        title="Descargar"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      {canManage && (
                        <button
                          onClick={() => openAssignModal(doc.id)}
                          className="p-2 text-secondary hover:bg-secondary-50 rounded-lg transition-colors"
                          title="Asignar Firmantes"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  No hay documentos en este proyecto. ¡Sube el primero!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative z-10"
            >
              <h3 className="text-xl font-bold mb-6">Subir documento a "{project.name}"</h3>
              <form onSubmit={handleUpload}>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center mb-6 hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer">
                  <input type="file" accept=".pdf" className="hidden" id="fileInput" onChange={(e) => setFile(e.target.files[0])} />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium">Arrastra tu PDF aquí</p>
                    <p className="text-slate-400">o haz clic para seleccionar (Máx. 500MB)</p>
                  </label>
                </div>
                {file && (
                  <div className="bg-slate-50 p-4 rounded-xl mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <FileText className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}
                {uploadProgress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-primary">Subiendo...</span>
                      <span className="text-sm font-medium text-primary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex space-x-4 mt-8">
                  <button type="button" onClick={() => setShowUpload(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary/30">
                    Cargar Archivo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Signers Modal */}
      <AnimatePresence>
        {showAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAssign(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2 text-secondary" />
                  Asignar Firmantes
                </h3>
                <button onClick={() => setShowAssign(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {assignLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                    {availableUsers.map((u) => (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedUserIds.includes(u.id) ? 'border-secondary-300 bg-secondary-50' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="w-4 h-4 rounded text-secondary" />
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
                    <span className="text-xs text-slate-400">{selectedUserIds.length} seleccionado{selectedUserIds.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={handleAssignSigners}
                      disabled={selectedUserIds.length === 0 || assignLoading}
                      className="bg-secondary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-secondary-600 disabled:opacity-50 shadow-lg shadow-secondary-500/30 transition-all"
                    >
                      Asignar Firmantes
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
