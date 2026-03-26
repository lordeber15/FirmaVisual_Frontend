import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import CanvasSignature from '../features/signatures/CanvasSignature';
import api from '../services/api';
import { CheckCircle, AlertCircle, Eye, Settings, ShieldOff, Users, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignatureViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureInfo, setSignatureInfo] = useState(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [notAssigned, setNotAssigned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageMode, setPageMode] = useState('all');
  const [pageRange, setPageRange] = useState('');

  const sigData = {
    name: user?.signatureSettings?.stampName || user?.username || 'USUARIO RPD',
    position: user?.signatureSettings?.stampPosition || user?.role || 'FIRMANTE',
    colegiatura: user?.signatureSettings?.colegiatura || 'CIP: 123456',
    details: user?.signatureSettings?.details || 'RPD - SEDE CENTRAL'
  };

  // Cargar info de firmantes al montar
  useEffect(() => {
    const loadSignatureInfo = async () => {
      try {
        const { data } = await api.get(`/signatures/document/${id}`);
        setSignatureInfo(data);

        const { signers, signatures } = data;

        // Verificar si el usuario ya firmó
        const userSigned = signatures.some(s => s.userId === user?.id);
        setAlreadySigned(userSigned);

        // Verificar si hay firmantes asignados y el usuario no está entre ellos
        if (signers.length > 0) {
          const isAssigned = signers.some(s => s.userId === user?.id);
          setNotAssigned(!isAssigned);
        }
      } catch (err) {
        console.error('Error loading signature info:', err);
      }
    };

    loadSignatureInfo();
  }, [id, user?.id]);

  const handleSign = async () => {
    if (!coords) return setShowError('Por favor, ubica la firma en el documento antes de estampar.');
    setIsSigning(true);
    try {
      await api.post('/signatures', {
        documentId: id,
        type: 'VISUAL',
        coords: { ...coords, pageMode, pageRange },
        signatureData: {
          name: sigData.name,
          position: sigData.position,
          colegiatura: sigData.colegiatura,
          details: sigData.details,
          dateTime: new Date().toLocaleString(),
          hash: Math.random().toString(36).substring(2, 12).toUpperCase(),
          settings: user?.signatureSettings
        }
      });
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
            onCoordsChange={canSign ? setCoords : () => {}}
            onTotalPages={setTotalPages}
            sigData={sigData}
            settings={user?.signatureSettings}
            pageMode={pageMode}
            pageRange={pageRange}
          />
        </div>

        <div className="w-full lg:w-96 space-y-6">
          {/* Alerta si ya firmó */}
          {alreadySigned && (
            <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-200">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-emerald-800 mb-1">Ya has firmado</h4>
                  <p className="text-xs text-emerald-600">Este documento ya cuenta con tu firma. No puedes firmarlo nuevamente.</p>
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
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10"></div>

            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-blue-600" />
              Vista de Firma
            </h3>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Firmante</p>
                <p className="text-sm font-bold text-slate-800 truncate">{sigData.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Cargo</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{sigData.position}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">ID</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{sigData.colegiatura || 'N/A'}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs px-2 py-1 bg-blue-50/50 rounded-lg">
                <span className="font-medium text-blue-800">Tamaño del sello</span>
                <span className="font-bold text-blue-600">{user?.signatureSettings?.width || 220}x{user?.signatureSettings?.height || 100}px</span>
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
                        className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                          pageMode === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
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
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center"
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
              <button onClick={() => navigate('/signature-settings')} className="text-[10px] flex items-center text-slate-400 hover:text-blue-600 font-bold uppercase tracking-widest transition-colors">
                <Settings className="w-3 h-3 mr-1.5" /> Modificar Diseño
              </button>
            </div>
          </div>

          {/* Estado de firmantes asignados */}
          {signers.length > 0 && (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2 text-violet-600" />
                Firmantes ({signatures.length}/{signers.length})
              </h4>
              <div className="space-y-2">
                {signers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        s.status === 'SIGNED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {(s.user?.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{s.user?.username}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.status === 'SIGNED'
                        ? 'bg-emerald-100 text-emerald-600'
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
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ delay: 0.2, duration: 1, repeat: Infinity }}
                  className="absolute inset-[-8px] border-2 border-emerald-500 rounded-full"
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
                Tu firma digital ha sido estampada con éxito. El documento ahora cuenta con validez legal RPD.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => navigate('/')}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all"
              >
                Volver al Inicio
              </motion.button>
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
