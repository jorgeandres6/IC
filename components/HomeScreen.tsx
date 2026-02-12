
import React from 'react';
import { User as UserType, ModuleId } from '../types';
import { 
  BookOpen, 
  Gavel, 
  Map, 
  MessageSquare, 
  LogOut, 
  Bot, 
  ChevronRight,
  ShieldCheck,
  Users,
  Search,
  Zap
} from 'lucide-react';

interface HomeScreenProps {
  user: UserType;
  onEnterChat: () => void;
  onLogout: () => void;
  onOpenModule: (id: ModuleId) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onEnterChat, onLogout, onOpenModule }) => {
  const modules = [
    {
      id: 'fundamentos' as ModuleId,
      icon: <BookOpen className="text-blue-600" size={32} />,
      title: 'Consultoría política: fundamentos',
      items: ['Rol del consultor', 'Tipos de consultoría', 'Ética profesional', 'Gestión de crisis'],
      color: 'bg-blue-50'
    },
    {
      id: 'institucional' as ModuleId,
      icon: <Gavel className="text-indigo-600" size={32} />,
      title: 'Análisis institucional y constitucional',
      items: ['Arquitectura del Estado', 'Competencias y límites', 'Procedimientos', 'Reformas'],
      color: 'bg-indigo-50'
    },
    {
      id: 'mapeo' as ModuleId,
      icon: <Map className="text-emerald-600" size={32} />,
      title: 'Mapeo de actores y poder',
      items: ['Identificación de actores', 'Relaciones y conflictos', 'Intereses', 'Matrices de influencia'],
      color: 'bg-emerald-50'
    },
    {
      id: 'discurso' as ModuleId,
      icon: <MessageSquare className="text-amber-600" size={32} />,
      title: 'Análisis de discurso y framing',
      items: ['Marcos cognitivos', 'Narrativas', 'Lenguaje emocional', 'Metáforas y símbolos'],
      color: 'bg-amber-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1.5 rounded-lg">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-bold text-slate-800 text-xl tracking-tight">Informe Confidencial</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Consultor Senior</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">
        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Bienvenido al Centro de Estrategia</h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Combine el conocimiento teórico especializado con nuestra inteligencia artificial para transformar el análisis político en acción estratégica.
            </p>
            <button 
              onClick={onEnterChat}
              className="group bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center gap-3 shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              <Bot size={24} />
              Consultar con Consultor Político AI
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center pointer-events-none">
            <Bot size={300} strokeWidth={0.5} />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <Search className="text-slate-400" size={20} />
            <h2 className="text-xl font-bold text-slate-800">Módulos de Conocimiento Estratégico</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((mod) => (
              <div 
                key={mod.id} 
                onClick={() => onOpenModule(mod.id)}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col cursor-pointer"
              >
                <div className={`${mod.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  {mod.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-4 leading-tight">{mod.title}</h3>
                <ul className="space-y-3 flex-1">
                  {mod.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-gray-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                    Explorar Contenido <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 text-center mt-12">
        <p className="text-[10px] font-bold text-gray-300 tracking-[0.3em] uppercase mb-1">
          Informe Confidencial
        </p>
        <p className="text-[9px] text-gray-400 tracking-wider">
          © 2024 Plataforma de Análisis Político Avanzado.
        </p>
      </footer>
    </div>
  );
};

export default HomeScreen;
