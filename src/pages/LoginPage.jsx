import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, FileCheck, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #23376E 0%, #2A428A 50%, #1B2A55 100%)' }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.02] rounded-full blur-[100px]"></div>
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Logo mark */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                <ShieldCheck className="w-7 h-7 text-primary-900" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">UE118</h1>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.3em]">Firma Visual</p>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.15] mb-6">
              Plataforma de<br />
              <span className="text-accent">firma digital</span><br />
              institucional
            </h2>

            <p className="text-white/40 text-base leading-relaxed mb-12 max-w-sm">
              Sistema seguro de estampado visual de documentos con trazabilidad completa y validación de identidad.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: FileCheck, label: 'Firma multipágina' },
                { icon: Fingerprint, label: 'Verificación hash' },
                { icon: ShieldCheck, label: 'Auditoría completa' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2"
                >
                  <feat.icon className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold text-white/60">{feat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom attribution */}
          <div className="absolute bottom-10 left-16">
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-[hsl(210,20%,98%)] relative px-6">
        {/* Mobile-only top branding */}
        <div className="lg:hidden absolute top-8 left-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-primary-800 tracking-tight">UE118</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-primary-900 mb-2">Iniciar sesión</h3>
            <p className="text-sm text-slate-400">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Correo electrónico
              </label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within/input:text-primary transition-colors duration-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium placeholder:text-slate-300"
                  placeholder="usuario@ue118.gob.pe"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Contraseña
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within/input:text-primary transition-colors duration-200" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold py-3 px-4 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-inst-lg hover:bg-primary-500 active:bg-primary-700 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-sm tracking-wide">Ingresar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Divider with info */}
          <div className="mt-10 pt-8 border-t border-slate-200/60">
            <div className="flex items-start gap-3 bg-primary-50/60 border border-primary-100 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary-800 mb-0.5">Acceso restringido</p>
                <p className="text-[11px] text-primary-400 leading-relaxed">
                  Este sistema es de uso exclusivo para personal autorizado de la UE118. Toda actividad es auditada.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-slate-300 text-[10px] font-medium tracking-widest uppercase">
            Todos los derechos reservados
          </p>
        </motion.div>
      </div>
    </div>
  );
}
