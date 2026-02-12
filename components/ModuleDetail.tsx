
import React from 'react';
import { ModuleId } from '../types';
import { 
  ArrowLeft, 
  Bot, 
  BookOpen, 
  Gavel, 
  Map, 
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface ModuleDetailProps {
  moduleId: ModuleId;
  onBack: () => void;
  onEnterChat: () => void;
}

const MODULE_DATA = {
  fundamentos: {
    title: 'Consultoría política: fundamentos',
    icon: <BookOpen className="text-blue-600" />,
    color: 'blue',
    sections: [
      {
        subtitle: 'Rol del consultor',
        content: 'El consultor no es solo un asesor, es un arquitecto de la realidad política. Su rol implica traducir la técnica en narrativa y la ambición en estrategia viable.',
        points: ['Puente entre datos y decisiones', 'Gestor de la reputación pública', 'Arquitecto de escenarios futuros']
      },
      {
        subtitle: 'Tipos de consultoría',
        content: 'Desde la consultoría de campaña (corto plazo) hasta la de gobierno (largo plazo). Cada una requiere herramientas y mentalidades distintas.',
        points: ['Estratégica y electoral', 'Gestión de crisis', 'Imagen y comunicación', 'Políticas públicas']
      },
      {
        subtitle: 'Ética profesional',
        content: 'La línea entre el pragmatismo y la integridad es delgada. La confidencialidad es el activo más valioso de un consultor senior.',
        points: ['Confidencialidad absoluta', 'Honestidad con el cliente', 'Responsabilidad democrática']
      },
      {
        subtitle: 'Gestión de crisis y estrategia',
        content: 'Toda crisis es una oportunidad de reencuadre. La estrategia debe ser flexible ante el caos pero firme en sus objetivos finales.',
        points: ['Detección temprana de señales', 'Control de daños narrativo', 'Recuperación de iniciativa']
      }
    ]
  },
  institucional: {
    title: 'Análisis institucional y constitucional',
    icon: <Gavel className="text-indigo-600" />,
    color: 'indigo',
    sections: [
      {
        subtitle: 'Arquitectura del Estado',
        content: 'Comprender cómo interactúan los poderes es vital para saber dónde residen los frenos y contrapesos reales de una decisión política.',
        points: ['Equilibrio de poderes', 'Distribución territorial', 'Organismos autónomos']
      },
      {
        subtitle: 'Competencias y límites',
        content: 'El derecho constitucional marca el campo de juego. Una estrategia que ignore los límites legales está condenada al fracaso institucional.',
        points: ['Jerarquía normativa', 'Atribuciones específicas', 'Seguridad jurídica']
      },
      {
        subtitle: 'Procedimientos y controles',
        content: 'La burocracia tiene su propia lógica. Los controles parlamentarios y judiciales definen la viabilidad de cualquier reforma estratégica.',
        points: ['Proceso legislativo', 'Fiscalización y transparencia', 'Acción de inconstitucionalidad']
      },
      {
        subtitle: 'Reformas y precedentes',
        content: 'La historia constitucional enseña cómo se han resuelto crisis previas. Los precedentes son la brújula en territorio desconocido.',
        points: ['Jurisprudencia clave', 'Historia de enmiendas', 'Tendencias de reforma']
      }
    ]
  },
  mapeo: {
    title: 'Mapeo de actores y poder',
    icon: <Map className="text-emerald-600" />,
    color: 'emerald',
    sections: [
      {
        subtitle: 'Identificación de actores clave',
        content: 'No todos los actores visibles son los que deciden. El mapeo identifica a los "Gatekeepers" y a los poderes fácticos detrás de escena.',
        points: ['Stakeholders primarios', 'Grupos de presión', 'Líderes de opinión']
      },
      {
        subtitle: 'Relaciones, alianzas y conflictos',
        content: 'La política es un fluido de alianzas. Entender quién no puede sentarse con quién es tan importante como saber quiénes son amigos.',
        points: ['Convergencias tácticas', 'Historial de traiciones', 'Puntos de fricción']
      },
      {
        subtitle: 'Intereses, incentivos y capacidades',
        content: '¿Qué motiva a cada actor? El análisis de incentivos permite predecir comportamientos ante una nueva propuesta o crisis.',
        points: ['Beneficios políticos', 'Recursos financieros', 'Capacidad de movilización']
      },
      {
        subtitle: 'Matrices de poder e influencia',
        content: 'Visualizamos la cuota de poder real. Cruce de variables: influencia alta/baja versus interés alto/bajo en el tema central.',
        points: ['Cuadrantes de influencia', 'Evolución del peso político', 'Nodos de decisión central']
      }
    ]
  },
  discurso: {
    title: 'Análisis de discurso y framing',
    icon: <MessageSquare className="text-amber-600" />,
    color: 'amber',
    sections: [
      {
        subtitle: 'Marcos cognitivos (Framing)',
        content: 'La realidad no existe, existe la interpretación. Definir el marco de la discusión es ganar la mitad de la batalla política.',
        points: ['Encuadre de problemas', 'Metáforas de base', 'Filtros mentales']
      },
      {
        subtitle: 'Narrativas dominantes',
        content: '¿Quién cuenta la mejor historia? Las narrativas exitosas son simples, coherentes y ofrecen un villano y un héroe claro.',
        points: ['Storytelling político', 'Mitos fundacionales', 'Estructura de relato']
      },
      {
        subtitle: 'Lenguaje emocional',
        content: 'La razón convence, pero la emoción moviliza. El análisis detecta las palabras "gatillo" que activan la indignación o la esperanza.',
        points: ['Apelación al miedo/esperanza', 'Léxico de identidad', 'Resonancia afectiva']
      },
      {
        subtitle: 'Identificación de metáforas y símbolos',
        content: 'Los símbolos condensan significados complejos. Una imagen o una frase hecha puede valer más que un programa de gobierno.',
        points: ['Semiótica del poder', 'Símbolos de unidad', 'Anclaje visual']
      }
    ]
  }
};

const ModuleDetail: React.FC<ModuleDetailProps> = ({ moduleId, onBack, onEnterChat }) => {
  const data = MODULE_DATA[moduleId];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Module Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gray-50 rounded-lg">{data.icon}</span>
            <h1 className="font-bold text-slate-800 hidden md:block">{data.title}</h1>
          </div>
        </div>
        <button 
          onClick={onEnterChat}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-all text-sm font-bold"
        >
          <Bot size={18} />
          <span>Consultar IA sobre esto</span>
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
        {/* Intro */}
        <div className="mb-12">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 bg-${data.color}-100 text-${data.color}-700`}>
            Módulo Estratégico
          </span>
          <h2 className="text-4xl font-black text-slate-900 mb-6">{data.title}</h2>
          <div className="h-1.5 w-24 bg-slate-800 rounded-full"></div>
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {data.sections.map((section, idx) => (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-black text-slate-200">0{idx + 1}</span>
                    <h3 className="text-xl font-bold text-slate-800">{section.subtitle}</h3>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-2 mb-2 text-blue-600">
                      <Lightbulb size={18} />
                      <span className="text-xs font-bold uppercase tracking-tight">Claves de éxito</span>
                    </div>
                    <ul className="space-y-2">
                      {section.points.map((p, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm leading-relaxed text-gray-700 text-lg">
                  {section.content}
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-slate-800">
                    <p className="text-sm italic font-medium text-slate-600">
                      "La clave estratégica aquí radica en la capacidad de anticipar el movimiento del adversario antes de que este siquiera considere su posición inicial."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <ShieldAlert className="mx-auto mb-6 text-blue-400" size={48} />
            <h3 className="text-2xl font-bold mb-4">¿Necesita aplicar este conocimiento a un caso real?</h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Nuestro Consultor Político AI está entrenado con estos marcos teóricos para ayudarle a redactar, analizar y mapear en tiempo real.
            </p>
            <button 
              onClick={onEnterChat}
              className="bg-white text-slate-900 font-bold py-4 px-10 rounded-2xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Iniciar sesión de análisis <ChevronRight size={20} />
            </button>
          </div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 text-center">
        <p className="text-[10px] font-bold text-gray-300 tracking-[0.4em] uppercase">
          Informe Confidencial
        </p>
      </footer>
    </div>
  );
};

export default ModuleDetail;
