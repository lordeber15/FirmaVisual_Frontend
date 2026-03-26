import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, FileCheck, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden font-sans bg-[#020617]">
      {/* Immersive Desktop Background */}
      <div className="absolute inset-0">
        {/* Large Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[60%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[70%] bg-indigo-600/10 rounded-full blur-[160px] animation-delay-3000 animate-pulse"></div>

        {/* Subtle Grid / Pattern for Desktop feel */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.2]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[450px]"
        >
          {/* Header Area */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/20 mb-6"
            >
              <Shield className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-1 select-none">
              UE118<span className="text-blue-500">.</span>
            </h1>
            <p className="text-blue-100/30 font-bold uppercase tracking-[0.4em] text-[11px] mb-8">
              Firma Visual
            </p>
          </div>

          {/* Glassmorphism Card */}
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[4rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            {/* Top Light Ray */}
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/[0.05] via-transparent to-transparent rotate-12 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-8 relative">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-200/40 uppercase ml-5 tracking-[0.2em]">
                  Portal de Identidad
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/20 group-focus-within/input:text-blue-400 transition-all duration-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 text-white px-16 py-5 rounded-[2rem] outline-none focus:border-blue-500/40 focus:bg-black/40 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-white/10 text-lg"
                    placeholder="admin@rpd.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-200/40 uppercase ml-5 tracking-[0.2em]">
                  Llave de Acceso
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/20 group-focus-within/input:text-blue-400 transition-all duration-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 text-white px-16 py-5 rounded-[2rem] outline-none focus:border-blue-500/40 focus:bg-black/40 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-white/10 text-lg"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold py-3 px-4 rounded-2xl text-center"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_30px_60px_-10px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center space-x-3 group/btn relative overflow-hidden"
              >
                <span className="text-lg tracking-tight">INGRESAR AHORA</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>
            </form>
          </div>

          <p className="mt-12 text-center text-blue-200/10 text-[10px] font-black tracking-[0.5em] uppercase hover:text-blue-200/30 transition-colors cursor-default">
            Derechos Resernados 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
