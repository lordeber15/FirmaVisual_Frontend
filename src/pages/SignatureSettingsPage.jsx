import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Settings, Save, Maximize, Type, Image, Trash2,
  Shield, CheckCircle, Layout as LayoutIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAMP_TEXTS, LAYOUT, DEFAULT_SETTINGS } from '../features/signatures/signatureLayout';

export default function SignatureSettingsPage() {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    width: 220,
    height: 100,
    fontSizes: {
      name: 10,
      position: 8,
      colegiatura: 8,
      details: 7,
      meta: 6
    },
    fields: {
      name: true,
      position: true,
      colegiatura: true,
      details: true,
      hash: true
    },
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderColor: '#3b82f6',
    borderWidth: 2,
    opacity: 0.95,
    stampName: user?.signatureSettings?.stampName || user?.username || 'JUAN PÉREZ GARCÍA',
    stampPosition: user?.signatureSettings?.stampPosition || user?.role || 'GERENTE DE OPERACIONES',
    colegiatura: user?.signatureSettings?.colegiatura || 'CIP: 123456',
    details: user?.signatureSettings?.details || 'SEDE CENTRAL'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.signatureSettings) {
      setSettings(prev => ({
        ...prev,
        ...user.signatureSettings,
        fontSizes: { ...prev.fontSizes, ...(user.signatureSettings.fontSizes || {}) },
        fields: { ...prev.fields, ...(user.signatureSettings.fields || {}) },
        stampName: user.signatureSettings.stampName || prev.stampName,
        stampPosition: user.signatureSettings.stampPosition || prev.stampPosition,
        colegiatura: user.signatureSettings.colegiatura || prev.colegiatura,
        details: user.signatureSettings.details || prev.details
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put('/auth/update-settings', {
        signatureSettings: settings
      });

      updateUser({ signatureSettings: data.signatureSettings });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      stampName: user?.username || 'JUAN PÉREZ GARCÍA',
      stampPosition: user?.role || 'GERENTE DE OPERACIONES',
      colegiatura: 'CIP: 123456',
      details: 'SEDE CENTRAL'
    });
  };

  // Accent border width (igual que backend: borderWidth * multiplier)
  const accentWidth = settings.borderWidth * LAYOUT.accentBorderMultiplier;

  return (
    <Layout title="Diseño Avanzado de Sello">
      <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto pb-20">

        {/* Configuration Panel */}
        <div className="w-full xl:w-[500px] space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-y-auto max-h-[85vh]">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-primary" />
              Parámetros del Sello
            </h3>

            {/* Dimensions Section */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Maximize className="w-3 h-3 mr-2" /> Ancho
                </label>
                <input
                  type="range" min="160" max="400" step="5"
                  value={settings.width}
                  onChange={(e) => setSettings(p => ({ ...p, width: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <span className="text-[10px] font-bold text-slate-600 block text-right">{settings.width}px</span>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Maximize className="w-3 h-3 mr-2 rotate-90" /> Alto
                </label>
                <input
                  type="range" min="50" max="250" step="5"
                  value={settings.height}
                  onChange={(e) => setSettings(p => ({ ...p, height: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <span className="text-[10px] font-bold text-slate-600 block text-right">{settings.height}px</span>
              </div>
            </div>

            {/* Font Sizes Section */}
            <div className="space-y-6 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Tamaños de Fuente (pt)</h4>

              {[
                { label: 'Nombre Completo', key: 'name' },
                { label: 'Cargo / Posición', key: 'position' },
                { label: 'Colegiatura', key: 'colegiatura' },
                { label: 'Detalles Extras', key: 'details' },
                { label: 'Metadatos (Meta)', key: 'meta' }
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span className="flex items-center"><Type className="w-3 h-3 mr-2" /> {item.label}</span>
                    <span className="text-primary">{settings.fontSizes[item.key]}pt</span>
                  </div>
                  <input
                    type="range" min="5" max="18" step="0.5"
                    value={settings.fontSizes[item.key]}
                    onChange={(e) => setSettings(p => ({
                      ...p,
                      fontSizes: { ...p.fontSizes, [item.key]: parseFloat(e.target.value) }
                    }))}
                    className="w-full accent-primary h-1.5"
                  />
                </div>
              ))}
            </div>

            {/* Data Inputs */}
            <div className="space-y-4 mb-10">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Datos del Firmante</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre completo</label>
                  <input
                    placeholder="Nombre completo"
                    value={settings.stampName}
                    onChange={(e) => setSettings(p => ({ ...p, stampName: e.target.value }))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cargo / Posición</label>
                  <input
                    placeholder="Cargo"
                    value={settings.stampPosition}
                    onChange={(e) => setSettings(p => ({ ...p, stampPosition: e.target.value }))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Colegiatura / ID</label>
                  <input
                    placeholder="CIP: 123456"
                    value={settings.colegiatura}
                    onChange={(e) => setSettings(p => ({ ...p, colegiatura: e.target.value }))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Detalles adicionales</label>
                  <input
                    placeholder="SEDE CENTRAL"
                    value={settings.details}
                    onChange={(e) => setSettings(p => ({ ...p, details: e.target.value }))}
                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Imagen del Sello (Logo) */}
            <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center">
                <Image className="w-3.5 h-3.5 mr-2" /> Imagen / Logo del Sello
              </h4>
              <p className="text-[10px] text-slate-500 mb-3">Esta imagen aparecerá al lado del texto de la firma.</p>
              {settings.signatureImagePath ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/uploads/signatures/${settings.signatureImagePath.split(/[\\/]/).pop()}`}
                      alt="Sello"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-success uppercase mb-1">Imagen cargada</p>
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await api.delete('/auth/signature-image');
                          updateUser({ signatureSettings: data.signatureSettings });
                          setSettings(p => { const s = { ...p }; delete s.signatureImagePath; return s; });
                        } catch (err) {
                          alert('Error: ' + err.message);
                        }
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    id="sigImageInput"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('image', file);
                      try {
                        const { data } = await api.post('/auth/upload-signature-image', formData);
                        updateUser({ signatureSettings: data.signatureSettings });
                        setSettings(p => ({ ...p, signatureImagePath: data.signatureSettings.signatureImagePath }));
                      } catch (err) {
                        alert('Error: ' + err.message);
                      }
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="sigImageInput"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-200 hover:bg-primary-50/50 transition-all"
                  >
                    <Image className="w-5 h-5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400">Subir Logo (PNG/JPG)</span>
                  </label>
                </div>
              )}
            </div>


            {/* Toggle Fields */}
            <div className="space-y-3 mb-10">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Visibilidad de Campos</h4>
              <div className="grid grid-cols-2 gap-4">
                {['name', 'position', 'colegiatura', 'details', 'hash'].map(field => (
                  <label key={field} className="flex items-center space-x-2 cursor-pointer bg-white border border-slate-100 p-3 rounded-xl hover:bg-primary-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.fields[field]}
                      onChange={(e) => setSettings(p => ({
                        ...p,
                        fields: { ...p.fields, [field]: e.target.checked }
                      }))}
                      className="w-4 h-4 rounded text-primary"
                    />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter capitalize">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opacity & Color */}
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opacidad</label>
                <input
                  type="range" min="0.5" max="1" step="0.05"
                  value={settings.opacity}
                  onChange={(e) => setSettings(p => ({ ...p, opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <span className="text-[9px] font-bold text-slate-500 block text-right">{Math.round(settings.opacity * 100)}%</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color de Borde</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => setSettings(p => ({ ...p, borderColor: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{settings.borderColor}</span>
                </div>
              </div>
            </div>

            {/* Rotation Selector */}
            <div className="mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Orientación del Sello</h4>
              <div className="flex gap-2">
                {[
                  { label: '0°', value: 0 },
                  { label: '90°', value: 90 },
                  { label: '180°', value: 180 },
                  { label: '270°', value: 270 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSettings(p => ({ ...p, rotation: opt.value }))}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-xl border transition-all ${
                      (settings.rotation || 0) === opt.value
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-primary-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button onClick={resetToDefault} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl">Restaurar</button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Sello'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="flex-1 flex flex-col gap-8 w-full">
          <div className="flex-1 min-h-[500px] sm:min-h-[700px] bg-slate-200 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl relative flex flex-col items-center justify-center p-4 sm:p-12">
            <div className="absolute top-12 left-12 text-primary-300 text-[10px] font-black tracking-[0.4em] uppercase opacity-40">Motor de Renderizado Tiempo Real</div>

            {(() => {
              const PS = 2; // Preview Scale: 2x para visualización legible
              const hasImg = !!settings.signatureImagePath;
              const imgAreaWidth = settings.width * 0.35;
              const scaledAccent = accentWidth * PS;
              const textPadLeft = hasImg
                ? (accentWidth + imgAreaWidth + 8) * PS
                : (accentWidth + LAYOUT.paddingX) * PS;

              return (
                <div className="w-full overflow-x-auto scrollbar-hide flex justify-center items-center py-20">
                  <motion.div
                  animate={{
                    width: settings.width * PS,
                    height: settings.height * PS,
                    rotate: settings.rotation || 0,
                  }}
                  className="shadow-2xl relative overflow-hidden"
                  style={{ opacity: settings.opacity, borderRadius: '3px' }}
                >
                  {/* Fondo transparente */}

                  {/* Borde izquierdo accent */}
                  <div className="absolute left-0 top-0 bottom-0" style={{ width: `${scaledAccent}px`, backgroundColor: settings.borderColor }} />

                  {/* Bordes sutiles */}
                  <div className="absolute inset-0" style={{
                    borderTop: `1px solid ${settings.borderColor}25`,
                    borderRight: `1px solid ${settings.borderColor}25`,
                    borderBottom: `1px solid ${settings.borderColor}25`,
                  }} />

                  {/* Imagen del sello */}
                  {hasImg && (
                    <img
                      src={`/uploads/signatures/${settings.signatureImagePath.split(/[\\/]/).pop()}`}
                      alt="Sello"
                      className="absolute object-contain"
                      style={{
                        left: `${(accentWidth + 4) * PS}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${settings.width * 0.30 * PS}px`,
                        height: `${settings.height * 0.70 * PS}px`,
                        opacity: 0.9,
                      }}
                    />
                  )}

                  {/* Contenido texto */}
                  <div className="relative h-full flex flex-col justify-center" style={{
                    paddingLeft: `${textPadLeft}px`,
                    paddingRight: `${LAYOUT.paddingX * PS}px`,
                    paddingTop: `${LAYOUT.paddingTop * PS}px`,
                    paddingBottom: `${LAYOUT.paddingBottom * PS}px`,
                  }}>
                    {settings.fields.name && (
                      <p className="font-black leading-tight uppercase truncate" style={{
                        fontSize: `${settings.fontSizes.name * PS}px`,
                        color: '#0f172a',
                        marginBottom: `${LAYOUT.lineSpacing * PS}px`,
                      }}>{settings.stampName}</p>
                    )}

                    {settings.fields.position && (
                      <p className="font-bold leading-tight truncate" style={{
                        fontSize: `${settings.fontSizes.position * PS}px`,
                        color: '#4b5563',
                        marginBottom: `${LAYOUT.lineSpacing * PS}px`,
                      }}>{settings.stampPosition}</p>
                    )}

                    {settings.fields.colegiatura && (
                      <p className="font-semibold leading-tight truncate" style={{
                        fontSize: `${settings.fontSizes.colegiatura * PS}px`,
                        color: '#6b7280',
                        marginBottom: `${LAYOUT.lineSpacing * PS}px`,
                      }}>{settings.colegiatura}</p>
                    )}

                    {settings.fields.details && (
                      <p className="font-medium leading-tight truncate" style={{
                        fontSize: `${settings.fontSizes.details * PS}px`,
                        color: '#9ca3af',
                      }}>{settings.details}</p>
                    )}

                    {/* Footer - 2 líneas apiladas */}
                    <div className="flex flex-col" style={{
                      marginTop: 'auto',
                      paddingTop: `${3 * PS}px`,
                      borderTop: '1px solid rgba(0,0,0,0.08)',
                      gap: `${1 * PS}px`,
                    }}>
                      <span className="font-bold uppercase truncate" style={{ fontSize: `${settings.fontSizes.meta * PS}px`, color: '#9ca3af' }}>
                        {STAMP_TEXTS.FOOTER_DATE_PREFIX} {new Date().toLocaleDateString()}
                      </span>
                      {settings.fields.hash && (
                        <span className="font-bold truncate" style={{ fontSize: `${(settings.fontSizes.meta - 1) * PS}px`, color: '#9ca3af' }}>
                          {STAMP_TEXTS.FOOTER_HASH_PREFIX} XXXXXX
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                </div>
              );
            })()}

            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-4 py-1.5 rounded-full">
                Tamaño real: {settings.width} x {settings.height} px
              </span>
              <div className="flex items-center space-x-6 text-[10px] font-bold text-slate-500">
                <div className="flex items-center"><div className="w-2 h-2 bg-success rounded-full mr-2"></div> Preview 2x</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-primary rounded-full mr-2"></div> Motor PDF-LIB Sync</div>
              </div>
            </div>

            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-12 bg-success text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center font-bold text-sm">
                  <CheckCircle className="w-5 h-5 mr-3" /> ¡Configuración de sello guardada exitosamente!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <LayoutIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h5 className="font-bold text-slate-800 mb-2">Consejo de Diseño</h5>
              <p className="text-xs text-slate-500 leading-relaxed">Un sello de 220x100px es ideal para firmas multipágina. Mantén la letra mayor a 7pt para legibilidad.</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
              <div className="w-10 h-10 bg-secondary-50 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-secondary" />
              </div>
              <h5 className="font-bold text-slate-800 mb-2">Integridad</h5>
              <p className="text-xs text-slate-500 leading-relaxed">El hash de validación es obligatorio para firmas oficiales, pero opcional en sellos de cortesía visual.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
