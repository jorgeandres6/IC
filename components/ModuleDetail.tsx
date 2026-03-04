
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ModuleId, ScrapedCreatorProfile, SocialPlatform, SocialProfilesInput } from '../types';
import { apiService } from '../services/api';
import { 
  ArrowLeft, 
  Bot, 
  BookOpen, 
  Map, 
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface ModuleDetailProps {
  moduleId: ModuleId;
  onBack: () => void;
  onEnterChat: () => void;
}

interface SocialSubsection {
  platform: SocialPlatform;
  title: string;
  profileInput: string;
  loading: boolean;
  error: string;
  results: ScrapedCreatorProfile[];
}

interface ProfileAnalysisState {
  loading: boolean;
  analysis: string;
  error: string;
}

const EMPTY_PROFILES: SocialProfilesInput = {
  instagram: '',
  facebook: '',
  tiktok: '',
  x: ''
};

const SOCIAL_SUBSECTIONS: SocialSubsection[] = [
  { platform: 'instagram', title: 'Subsección Instagram', profileInput: '', loading: false, error: '', results: [] },
  { platform: 'facebook', title: 'Subsección Facebook', profileInput: '', loading: false, error: '', results: [] },
  { platform: 'tiktok', title: 'Subsección TikTok', profileInput: '', loading: false, error: '', results: [] },
  { platform: 'x', title: 'Subsección X', profileInput: '', loading: false, error: '', results: [] }
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X'
};

const compactNumberFormatter = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  maximumFractionDigits: 1
});

const fullNumberFormatter = new Intl.NumberFormat('es-ES');

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const humanizeKey = (key: string): string => {
  const normalized = key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  if (!normalized) {
    return 'Campo';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const isUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const renderScalarValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">No disponible</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-slate-700">{value ? 'Sí' : 'No'}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-slate-800 font-semibold">{fullNumberFormatter.format(value)}</span>;
  }

  if (isUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 break-all">
        {value}
      </a>
    );
  }

  return <span className="text-slate-700 break-words">{value}</span>;
};

