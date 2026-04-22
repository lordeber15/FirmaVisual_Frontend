import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import {
  FileText, Upload, ShieldCheck, Download, Clock, ChevronLeft, Search,
  Users, UserPlus, X, CheckCircle, AlertCircle, Trash2, Eye, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Assign modal (Document Signers)
  const [showAssign, setShowAssign] = useState(null);
  const [availableSigners, setAvailableSigners] = useState([]);
  const [selectedSigners, setSelectedSigners] = useState([]); // [{ userId, roleId }, ...]
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Pagination Documents
  const [documents, setDocuments] = useState([]);
  const [docPage, setDocPage] = useState(1);
  const [docTotal, setDocTotal] = useState(0);
  const [docTotalPages, setDocTotalPages] = useState(1);
  const [docLoading, setDocLoading] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [debouncedDocSearch, setDebouncedDocSearch] = useState('');
  const [docStatus, setDocStatus] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDocSearch(docSearch);
      setDocPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [docSearch]);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.response?.data?.message || 'Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProjectDocuments = useCallback(async () => {
    try {
      setDocLoading(true);
      const { data } = await api.get(`/documents?projectId=${id}&page=${docPage}&limit=4&search=${debouncedDocSearch}&status=${docStatus}`);
      setDocuments(data.documents);
      setDocTotal(data.total);
      setDocTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching project documents:', err);
    } finally {
      setDocLoading(false);
    }
  }, [id, docPage, debouncedDocSearch, docStatus]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    fetchProjectDocuments();
  }, [fetchProjectDocuments]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('projectId', id);

    setUploading(true);
    setUploadProgress(0);
    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      });
      setShowUpload(false);
      setFile(null);
      fetchProjectDocuments();
    } catch (err) {
      alert('Error al subir archivo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchProjectDocuments();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  const openAssignModal = async (docId) => {
    setShowAssign(docId);
    setAssignLoading(true);
    try {
      const { data } = await api.get('/documents/available-signers');
      setAvailableSigners(data); // data is UserRole[]
      
      const doc = (documents || []).find(d => d.id === docId);
      setSelectedSigners((doc?.signers || []).map(s => ({ userId: s.userId, roleId: s.roleId })));
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSigners = async () => {
    if (!showAssign) return;
    setAssignLoading(true);
    try {
      // payload: { userIds: [{ userId, roleId }, ...] }
      await api.post(`/documents/${showAssign}/signers`, { userIds: selectedSigners });
      setShowAssign(null);
      setSelectedSigners([]);
      fetchProjectDocuments();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleSigner = (userId, roleId) => {
    setSelectedSigners(prev => {
      const exists = prev.some(s => s.userId === userId && s.roleId === roleId);
      if (exists) {
        return prev.filter(s => !(s.userId === userId && s.roleId === roleId));
      } else {
        return [...prev, { userId, roleId }];
      }
    });
  };

  const renderSignerBadge = (s) => (
    <div
      key={s.id}
      className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase transition-transform hover:scale-110 cursor-help ${
        s.status === 'SIGNED' ? 'bg-success-100 text-success' : 'bg-slate-100 text-slate-500'
      }`}
      title={`${s.user?.username || '?'} (${s.role?.name || 'Firmante'}) - ${s.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}`}
    >
      {(s.user?.username || '?')[0]}
    </div>
  );

  const statusLabels = {
    'PENDING': 'Pendiente',
    'PARTIAL': 'Firma Parcial',
    'COMPLETED': 'Completado',
  };

  const canManage = ['Administrador', 'Ejecutor'].includes(user?.role);

  if (loading) {
    return (
      <Layout title="Cargando...">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Cargando detalles del proyecto...</p>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout title="Error">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span className="font-bold">{error || 'Proyecto no encontrado'}</span>
          </div>
          <Link to="/projects" className="text-primary font-bold flex items-center justify-center hover:underline">
            <ChevronLeft className="w-5 h-5 mr-1" /> Volver a proyectos
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={project.name} backTo="/projects">
      {/* Header Info */}
      <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-40"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="bg-primary-100 text-primary text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  {project.status || 'Activo'}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Creado el {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-3">{project.name}</h1>
              <p className="text-slate-500 font-medium max-w-2xl">{project.description || 'Sin descripción disponible.'}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-3 mr-4">
                {(project.members || []).slice(0, 5).map(m => (
                  <div key={m.id} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600" title={m.user?.username}>
                    {(m.user?.username || '?')[0].toUpperCase()}
                  </div>
                ))}
                {(project.members || []).length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                    +{(project.members || []).length - 5}
                  </div>
                )}
              </div>
              {canManage && (
                <button 
                  onClick={() => setShowUpload(true)}
                  className="bg-primary hover:bg-primary-600 text-white font-black px-6 py-4 rounded-2xl flex items-center space-x-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  <Upload className="w-5 h-5" />
                  <span className="uppercase tracking-wider text-xs">Subir Documento</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 mb-6">
          <div className="flex-1">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Documentos en este proyecto</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total encontrados: {docTotal}</p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all"
              />
            </div>
            
            <div className="relative">
              <select
                value={docStatus}
                onChange={(e) => {
                  setDocStatus(e.target.value);
                  setDocPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-slate-800 appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none shadow-sm hover:border-primary transition-all"
              >
                <option value="ALL">Estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="PARTIAL">Parcial</option>
                <option value="COMPLETED">Completados</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronLeft className="w-3 h-3 -rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {docLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white/50 rounded-3xl border border-slate-100">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando archivos...</p>
          </div>
        ) : documents?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center space-x-4 flex-1 w-full">
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-1 truncate max-w-md">{doc.filename}</h3>
                    <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-wider">
                      <span className={`px-2 py-0.5 rounded-full ${
                        doc.status === 'COMPLETED' ? 'bg-success-50 text-success' : 
                        doc.status === 'PARTIAL' ? 'bg-primary-50 text-primary' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {statusLabels[doc.status] || doc.status}
                      </span>
                      <span className="text-slate-300">v{doc.version || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  {/* Signers Avatars */}
                  <div className="flex -space-x-3">
                    {(doc.signers || []).map(renderSignerBadge)}
                    {(doc.signers || []).length === 0 && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase italic">Sin firmantes</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => navigate(`/signature/${doc.id}`)}
                      className="p-3 text-primary hover:bg-primary-50 rounded-xl transition-colors"
                      title="Firmar documento"
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </button>
                    {canManage && (
                      <button 
                        onClick={() => openAssignModal(doc.id)}
                        className="p-3 text-secondary hover:bg-secondary-50 rounded-xl transition-colors"
                        title="Asignar firmantes"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    )}
                    <a 
                      href={`${api.defaults.baseURL}/uploads/${doc.filename}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                      title="Ver original"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                    {canManage && (
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Paginación */}
          {docTotalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm mt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Página {docPage} de {docTotalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDocPage(prev => Math.max(1, prev - 1))}
                  disabled={docPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" /> Anterior
                </button>
                <button
                  onClick={() => setDocPage(prev => Math.min(docTotalPages, prev + 1))}
                  disabled={docPage === docTotalPages}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center"
                >
                  Siguiente <ChevronLeft className="w-3 h-3 ml-1 rotate-180" />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="bg-slate-50 rounded-[2.5rem] py-20 border-2 border-dashed border-slate-200 text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Upload className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay documentos cargados aún</p>
          </div>
        )}
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
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-primary" />
                  Cargar Documento
                </h3>
                <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpload}>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-all ${
                    file ? 'border-primary bg-primary-50' : 'border-slate-200 hover:border-primary-300'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                  }}
                >
                  {file ? (
                    <div className="text-primary">
                      <FileText className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm font-bold truncate">{file.name}</p>
                      <p className="text-[10px] font-medium text-primary-600 mt-1 uppercase">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold mb-1">Haz clic para subir o arrastra un archivo</p>
                      <p className="text-xs">Sólo archivos PDF son permitidos</p>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        id="fileInput"
                        onChange={(e) => setFile(e.target.files?.[0])}
                      />
                      <label htmlFor="fileInput" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary/30 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {uploading ? `Subiendo ${uploadProgress}%...` : 'Cargar Archivo'}
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
                  <Users className="w-6 h-6 mr-2 text-secondary" />
                  Asignar Firmantes
                </h3>
                <button onClick={() => setShowAssign(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {assignLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Usuarios Disponibles</p>
                  <div className="space-y-2 max-h-80 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                    {availableSigners.map((ur) => {
                      const isSelected = selectedSigners.some(s => s.userId === ur.userId && s.roleId === ur.roleId);
                      return (
                        <label
                          key={ur.id}
                          className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected ? 'border-secondary bg-secondary-50 ring-1 ring-secondary' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleSigner(ur.userId, ur.roleId)} 
                              className="w-5 h-5 rounded-lg text-secondary border-slate-300 focus:ring-secondary" 
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-800">{ur.User?.username}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{ur.cargo || ur.Role?.name}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            ur.Role?.name === 'Administrador' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {ur.Role?.name}
                          </span>
                        </label>
                      );
                    })}
                    {availableSigners.length === 0 && (
                      <p className="text-center py-10 text-slate-400 font-medium">No hay usuarios disponibles</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-xs font-bold text-slate-400">{selectedSigners.length} firmante{selectedSigners.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={handleAssignSigners}
                      disabled={assignLoading}
                      className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary-600 disabled:opacity-50 shadow-xl shadow-secondary/30 transition-all active:scale-95"
                    >
                      Actualizar Asignación
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
