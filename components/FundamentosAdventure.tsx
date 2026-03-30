import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Sparkles, Swords, HeartPulse, RotateCcw, ChevronRight, MapPin } from 'lucide-react';

type GamePhase = 'intro' | 'travel' | 'decision' | 'outcome' | 'complete';

type TileType = 'F' | 'G' | 'R' | 'P' | 'W' | 'B' | '.' | 'S' | '0' | '1' | '2' | '3';

interface Point {
  x: number;
  y: number;
}

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

interface Npc {
  name: string;
  role: string;
  x: number;
  y: number;
  shirt: string;
  hair: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const INITIAL_STATS: GameStats = {
  estrategia: 30,
  etica: 30,
  reaccion: 30,
  energia: 100
};

const TILE_MAP: string[] = [
  'FFFFFFFFFFF',
  'FGRRRPGRBBF',
  'FGS..R...0F',
  'FGRRRGGGRRF',
  'F..1.R.P..F',
  'FBRR.RRRRBF',
  'F..G.2.G..F',
  'FWWG.R.G3.F',
  'F...RRR...F',
  'FFFFFFFFFFF'
];

const MAP_ROWS = TILE_MAP.length;
const MAP_COLS = TILE_MAP[0].length;

const MISSION_TILES: Point[] = [
  { x: 9, y: 2 },
  { x: 3, y: 4 },
  { x: 5, y: 6 },
  { x: 8, y: 7 }
];

const START_TILE: Point = { x: 2, y: 2 };

const NPCS: Npc[] = [
  { name: 'Lina', role: 'Periodista', x: 4, y: 2, shirt: '#f97316', hair: '#3f3f46' },
  { name: 'Mario', role: 'Dirigente vecinal', x: 6, y: 4, shirt: '#2563eb', hair: '#7c2d12' },
  { name: 'Rocio', role: 'Analista junior', x: 2, y: 6, shirt: '#16a34a', hair: '#1e293b' },
  { name: 'Iker', role: 'Vocero', x: 7, y: 8, shirt: '#9333ea', hair: '#312e81' }
];

const MISSIONS: Mission[] = [
  {
    place: 'Plaza de Briefing',
    title: 'Rol del consultor',
    briefing: 'Tu candidata pierde terreno en sondeos. Debes definir tu rol estrategico antes del primer debate televisado.',
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
    place: 'Avenida de Campana',
    title: 'Tipos de consultoria',
    briefing: 'El comando pide resultados inmediatos y tambien un plan de gobierno sostenible para el mediano plazo.',
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
    place: 'Torre de Etica Publica',
    title: 'Etica profesional',
    briefing: 'Un actor aliado propone desinformacion para dañar al adversario en redes durante un pico de audiencia.',
    question: 'Cual es tu respuesta como consultor?',
    options: [
      {
        label: 'Rechazar y activar narrativa basada en evidencia',
        consequence: 'La reputacion de la candidata mejora y el equipo confia mas en tu criterio.',
        impact: { etica: 14, estrategia: 6, reaccion: 2, energia: -8 }
      },
      {
        label: 'Aceptar parcialmente para ganar traccion rapida',
        consequence: 'Obtienes ruido mediatico, pero se erosiona la confianza interna.',
        impact: { reaccion: 9, etica: -12, energia: -10 }
      },
      {
        label: 'Evitar la decision y delegar el riesgo',
        consequence: 'La crisis crece y pierdes control del marco narrativo.',
        impact: { estrategia: -8, etica: -5, reaccion: -4, energia: -6 }
      }
    ]
  },
  {
    place: 'Centro de Crisis',
    title: 'Gestion de crisis',
    briefing: 'A 48 horas de la eleccion estalla una acusacion falsa. Debes responder en minutos con precision.',
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

const WALKABLE_TILES = new Set<TileType>(['G', 'R', 'P', '.', 'S', '0', '1', '2', '3']);

const FundamentosAdventure: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [missionIndex, setMissionIndex] = useState(0);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [lastConsequence, setLastConsequence] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [playerPos, setPlayerPos] = useState<Point>(START_TILE);
  const [travelMessage, setTravelMessage] = useState('Explora la ciudad y llega al primer punto tactico.');
  const [stepState, setStepState] = useState(false);

  const activeMission = MISSIONS[missionIndex];
  const targetTile = MISSION_TILES[missionIndex];

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
    setPlayerPos(START_TILE);
    setTravelMessage('Explora la ciudad y llega al primer punto tactico.');
    setStepState(false);
  };

  const startGame = () => {
    setPhase('travel');
    setMissionIndex(0);
    setStats(INITIAL_STATS);
    setLastConsequence('');
    setLog([]);
    setPlayerPos(START_TILE);
    setTravelMessage('Usa flechas o pad para llegar a Plaza de Briefing.');
    setStepState(false);
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
    setLog((prev) => [...prev, `${activeMission.title}: ${option.label}`]);
    setPhase('outcome');
  };

  const goToNextMission = () => {
    if (missionIndex >= MISSIONS.length - 1) {
      setPhase('complete');
      return;
    }

    const nextMissionIndex = missionIndex + 1;
    const nextMission = MISSIONS[nextMissionIndex];
    setMissionIndex(nextMissionIndex);
    setPhase('travel');
    setTravelMessage(`Nueva ruta desbloqueada: llega a ${nextMission.place}.`);
  };

  const isWalkable = (nextPos: Point) => {
    if (nextPos.y < 0 || nextPos.y >= MAP_ROWS) {
      return false;
    }

    if (nextPos.x < 0 || nextPos.x >= MAP_COLS) {
      return false;
    }

    const tile = TILE_MAP[nextPos.y][nextPos.x] as TileType;
    return WALKABLE_TILES.has(tile);
  };

  const movePlayer = (dx: number, dy: number) => {
    if (phase !== 'travel') {
      return;
    }

    setPlayerPos((prev) => {
      const nextPos = { x: prev.x + dx, y: prev.y + dy };

      if (!isWalkable(nextPos)) {
        setTravelMessage('Bloqueado. Usa calles o zonas verdes para rodear.');
        return prev;
      }

      setStepState((old) => !old);

      if (nextPos.x === targetTile.x && nextPos.y === targetTile.y) {
        setPhase('decision');
        setTravelMessage(`Encuentro activado en ${activeMission.place}.`);
      } else {
        setTravelMessage(`Explorando: rumbo a ${activeMission.place}.`);
      }

      return nextPos;
    });
  };

  useEffect(() => {
    if (phase !== 'travel') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePlayer(1, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, missionIndex]);

  const getTileClassName = (x: number, y: number) => {
    const tile = TILE_MAP[y][x] as TileType;
    const isTarget = targetTile.x === x && targetTile.y === y && phase !== 'complete';

    if (isTarget && phase === 'travel') {
      return 'tile-target';
    }

    if (tile === 'F') {
      return 'tile-forest';
    }

    if (tile === 'R') {
      return 'tile-road';
    }

    if (tile === 'P') {
      return 'tile-plaza';
    }

    if (tile === 'W') {
      return 'tile-water';
    }

    if (tile === 'B') {
      return 'tile-building';
    }

    if (tile === '0' || tile === '1' || tile === '2' || tile === '3') {
      const tileMission = Number(tile);
      if (tileMission < missionIndex || phase === 'complete') {
        return 'tile-cleared';
      }
      return 'tile-checkpoint';
    }

    if (tile === 'S') {
      return 'tile-start';
    }

    if (tile === '.') {
      return 'tile-sidewalk';
    }

    return 'tile-grass';
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
    <section className="mt-20 rounded-3xl border-4 border-slate-900 bg-[#f5efcf] shadow-[12px_12px_0_0_#0f172a] overflow-hidden adventure-shell">
      <div className="bg-[#d65a31] border-b-4 border-slate-900 px-6 py-4 text-[#fff4de]">
        <p className="text-xs uppercase tracking-[0.25em] font-bold adventure-display">Modo Aventura</p>
        <h3 className="text-2xl md:text-3xl font-black leading-tight adventure-display">Consultoria Politica: Ruta Fundamentos</h3>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#fff8e5] border-4 border-slate-900 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 adventure-display">Mapa de ciudad</p>
              <p className="text-xs font-bold text-slate-600">Etapa {Math.min(missionIndex + 1, MISSIONS.length)} / {MISSIONS.length}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {MISSIONS.map((mission, idx) => {
                const isCurrent = idx === missionIndex && phase !== 'complete';
                const isCompleted = idx < missionIndex || phase === 'complete';

                return (
                  <div
                    key={mission.title}
                    className={`rounded-xl border-2 p-3 min-h-24 ${
                      isCurrent
                        ? 'bg-[#ffd166] border-slate-900'
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

            <div className="retro-screen rounded-xl border-4 border-slate-900 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs uppercase font-bold tracking-widest text-slate-700 adventure-display">Escenario urbano</p>
                <p className="text-[11px] font-bold text-slate-700">Calles, parque y centro civico</p>
              </div>

              <div className="retro-map-wrap">
                <div
                  className="retro-map"
                  style={{
                    gridTemplateColumns: `repeat(${MAP_COLS}, var(--tile-size))`,
                    gridTemplateRows: `repeat(${MAP_ROWS}, var(--tile-size))`
                  }}
                >
                  {TILE_MAP.flatMap((row, y) =>
                    row.split('').map((_, x) => (
                      <div key={`tile-${x}-${y}`} className={`retro-tile ${getTileClassName(x, y)}`} />
                    ))
                  )}

                  {NPCS.map((npc) => (
                    <div
                      key={npc.name}
                      className="npc-chip"
                      style={{
                        left: `calc(${npc.x} * var(--tile-size) + var(--tile-size) / 6)`,
                        top: `calc(${npc.y} * var(--tile-size) + var(--tile-size) / 8)`
                      }}
                      title={`${npc.name} - ${npc.role}`}
                    >
                      <div className="sprite-human">
                        <span className="sprite-hair" style={{ backgroundColor: npc.hair }} />
                        <span className="sprite-head" />
                        <span className="sprite-body" style={{ backgroundColor: npc.shirt }} />
                      </div>
                    </div>
                  ))}

                  <div
                    className={`player-chip ${stepState ? 'player-step' : ''}`}
                    style={{
                      left: `calc(${playerPos.x} * var(--tile-size) + var(--tile-size) / 6)`,
                      top: `calc(${playerPos.y} * var(--tile-size) + var(--tile-size) / 8)`
                    }}
                    title="Consultor principal"
                  >
                    <div className="sprite-human sprite-player">
                      <span className="sprite-hair" style={{ backgroundColor: '#111827' }} />
                      <span className="sprite-head" />
                      <span className="sprite-body" style={{ backgroundColor: '#1d4ed8' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                <button
                  onClick={() => movePlayer(0, -1)}
                  disabled={phase !== 'travel'}
                  className="col-start-2 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Arriba
                </button>
                <button
                  onClick={() => movePlayer(-1, 0)}
                  disabled={phase !== 'travel'}
                  className="col-start-1 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Izq
                </button>
                <button
                  onClick={() => movePlayer(1, 0)}
                  disabled={phase !== 'travel'}
                  className="col-start-3 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Der
                </button>
                <button
                  onClick={() => movePlayer(0, 1)}
                  disabled={phase !== 'travel'}
                  className="col-start-2 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Abajo
                </button>
              </div>

              <div className="mt-3 bg-[#f2f4f9] border border-slate-300 rounded-lg p-2.5 text-xs text-slate-700 flex items-center gap-2">
                <MapPin size={14} className="text-red-600 shrink-0" />
                {travelMessage}
              </div>
            </div>

            <div className="mt-4 p-4 bg-white border-2 border-slate-900 rounded-xl">
              <p className="text-xs uppercase font-bold tracking-widest text-slate-500 adventure-display">Bitacora del consultor</p>
              {!log.length ? (
                <p className="text-sm text-slate-700 mt-2">Sin movimientos registrados todavia.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
                  {log.slice(-4).map((item, idx) => (
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 adventure-display">Panel de estado</p>
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
                Recorre un escenario urbano, conversa con actores politicos y activa eventos en cada punto clave. La jugabilidad combina movimiento RPG con decisiones estrategicas reales.
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

          {phase === 'travel' && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-900 bg-[#fff4de] text-xs font-bold uppercase tracking-wider text-slate-700">
                <Swords size={14} />
                Exploracion activa
              </div>
              <h4 className="text-2xl font-black text-slate-900">Llega a {activeMission.place}</h4>
              <p className="text-slate-700">
                En esta fase te desplazas por la ciudad y eliges ruta. Al llegar al punto resaltado, se abre el encuentro principal del modulo.
              </p>
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
                Tu score final fue <span className="font-black text-slate-900">{score}</span>. Repite la aventura para probar rutas alternativas entre etica, tactica y velocidad de respuesta.
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
