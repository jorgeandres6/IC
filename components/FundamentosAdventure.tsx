import React, { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
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

interface SceneHooks {
  onReach: () => void;
  onBlocked: () => void;
  onMove: () => void;
}

const TILE_MAP: string[] = [
  'FFFFFFFFFFFFFF',
  'FGRRRRPGRBBBFF',
  'FGS...R....0FF',
  'FGRRRRGGGRRRFF',
  'F..1..R.P...FF',
  'FBRR..RRRRRBFF',
  'F..G..2..G..FF',
  'FWWG.RRR.G3.FF',
  'F...RRR.....FF',
  'FFFFFFFFFFFFFF'
];

const MAP_ROWS = TILE_MAP.length;
const MAP_COLS = TILE_MAP[0].length;
const TILE_SIZE = 40;
const VIEW_WIDTH = MAP_COLS * TILE_SIZE;
const VIEW_HEIGHT = MAP_ROWS * TILE_SIZE;

const MISSION_TILES: Point[] = [
  { x: 10, y: 2 },
  { x: 3, y: 4 },
  { x: 6, y: 6 },
  { x: 10, y: 7 }
];

const START_TILE: Point = { x: 2, y: 2 };

const BLOCKED = new Set<TileType>(['F', 'W', 'B']);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const INITIAL_STATS: GameStats = {
  estrategia: 30,
  etica: 30,
  reaccion: 30,
  energia: 100
};

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

const toPixels = (point: Point) => ({
  x: point.x * TILE_SIZE + TILE_SIZE / 2,
  y: point.y * TILE_SIZE + TILE_SIZE / 2
});

class AdventureScene extends Phaser.Scene {
  private hooks: SceneHooks;
  private missionTarget: Point;
  private player!: Phaser.GameObjects.Container;
  private targetGlow?: Phaser.GameObjects.Arc;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moving = false;
  private tilePos: Point = { ...START_TILE };
  private travelEnabled = false;

  constructor(hooks: SceneHooks, missionTarget: Point) {
    super({ key: 'adventure-scene' });
    this.hooks = hooks;
    this.missionTarget = missionTarget;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#9fd0ff');
    this.drawMap();
    this.drawNPCs();

    this.player = this.createHumanSprite('#1d4ed8', '#0f172a');
    const startPx = toPixels(START_TILE);
    this.player.setPosition(startPx.x, startPx.y);
    this.tilePos = { ...START_TILE };

    this.targetGlow = this.add.circle(0, 0, TILE_SIZE * 0.33, 0xfacc15, 0.55).setDepth(4);
    this.targetGlow.setStrokeStyle(2, 0x92400e, 0.9);

    this.updateTargetMarker();

    this.tweens.add({
      targets: this.targetGlow,
      alpha: { from: 0.35, to: 0.9 },
      duration: 650,
      yoyo: true,
      repeat: -1
    });

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.cameras.main.setBounds(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.cameras.main.setZoom(1);
  }

  update(): void {
    if (!this.travelEnabled || this.moving || !this.cursors) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.tryMove(0, -1);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.tryMove(0, 1);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.tryMove(-1, 0);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.tryMove(1, 0);
    }
  }

  public tryMove(dx: number, dy: number): void {
    if (!this.travelEnabled || this.moving) {
      return;
    }

    const next: Point = {
      x: this.tilePos.x + dx,
      y: this.tilePos.y + dy
    };

    if (!this.isWalkable(next)) {
      this.hooks.onBlocked();
      this.cameras.main.shake(70, 0.0035);
      return;
    }

    const nextPx = toPixels(next);
    this.moving = true;

    this.tweens.add({
      targets: this.player,
      x: nextPx.x,
      y: nextPx.y,
      duration: 110,
      ease: 'Quad.Out',
      onComplete: () => {
        this.tilePos = next;
        this.moving = false;
        this.hooks.onMove();

        if (this.tilePos.x === this.missionTarget.x && this.tilePos.y === this.missionTarget.y) {
          this.travelEnabled = false;
          this.hooks.onReach();
        }
      }
    });
  }

  public setTravelEnabled(enabled: boolean): void {
    this.travelEnabled = enabled;
  }

  public setTarget(point: Point): void {
    this.missionTarget = point;
    this.updateTargetMarker();
  }

  public resetToStart(): void {
    this.tilePos = { ...START_TILE };
    const startPx = toPixels(START_TILE);
    this.player.setPosition(startPx.x, startPx.y);
  }

  private updateTargetMarker(): void {
    if (!this.targetGlow) {
      return;
    }

    const targetPx = toPixels(this.missionTarget);
    this.targetGlow.setPosition(targetPx.x, targetPx.y);
  }

  private isWalkable(point: Point): boolean {
    if (point.x < 0 || point.x >= MAP_COLS || point.y < 0 || point.y >= MAP_ROWS) {
      return false;
    }

    const tile = TILE_MAP[point.y][point.x] as TileType;
    return !BLOCKED.has(tile);
  }

  private drawMap(): void {
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLS; x += 1) {
        const tile = TILE_MAP[y][x] as TileType;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const rect = this.add.rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, this.getTileColor(tile));
        rect.setStrokeStyle(1, 0x0f172a, 0.2);

        if (tile === 'R') {
          this.add.rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.8, 4, 0xf8fafc, 0.45);
        }

        if (tile === 'B') {
          this.add.rectangle(px + TILE_SIZE / 2, py + TILE_SIZE / 2 - 8, TILE_SIZE * 0.65, TILE_SIZE * 0.35, 0xfef2f2, 0.85);
        }
      }
    }

    MISSION_TILES.forEach((point, index) => {
      const label = this.add.text(point.x * TILE_SIZE + 8, point.y * TILE_SIZE + 2, `M${index + 1}`, {
        color: '#0f172a',
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold'
      });
      label.setDepth(5);
    });
  }

  private drawNPCs(): void {
    const npcs = [
      { x: 5, y: 2, shirt: '#f97316', hair: '#3f3f46' },
      { x: 7, y: 4, shirt: '#16a34a', hair: '#1f2937' },
      { x: 3, y: 7, shirt: '#9333ea', hair: '#312e81' },
      { x: 11, y: 6, shirt: '#2563eb', hair: '#7c2d12' }
    ];

    npcs.forEach((npc) => {
      const sprite = this.createHumanSprite(npc.shirt, npc.hair);
      const npcPos = toPixels({ x: npc.x, y: npc.y });
      sprite.setPosition(npcPos.x, npcPos.y);
      sprite.setDepth(7);
    });
  }

  private createHumanSprite(shirt: string, hair: string): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const head = this.add.circle(0, -8, 6, 0xfdba74, 1).setStrokeStyle(1, 0x78350f, 0.35);
    const hairTop = this.add.rectangle(0, -13, 12, 5, Phaser.Display.Color.HexStringToColor(hair).color, 1);
    const body = this.add.rectangle(0, 4, 12, 13, Phaser.Display.Color.HexStringToColor(shirt).color, 1).setStrokeStyle(1, 0x0f172a, 0.2);
    const legLeft = this.add.rectangle(-3, 12, 3, 6, 0x374151, 1);
    const legRight = this.add.rectangle(3, 12, 3, 6, 0x374151, 1);

    container.add([head, hairTop, body, legLeft, legRight]);
    container.setDepth(8);
    return container;
  }

  private getTileColor(tile: TileType): number {
    switch (tile) {
      case 'F':
        return 0x166534;
      case 'G':
        return 0x86efac;
      case 'R':
        return 0xa8a29e;
      case 'P':
        return 0xdbeafe;
      case 'W':
        return 0x0ea5e9;
      case 'B':
        return 0xef4444;
      case 'S':
        return 0x3b82f6;
      case '0':
      case '1':
      case '2':
      case '3':
        return 0xf59e0b;
      default:
        return 0xf8fafc;
    }
  }
}

