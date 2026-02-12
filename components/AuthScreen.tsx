import React, { useState } from 'react';
import { apiService } from '../services/api';
import { AuthMode, AuthResponse } from '../types';
import { Lock, Mail, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (data: AuthResponse) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let data: AuthResponse;
      if (mode === AuthMode.LOGIN) {
        data = await apiService.login(email, password);
      } else {
        data = await apiService.register(name, email, password);
      }
      onAuthSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden z-10">
        
        {/* Header */}
        <div className="bg-slate-800 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === AuthMode.LOGIN ? 'Portal de Estrategia' : 'Registro de Analista'}
          </h2>
          <p className="text-slate-300 text-sm">
            {mode === AuthMode.LOGIN 
              ? 'Acceda a la plataforma de inteligencia política' 
              : 'Cree su credencial de consultor'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3 rounded-r">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === AuthMode.REGISTER && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Nombre del Consultor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Correo Institucional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Clave de Acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  {mode === AuthMode.LOGIN ? 'Ingresar al Sistema' : 'Registrar Credencial'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {mode === AuthMode.LOGIN ? '¿Nuevo consultor?' : '¿Ya tiene credenciales?'}
              <button
                onClick={toggleMode}
                className="ml-1 text-slate-800 font-semibold hover:underline focus:outline-none"
              >
                {mode === AuthMode.LOGIN ? 'Solicitar acceso' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">
          Powered by Informe Confidencial
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;