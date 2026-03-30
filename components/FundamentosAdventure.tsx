import React, { useMemo, useState } from 'react';
import { Shield, Sparkles, Swords, HeartPulse, RotateCcw, ChevronRight } from 'lucide-react';

type GamePhase = 'intro' | 'decision' | 'outcome' | 'complete';

interface GameStats {
  estrategia: number;
  etica: number;
  reaccion: number;
  energia: number;
}

interface MissionOption {
  label: string;
  consequence: string;
  impact: Partial<GameStats>;
}

interface Mission {
  place: string;
  title: string;
  briefing: string;
  question: string;
  options: MissionOption[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const INITIAL_STATS: GameStats = {
  estrategia: 30,
  etica: 30,
  reaccion: 30,
  energia: 100
};

const MISSIONS: Mission[] = [
  {
    place: 'Pueblo Brifing',
    title: 'Rol del consultor',
    briefing: 'Tu candidata pierde terreno en sondeos. Debes definir tu rol en la campana antes del primer debate.',
    question: 'Que prioridad eliges para abrir la mision?',
    options: [
      {
        label: 'Construir tablero de datos y escenarios',
        consequence: 'La campana gana foco tactico y mejores decisiones diarias.',
        impact: { estrategia: 12, energia: -8 }
      },
      {
        label: 'Improvisar mensajes segun la tendencia del dia',
        consequence: 'Se siente dinamico, pero la narrativa pierde coherencia.',
        impact: { reaccion: 5, estrategia: -6, energia: -12 }
      },
      {
        label: 'Definir equipo y protocolos de consulta',
        consequence: 'Tu rol queda claro y se acelera la coordinacion politica.',
        impact: { estrategia: 8, etica: 6, energia: -6 }
      }
    ]
  },
  {
    place: 'Ciudad Estrategia',
    title: 'Tipos de consultoria',
    briefing: 'El comando quiere resultados inmediatos y tambien un plan de gobierno sostenible.',
    question: 'Como equilibras campana y gestion?',
    options: [
      {
        label: 'Separar celulas: una electoral y otra de politica publica',
        consequence: 'Se organiza mejor el trabajo y baja el ruido en decisiones.',
        impact: { estrategia: 10, reaccion: 6, energia: -10 }
      },
      {
        label: 'Concentrar todo en mensajes de corto plazo',
        consequence: 'Sube el impacto inicial, pero dejas vacio el plan de gobierno.',
        impact: { reaccion: 8, estrategia: -7, etica: -4, energia: -8 }
      },
      {
        label: 'Priorizar solo el programa tecnico sin narrativa',
        consequence: 'El plan es solido, pero no conecta con el electorado.',
        impact: { etica: 7, reaccion: -6, energia: -7 }
      }
    ]
  },
  {
    place: 'Torre Etica',
    title: 'Etica profesional',
    briefing: 'Un actor aliado propone desinformacion para dañar al adversario en redes.',
    question: 'Cual es tu respuesta como consultor?',
    options: [
      {
        label: 'Rechazar y activar una narrativa basada en evidencia',
        consequence: 'La reputacion de la candidata mejora y el equipo confia mas en tu criterio.',
        impact: { etica: 14, estrategia: 6, reaccion: 2, energia: -8 }
      },
      {
        label: 'Aceptar parcialmente para ganar traccion rapida',
        consequence: 'Obtienes ruido mediatico, pero se erosiona la confianza interna.',
        impact: { reaccion: 9, etica: -12, energia: -10 }
      },
      {
        label: 'Evitar decision y dejar que otros operen',
        consequence: 'La crisis crece y pierdes control del marco narrativo.',
        impact: { estrategia: -8, etica: -5, reaccion: -4, energia: -6 }
      }
    ]
  },
  {
    place: 'Liga de Crisis',
    title: 'Gestion de crisis',
    briefing: 'A 48 horas de la eleccion estalla una acusacion falsa. Debes responder en minutos.',
    question: 'Que secuencia ejecutas primero?',
    options: [
      {
        label: 'Centro de comando, voceria unica y evidencia trazable',
        consequence: 'Contienes la crisis y recuperas iniciativa publica.',
        impact: { estrategia: 12, reaccion: 10, etica: 4, energia: -14 }
      },
      {
        label: 'Responder con ataques personales al rival',
        consequence: 'Moviliza a la base dura, pero amplifica el conflicto.',
        impact: { reaccion: 6, estrategia: -5, etica: -8, energia: -10 }
      },
      {
        label: 'Esperar a que pase la tormenta sin comunicar',
        consequence: 'El vacio informativo lo llena el adversario.',
        impact: { reaccion: -9, estrategia: -7, energia: -5 }
      }
    ]
  }
];

const FundamentosAdventure: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [missionIndex, setMissionIndex] = useState(0);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [lastConsequence, setLastConsequence] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const activeMission = MISSIONS[missionIndex];

  const score = useMemo(() => {
    return stats.estrategia + stats.etica + stats.reaccion + Math.floor(stats.energia / 2);
  }, [stats]);

  const rank = useMemo(() => {
    if (score >= 185) {
      return 'Gran Maestro de Estrategia';
    }
    if (score >= 150) {
      return 'Consultor Elite';
    }
    if (score >= 120) {
      return 'Consultor en Ascenso';
    }
    return 'Aprendiz de Territorio';
  }, [score]);

  const resetGame = () => {
    setPhase('intro');
    setMissionIndex(0);
    setStats(INITIAL_STATS);
    setLastConsequence('');
    setLog([]);
  };

  const startGame = () => {
    setPhase('decision');
    setMissionIndex(0);
    setStats(INITIAL_STATS);
    setLastConsequence('');
    setLog([]);
  };

  const applyOption = (option: MissionOption) => {
    const nextStats: GameStats = {
      estrategia: clamp(stats.estrategia + (option.impact.estrategia ?? 0), 0, 100),
      etica: clamp(stats.etica + (option.impact.etica ?? 0), 0, 100),
      reaccion: clamp(stats.reaccion + (option.impact.reaccion ?? 0), 0, 100),
      energia: clamp(stats.energia + (option.impact.energia ?? 0), 0, 100)
    };

    setStats(nextStats);
    setLastConsequence(option.consequence);
    setLog((prev) => [
      ...prev,
      `${activeMission.title}: ${option.label}`
    ]);
    setPhase('outcome');
  };

  const goToNextMission = () => {
    if (missionIndex >= MISSIONS.length - 1) {
      setPhase('complete');
      return;
    }

    setMissionIndex((prev) => prev + 1);
    setPhase('decision');
  };

  const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div>
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-sm border-2 border-slate-900 bg-white overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <section className="mt-20 rounded-3xl border-4 border-slate-900 bg-[#f7eecb] shadow-[10px_10px_0_0_#0f172a] overflow-hidden">
      <div className="bg-[#d65a31] border-b-4 border-slate-900 px-6 py-4 text-[#fff4de]">
        <p className="text-xs uppercase tracking-[0.25em] font-bold">Modo Aventura</p>
        <h3 className="text-2xl md:text-3xl font-black leading-tight">Consultoria Politica: Ruta Fundamentos</h3>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#fff8e5] border-4 border-slate-900 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Mapa de mision</p>
              <p className="text-xs font-bold text-slate-600">Etapa {Math.min(missionIndex + 1, MISSIONS.length)} / {MISSIONS.length}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MISSIONS.map((mission, idx) => {
                const isCurrent = idx === missionIndex && phase !== 'complete';
                const isCompleted = idx < missionIndex || phase === 'complete';

                return (
                  <div
                    key={mission.title}
                    className={`rounded-xl border-2 p-3 min-h-24 ${
                      isCurrent
                        ? 'bg-[#ffd166] border-slate-900 animate-pulse'
                        : isCompleted
                        ? 'bg-[#80ed99] border-slate-900'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-600">{mission.place}</p>
                    <p className="text-sm font-black text-slate-900 mt-1 leading-tight">{mission.title}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-white border-2 border-slate-900 rounded-xl">
              <p className="text-xs uppercase font-bold tracking-widest text-slate-500">Bitacora del consultor</p>
              {!log.length ? (
                <p className="text-sm text-slate-700 mt-2">Sin movimientos registrados todavia.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
                  {log.slice(-3).map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2">
                      <span className="font-black text-[#d65a31]">&gt;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border-4 border-slate-900 rounded-2xl p-4 md:p-5 space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Panel de estado</p>
            <StatBar label="Estrategia" value={stats.estrategia} color="bg-blue-600" />
            <StatBar label="Etica" value={stats.etica} color="bg-emerald-600" />
            <StatBar label="Reaccion" value={stats.reaccion} color="bg-amber-500" />
            <StatBar label="Energia" value={stats.energia} color="bg-rose-500" />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border-2 border-slate-900 rounded-xl p-3 bg-slate-100">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Puntaje</p>
                <p className="text-xl font-black text-slate-900">{score}</p>
              </div>
              <div className="border-2 border-slate-900 rounded-xl p-3 bg-slate-100">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Rango</p>
                <p className="text-sm font-black text-slate-900 leading-tight">{rank}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-900 rounded-2xl p-5 md:p-6">
          {phase === 'intro' && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-900 bg-[#ffedd5] text-xs font-bold uppercase tracking-wider text-slate-700">
                <Sparkles size={14} />
                Tutorial rapido
              </div>
              <h4 className="text-2xl font-black text-slate-900">Bienvenido a la Liga de Consultoria Politica</h4>
              <p className="text-slate-700 leading-relaxed">
                Recorre cuatro zonas criticas del modulo de fundamentos y toma decisiones como consultor senior. Cada accion modifica tu estrategia, etica, capacidad de reaccion y energia.
              </p>
              <button
                onClick={startGame}
                className="inline-flex items-center gap-2 bg-[#d65a31] text-white font-black px-5 py-3 rounded-xl border-2 border-slate-900 hover:bg-[#c54e26] transition-colors"
              >
                Iniciar aventura
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {phase === 'decision' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-slate-900 bg-[#ffe8d6]">
                  <Shield size={13} />
                  {activeMission.place}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-slate-900 bg-[#e2e8f0]">
                  <Swords size={13} />
                  Encuentro estrategico
                </span>
              </div>
              <h4 className="text-2xl font-black text-slate-900">{activeMission.title}</h4>
              <p className="text-slate-700">{activeMission.briefing}</p>
              <p className="text-sm font-bold text-slate-900">{activeMission.question}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeMission.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => applyOption(option)}
                    className="text-left border-2 border-slate-900 rounded-xl p-4 bg-[#fffaf0] hover:bg-[#ffedc2] transition-colors"
                  >
                    <p className="font-bold text-slate-900 text-sm leading-snug">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'outcome' && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-900 bg-[#dcfce7] text-xs font-bold uppercase tracking-wider text-slate-700">
                <HeartPulse size={14} />
                Resultado del turno
              </div>
              <h4 className="text-2xl font-black text-slate-900">Decision ejecutada</h4>
              <p className="text-slate-700">{lastConsequence}</p>
              <button
                onClick={goToNextMission}
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-black px-5 py-3 rounded-xl border-2 border-slate-900 hover:bg-slate-700 transition-colors"
              >
                {missionIndex === MISSIONS.length - 1 ? 'Ver resultado final' : 'Avanzar a la siguiente zona'}
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {phase === 'complete' && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-900 bg-[#fee2e2] text-xs font-bold uppercase tracking-wider text-slate-700">
                Liga completada
              </div>
              <h4 className="text-2xl font-black text-slate-900">Cierre de campana: {rank}</h4>
              <p className="text-slate-700">
                Tu score final fue <span className="font-black text-slate-900">{score}</span>. Repite la aventura para probar otras rutas y comparar decisiones eticas vs tacticas bajo presion.
              </p>
              <button
                onClick={resetGame}
                className="inline-flex items-center gap-2 bg-[#d65a31] text-white font-black px-5 py-3 rounded-xl border-2 border-slate-900 hover:bg-[#c54e26] transition-colors"
              >
                <RotateCcw size={17} />
                Jugar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FundamentosAdventure;