const ReadableDataNode: React.FC<{ label: string; value: unknown; path: string }> = ({ label, value, path }) => {
  if (Array.isArray(value)) {
    if (!value.length) {
      return (
        <div className="border border-gray-100 rounded-xl p-3 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-sm text-slate-400 mt-1">Lista vacía</p>
        </div>
      );
    }

    return (
      <details className="border border-gray-100 rounded-xl p-3 bg-white">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          {label} ({value.length} elementos)
        </summary>
        <div className="mt-3 space-y-3">
          {value.map((item, index) => (
            <ReadableDataNode
              key={`${path}-${index}`}
              label={`Elemento ${index + 1}`}
              value={item}
              path={`${path}-${index}`}
            />
          ))}
        </div>
      </details>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    if (!entries.length) {
      return (
        <div className="border border-gray-100 rounded-xl p-3 bg-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-sm text-slate-400 mt-1">Sin datos</p>
        </div>
      );
    }

    return (
      <details className="border border-gray-100 rounded-xl p-3 bg-white">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          {label} ({entries.length} campos)
        </summary>
        <div className="mt-3 space-y-3">
          {entries.map(([entryKey, entryValue]) => (
            <ReadableDataNode
              key={`${path}-${entryKey}`}
              label={humanizeKey(entryKey)}
              value={entryValue}
              path={`${path}-${entryKey}`}
            />
          ))}
        </div>
      </details>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <div className="text-sm">{renderScalarValue(value as string | number | boolean | null | undefined)}</div>
    </div>
  );
};

const ReadableDataViewer: React.FC<{ data: unknown }> = ({ data }) => {
  if (!isRecord(data)) {
    return (
      <div className="border border-gray-100 rounded-xl p-3 bg-white">
        <p className="text-sm text-slate-700">{renderScalarValue(data as string | number | boolean | null | undefined)}</p>
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <ReadableDataNode key={`root-${key}`} label={humanizeKey(key)} value={value} path={`root-${key}`} />
      ))}
    </div>
  );
};

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
  const [socialSections, setSocialSections] = useState<SocialSubsection[]>(SOCIAL_SUBSECTIONS);
  const [profileAnalyses, setProfileAnalyses] = useState<Record<string, ProfileAnalysisState>>({});

  const handleProfileInputChange = (platform: SocialPlatform, value: string) => {
    setSocialSections(prev => prev.map(section => (
      section.platform === platform
        ? {
            ...section,
            profileInput: value
          }
        : section
    )));
  };

  const handleExtractProfiles = async (platform: SocialPlatform) => {
    const section = socialSections.find(item => item.platform === platform);
    if (!section) {
      return;
    }

    setSocialSections(prev => prev.map(item => (
      item.platform === platform
        ? { ...item, loading: true, error: '', results: [] }
        : item
    )));

    try {
      const response = await apiService.scrapeCreatorsProfiles({
        ...EMPTY_PROFILES,
        [platform]: section.profileInput
      });

      const extractedProfiles = response.profiles;

      const nextAnalysisState: Record<string, ProfileAnalysisState> = {};
      extractedProfiles.forEach((profile) => {
        const profileKey = getProfileKey(platform, profile);
        nextAnalysisState[profileKey] = {
          loading: true,
          analysis: '',
          error: ''
        };
      });

      if (extractedProfiles.length) {
        setProfileAnalyses(prev => ({ ...prev, ...nextAnalysisState }));
      }

      const analysisResults = await Promise.all(
        extractedProfiles.map(async (profile) => {
          const profileKey = getProfileKey(platform, profile);
          try {
            const analysisResponse = await apiService.analyzeProfileWithGemini(profile);
            return {
              profileKey,
              state: {
                loading: false,
                analysis: analysisResponse.analysis,
                error: ''
              } as ProfileAnalysisState
            };
          } catch (error: any) {
            return {
              profileKey,
              state: {
                loading: false,
                analysis: '',
                error: error?.message || 'No se pudo generar el análisis con Gemini.'
              } as ProfileAnalysisState
            };
          }
        })
      );

      if (analysisResults.length) {
        setProfileAnalyses(prev => {
          const merged = { ...prev };
          analysisResults.forEach(({ profileKey, state }) => {
            merged[profileKey] = state;
          });
          return merged;
        });
      }

      setSocialSections(prev => prev.map(item => (
        item.platform === platform
          ? {
              ...item,
              loading: false,
              error: extractedProfiles.length ? '' : 'No se encontró información para los perfiles ingresados.',
              results: extractedProfiles
            }
          : item
      )));
    } catch (error: any) {
      setSocialSections(prev => prev.map(item => (
        item.platform === platform
          ? {
              ...item,
              loading: false,
              error: error?.message || 'No se pudo consultar la API de Scrape Creators.',
              results: []
            }
          : item
      )));
    }
  };

  const getProfileKey = (sectionPlatform: SocialPlatform, profile: ScrapedCreatorProfile) => {
    return `${sectionPlatform}-${profile.platform}-${profile.username || profile.fullName || 'perfil'}`;
  };

  const renderMetric = (label: string, value: number | null) => (
    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
      <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-lg font-bold text-slate-800" title={value !== null ? String(value) : undefined}>
        {value !== null ? compactNumberFormatter.format(value) : 'N/D'}
      </p>
    </div>
  );

  const formatHandle = (username: string) => username.replace(/^@/, '');

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

        {moduleId === 'mapeo' && (
          <section className="mt-20 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Extracción de perfiles sociales</h3>
              <p className="text-gray-600">
                Ingrese perfiles de Instagram, Facebook, TikTok y X en cada subsección para obtener los datos directamente desde Scrape Creators API.
              </p>
            </div>

            <div className="space-y-6">
              {socialSections.map((section) => (
                <div key={section.platform} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h4 className="text-xl font-bold text-slate-800">{section.title}</h4>
                    <button
                      onClick={() => handleExtractProfiles(section.platform)}
                      disabled={section.loading}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {section.loading ? <Loader2 size={16} className="animate-spin" /> : null}
                      {section.loading ? 'Extrayendo y analizando...' : 'Obtener data del perfil'}
                    </button>
                  </div>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">{PLATFORM_LABELS[section.platform]}</span>
                    <input
                      type="text"
                      value={section.profileInput}
                      onChange={(e) => handleProfileInputChange(section.platform, e.target.value)}
                      placeholder={`https://... o @usuario en ${PLATFORM_LABELS[section.platform]}`}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </label>

                  {section.error && (
                    <div className="mt-5 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                      {section.error}
                    </div>
                  )}

                  {!!section.results.length && (
                    <div className="mt-6 grid grid-cols-1 gap-5">
                      {section.results.map((profile) => {
                        const profileKey = getProfileKey(section.platform, profile);
                        const analysisState = profileAnalyses[profileKey] || { loading: false, analysis: '', error: '' };

                        return (
                        <div key={profileKey} className="rounded-2xl border border-gray-100 p-5 bg-slate-50/70">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700">{PLATFORM_LABELS[profile.platform]}</p>
                              <p className="text-lg font-bold text-slate-900">{profile.fullName || `@${profile.username ? formatHandle(profile.username) : 'perfil'}`}</p>
                              <p className="text-sm text-gray-500">@{profile.username ? formatHandle(profile.username) : 'sin-usuario'}</p>
                            </div>
                            {profile.verified && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                                Verificado
                              </span>
                            )}
                          </div>

                          {profile.biography && (
                            <p className="text-sm text-gray-700 leading-relaxed mb-4">{profile.biography}</p>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {renderMetric('Seguidores', profile.followers)}
                            {renderMetric('Siguiendo', profile.following)}
                            {renderMetric('Publicaciones', profile.posts)}
                            {renderMetric('Likes', profile.likes)}
                          </div>

                          {profile.profileUrl && (
                            <a
                              href={profile.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                              Ver perfil
                            </a>
                          )}

                          <div className="mt-4">
                            {analysisState.loading && (
                              <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold">
                                <Loader2 size={14} className="animate-spin" />
                                Analizando perfil con Gemini...
                              </div>
                            )}

                            {analysisState.error && (
                              <div className="mt-3 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                                {analysisState.error}
                              </div>
                            )}

                            {analysisState.analysis && (
                              <div className="mt-3 bg-white border border-blue-100 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wider font-semibold text-blue-700 mb-2">Análisis con Gemini</p>
                                <div className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2">
                                  <ReactMarkdown>{analysisState.analysis}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>

                          <details className="mt-4 bg-white border border-gray-200 rounded-xl p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                              Ver todos los datos extraídos
                            </summary>
                            <div className="mt-3 max-h-96 overflow-auto pr-1">
                              <ReadableDataViewer data={profile.raw} />
                            </div>
                          </details>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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
