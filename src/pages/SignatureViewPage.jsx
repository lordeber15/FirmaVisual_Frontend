import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import CanvasSignature from '../features/signatures/CanvasSignature';
import api from '../services/api';
import { CheckCircle, AlertCircle, Eye, Settings, ShieldOff, Users, XCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignatureViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [selectedSettings, setSelectedSettings] = useState(user?.signatureSettings || {});
  const [isSigning, setIsSigning] = useState(false);
  const [signatureInfo, setSignatureInfo] = useState(null);
  const [pendingRoles, setPendingRoles] = useState([]); // Roles del usuario pendientes de firmar
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [notAssigned, setNotAssigned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [signedFileUrl, setSignedFileUrl] = useState(null);
  const [showError, setShowError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageMode, setPageMode] = useState('all');
  const [pageRange, setPageRange] = useState('');
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

  const sigData = {
    name: selectedSettings?.stampName || user?.username || '',
    position: selectedCargo || '',
    colegiatura: selectedSettings?.colegiatura || '',
    details: selectedSettings?.details || ''
  };

  // ─── Inicializar cargo y rol por defecto ───────────────────────────────
  useEffect(() => {
    if (user && user.userRoles?.length > 0) {
      const firstUR = user.userRoles[0];

      // 1. Inicializar RoleId si no está puesto (usar comparación estricta con null)
      if (selectedRoleId === null || selectedRoleId === undefined) {
        setSelectedRoleId(firstUR.roleId);
      }

      // 2. Inicializar Cargo y Ajustes si no están puestos
      if (!selectedCargo) {
        const initialSettings = firstUR.signatureSettings || user.signatureSettings || {};
        setSelectedSettings(initialSettings);

        const defaultCargo = initialSettings.stampPosition
          || firstUR.cargo
          || user.role
          || '';
        setSelectedCargo(defaultCargo);
      }
    }
  }, [user, selectedRoleId]); // Re-ejecutar si user cambian o si el rol se resetea

  // ─── Cargar info de firmantes del documento ───────────────────────────────
  useEffect(() => {
    const loadSignatureInfo = async () => {
      try {
        const { data } = await api.get(`/signatures/document/${id}`);
        setSignatureInfo(data);

        const { signers } = data;
        const userAsSigner = signers.filter(s => s.userId === user?.id && s.status === 'PENDING');

        if (userAsSigner.length > 0) {
          setPendingRoles(userAsSigner);

          // Solo autoseleccionar si no hay un rol seleccionado ya
          if (selectedRoleId === null || selectedRoleId === undefined) {
            const firstPendingRoleId = userAsSigner[0].roleId;
            setSelectedRoleId(firstPendingRoleId);

            const ur = user?.userRoles?.find(r => parseInt(r.roleId) === parseInt(firstPendingRoleId));
            if (ur) {
              const currentSettings = ur.signatureSettings || user?.signatureSettings || {};
              setSelectedSettings(currentSettings);
              setSelectedCargo(
                currentSettings?.stampPosition
                || ur.cargo
                || ur.Role?.name
                || ''
              );
            }
          }
        } else {
          setPendingRoles([]);
        }
      } catch (err) {
        console.error('Error loading signature info:', err);
      }
    };

    if (id) {
      loadSignatureInfo();
    }
  }, [id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Recalcular estados de firma según el Rol Seleccionado ────────────────
  useEffect(() => {
    if (!signatureInfo || !selectedRoleId) return;

    const { signers, signatures } = signatureInfo;

    // 1. ¿Ya firmó con este rol específico?
    const hasSignedWithRole = signatures.some(s =>
      s.userId === user?.id && parseInt(s.roleId) === parseInt(selectedRoleId)
    );
    setAlreadySigned(hasSignedWithRole);

    // 2. ¿Está asignado con este rol específico? (ignorar si ya firmó, para no mostrar "No autorizado" en vez de "Ya firmado")
    const isAssignedWithRole = signers.some(s =>
      s.userId === user?.id && (!s.roleId || parseInt(s.roleId) === parseInt(selectedRoleId))
    );
    setNotAssigned(!isAssignedWithRole && !hasSignedWithRole);

  }, [signatureInfo, selectedRoleId, user?.id]);

  const handleRoleSwitch = (roleId) => {
    setSelectedRoleId(roleId);
    const ur = user?.userRoles?.find(r => parseInt(r.roleId) === parseInt(roleId));

    // 1. Cargar ajustes (si no existen para el rol, usar los globales del usuario como base)
    const currentSettings = ur?.signatureSettings || user?.signatureSettings || {};
    setSelectedSettings(currentSettings);

    // 2. Sincronizar Cargo: Priorizar diseño, luego cargo administrativo, luego nombre del rol
    setSelectedCargo(
      currentSettings?.stampPosition
      || ur?.cargo
      || ur?.Role?.name
      || ''
    );
  };

  const handleSign = async () => {
    if (!coords) return setShowError('Por favor, ubica la firma en el documento antes de estampar.');

    // Si solo hay un rol y no se ha seleccionado (por carrera de carga), forzarlo
    let roleIdToUse = selectedRoleId;
    if ((roleIdToUse === null || roleIdToUse === undefined) && user?.userRoles?.length === 1) {
      roleIdToUse = user.userRoles[0].roleId;
    }

    if (roleIdToUse === null || roleIdToUse === undefined) {
      return setShowError('Selecciona un rol para firmar.');
    }

    setIsSigning(true);
    try {
      const response = await api.post('/signatures', {
        documentId: id,
        type: 'VISUAL',
        roleId: selectedRoleId,
        coords: { ...coords, pageMode, pageRange },
        signatureData: {
          name: sigData.name,
          position: sigData.position,
          colegiatura: sigData.colegiatura,
          details: sigData.details,
          dateTime: new Date().toLocaleString(),
          hash: Math.random().toString(36).substring(2, 12).toUpperCase(),
          settings: {
            ...selectedSettings,
            rotation: selectedSettings?.rotation || 0
          }
        }
      });
      if (response.data?.signedFilename) {
        setSignedFileUrl(`/uploads/${response.data.signedFilename}`);
      }
      setShowSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setShowError(msg);
    } finally {
      setIsSigning(false);
    }
  };

  const canSign = !alreadySigned && !notAssigned;
  const signers = signatureInfo?.signers || [];
  const signatures = signatureInfo?.signatures || [];

  return (
    <Layout title="Firmar Documento">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-slate-100 rounded-[2rem] shadow-inner border border-slate-200 overflow-hidden relative">
          <CanvasSignature
            documentId={id}
            onCoordsChange={canSign ? setCoords : () => { }}
            onTotalPages={setTotalPages}
            sigData={sigData}
            settings={selectedSettings}
            pageMode={pageMode}
            pageRange={pageRange}
            refreshKey={pdfRefreshKey}
          />
        </div>

        <div className="w-full lg:w-96 space-y-6">
          {/* Alerta si ya firmó */}
          {alreadySigned && (
            <div className="bg-success-50 p-5 rounded-[2rem] border border-success-200">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-success mb-1">Ya has firmado</h4>
                  <p className="text-xs text-success">Este documento ya cuenta con tu firma. No puedes firmarlo nuevamente.</p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta si no está asignado */}
          {notAssigned && !alreadySigned && (
            <div className="bg-red-50 p-5 rounded-[2rem] border border-red-200">
              <div className="flex items-start space-x-3">
                <ShieldOff className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-red-800 mb-1">No autorizado</h4>
                  <p className="text-xs text-red-600">No estás asignado como firmante de este documento.</p>
                </div>
              </div>
            </div>
          )}

          {/* Panel de firma */}
          {/* Panel de firma */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-[100px] -z-10"></div>

            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-primary" />
              Vista de Firma
            </h3>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Firmante</p>
                <p className="text-sm font-bold text-slate-800 truncate">{sigData.name}</p>
              </div>

              {/* ── Combo Box de cambio de Rol (visible si el usuario tiene múltiples roles) ── */}
              {(user?.userRoles?.length || 0) > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Rol de firma</p>
                    <Users className="w-3.5 h-3.5 text-primary opacity-60" />
                  </div>
                  <div className="relative group">
                    <select
                      value={selectedRoleId || ''}
                      onChange={(e) => handleRoleSwitch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer group-hover:bg-white group-hover:border-primary/30"
                    >
                      {user.userRoles.map(ur => (
                        <option key={ur.roleId} value={ur.roleId}>
                          {ur.Role?.name || 'Firmante'} - {ur.cargo || 'Sin cargo específico'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary transition-colors">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Cambia el rol para ajustar el <span className="text-primary font-bold">Cargo</span> automáticamente.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  key={`cargo-${selectedRoleId}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Cargo</p>
                  <p className="text-xs font-bold text-slate-700 truncate" title={selectedCargo}>
                    {selectedCargo}
                  </p>
                </motion.div>
                <motion.div
                  key={`id-${selectedRoleId}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">ID</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{sigData.colegiatura}</p>
                </motion.div>
              </div>

              <div className="flex justify-between items-center text-xs px-2 py-1 bg-primary-50/50 rounded-lg">
                <span className="font-medium text-primary-800">Tamaño del sello</span>
                <span className="font-bold text-primary">{selectedSettings?.width || 220}x{selectedSettings?.height || 100}px</span>
              </div>

              {/* Selector de páginas */}
              {totalPages > 1 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Páginas a firmar</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Todas' },
                      { value: 'current', label: 'Actual' },
                      { value: 'range', label: 'Rango' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPageMode(opt.value)}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${pageMode === opt.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-primary-200'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {pageMode === 'range' && (
                    <input
                      type="text"
                      placeholder="Ej: 1-5, 8, 10-12"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                  <p className="text-[10px] text-slate-400">
                    {pageMode === 'all' && `Se firmará en las ${totalPages} páginas`}
                    {pageMode === 'current' && 'Se firmará solo en la página visible'}
                    {pageMode === 'range' && (pageRange ? `Páginas: ${pageRange}` : 'Ingresa el rango de páginas')}
                  </p>
                </div>
              )}
            </div>

            {/* Botón de firma */}
            <div className="pt-2">
              <button
                onClick={handleSign}
                disabled={isSigning || !coords || !canSign}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:bg-primary-700 disabled:bg-slate-300 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center"
              >
                {isSigning ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : !canSign ? (
                  <>
                    <ShieldOff className="w-4 h-4 mr-2" />
                    {alreadySigned ? 'Ya Firmado' : 'No Autorizado'}
                  </>
                ) : (
                  <>
                    {coords ? <CheckCircle className="w-4 h-4 mr-2" /> : <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>}
                    {coords ? 'Validar y Estampar' : 'Ubica la Firma'}
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex justify-center">
              <button onClick={() => navigate('/signature-settings')} className="text-[10px] flex items-center text-slate-400 hover:text-primary font-bold uppercase tracking-widest transition-colors">
                <Settings className="w-3 h-3 mr-1.5" /> Modificar Diseño
              </button>
            </div>
          </div>

          {/* Estado de firmantes asignados */}
          {signers.length > 0 && (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2 text-secondary" />
                Firmantes ({signatures.length}/{signers.length})
              </h4>
              <div className="space-y-2">
                {signers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${s.status === 'SIGNED' ? 'bg-success-100 text-success' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {(s.user?.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{s.user?.username}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{s.role?.name || 'Firmante'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${s.status === 'SIGNED'
                      ? 'bg-success-100 text-success'
                      : 'bg-amber-100 text-amber-600'
                      }`}>
                      {s.status === 'SIGNED' ? 'Firmado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucción */}
          {canSign && (
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100/50">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1.5">Instrucción</h4>
                  <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                    Haz clic en cualquier parte del documento para ubicar el sello. La firma se aplicará en todas las páginas en la misma posición.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de éxito Premium */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative z-10 text-center border border-slate-100"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 200 }}
                  className="absolute inset-0 bg-success rounded-full"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 0.2, duration: 1, repeat: Infinity }}
                  className="absolute inset-[-8px] border-2 border-success rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.svg
                    viewBox="0 0 50 50"
                    className="w-12 h-12 text-white"
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.path
                      fill="none"
                      strokeWidth="5"
                      stroke="currentColor"
                      d="M14,27 L22,35 L36,15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: {
                          pathLength: 1,
                          opacity: 1,
                          transition: { delay: 0.3, duration: 0.5, ease: "easeOut" }
                        }
                      }}
                    />
                  </motion.svg>
                </div>
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-black text-slate-900 mb-3"
              >
                ¡Documento Firmado!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-slate-500 mb-10 leading-relaxed"
              >
                Tu firma digital ha sido estampada con éxito. El documento ahora cuenta con validez legal.
              </motion.p>

              {/* {signedFileUrl && (
                <motion.a
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  href={signedFileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-success text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-success-600 active:scale-95 transition-all flex items-center justify-center mb-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Documento Firmado
                </motion.a>
              )} */}

              <div className="flex flex-col gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={async () => {
                    setShowSuccess(false);
                    // Recargar info para ver si hay más roles pendientes
                    const { data } = await api.get(`/signatures/document/${id}`);
                    setSignatureInfo(data);
                    setCoords(null);
                    // Forzar recarga del PDF para mostrar la versión firmada
                    setPdfRefreshKey(k => k + 1);
                  }}
                  className="w-full px-6 bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Documento
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => navigate('/')}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Volver al Inicio
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de error */}
      <AnimatePresence>
        {showError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowError(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Error al Firmar</h3>
              <p className="text-sm text-slate-500 mb-8">{showError}</p>
              <button
                onClick={() => setShowError(null)}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all"
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