const FundamentosAdventure: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [missionIndex, setMissionIndex] = useState(0);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [lastConsequence, setLastConsequence] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [travelMessage, setTravelMessage] = useState('Explora la ciudad y llega al primer punto tactico.');

  const sceneRef = useRef<AdventureScene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const gameHostRef = useRef<HTMLDivElement | null>(null);
  const missionIndexRef = useRef(0);

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

  useEffect(() => {
    missionIndexRef.current = missionIndex;
  }, [missionIndex]);

  useEffect(() => {
    if (!gameHostRef.current || gameRef.current) {
      return;
    }

    const hooks: SceneHooks = {
      onReach: () => {
        const currentMission = MISSIONS[missionIndexRef.current];
        setPhase('decision');
        setTravelMessage(`Encuentro activado en ${currentMission.place}.`);
      },
      onBlocked: () => setTravelMessage('Bloqueado. Usa calles o zonas peatonales para rodear.'),
      onMove: () => {
        const currentMission = MISSIONS[missionIndexRef.current];
        setTravelMessage(`Explorando: rumbo a ${currentMission.place}.`);
      }
    };

    const scene = new AdventureScene(hooks, MISSION_TILES[0]);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      parent: gameHostRef.current,
      backgroundColor: '#9fd0ff',
      pixelArt: true,
      scene: [scene],
      render: {
        antialias: false,
        roundPixels: true
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    });

    sceneRef.current = scene;
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    sceneRef.current.setTarget(MISSION_TILES[missionIndex]);
  }, [missionIndex]);

  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    sceneRef.current.setTravelEnabled(phase === 'travel');
  }, [phase]);

  const resetGame = () => {
    setPhase('intro');
    setMissionIndex(0);
    setStats(INITIAL_STATS);
    setLastConsequence('');
    setLog([]);
    setTravelMessage('Explora la ciudad y llega al primer punto tactico.');
    sceneRef.current?.setTarget(MISSION_TILES[0]);
    sceneRef.current?.resetToStart();
    sceneRef.current?.setTravelEnabled(false);
  };

  const startGame = () => {
    setPhase('travel');
    setMissionIndex(0);
    setStats(INITIAL_STATS);
    setLastConsequence('');
    setLog([]);
    setTravelMessage('Usa flechas o pad para llegar a Plaza de Briefing.');
    sceneRef.current?.setTarget(MISSION_TILES[0]);
    sceneRef.current?.resetToStart();
    sceneRef.current?.setTravelEnabled(true);
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
    setMissionIndex(nextMissionIndex);
    setPhase('travel');
    setTravelMessage(`Nueva ruta desbloqueada: llega a ${MISSIONS[nextMissionIndex].place}.`);
    sceneRef.current?.setTarget(MISSION_TILES[nextMissionIndex]);
    sceneRef.current?.setTravelEnabled(true);
  };

  const handleMoveClick = (dx: number, dy: number) => {
    sceneRef.current?.tryMove(dx, dy);
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
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 adventure-display">Mapa Phaser</p>
              <p className="text-xs font-bold text-slate-600">Etapa {Math.min(missionIndex + 1, MISSIONS.length)} / {MISSIONS.length}</p>
            </div>

            <div className="retro-screen rounded-xl border-4 border-slate-900 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs uppercase font-bold tracking-widest text-slate-700 adventure-display">Escenario urbano</p>
                <p className="text-[11px] font-bold text-slate-700">Motor 2D: Phaser.js</p>
              </div>

              <div className="phaser-host-frame">
                <div ref={gameHostRef} className="phaser-host" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
                <button
                  onClick={() => handleMoveClick(0, -1)}
                  disabled={phase !== 'travel'}
                  className="col-start-2 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Arriba
                </button>
                <button
                  onClick={() => handleMoveClick(-1, 0)}
                  disabled={phase !== 'travel'}
                  className="col-start-1 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Izq
                </button>
                <button
                  onClick={() => handleMoveClick(1, 0)}
                  disabled={phase !== 'travel'}
                  className="col-start-3 border-2 border-slate-900 rounded-lg py-1.5 text-xs font-black bg-[#ffe8d6] disabled:opacity-40"
                >
                  Der
                </button>
                <button
                  onClick={() => handleMoveClick(0, 1)}
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
                Recorre un escenario urbano en Phaser.js y activa eventos en cada punto clave. Ahora la exploracion usa un motor de juego dedicado para mejor movimiento y presentacion.
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
                Usa flechas del teclado o pad tactil. Al tocar el objetivo marcado en el mapa, se abre el encuentro estrategico del modulo.
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
                Tu score final fue <span className="font-black text-slate-900">{score}</span>. Repite para probar rutas alternativas entre etica, tactica y velocidad de respuesta.
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
