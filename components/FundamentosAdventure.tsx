import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

type Facing = 'up' | 'down' | 'left' | 'right';

interface CharacterStyle {
  cap: string;
  capLight: string;
  capBadge: string;
  hair: string;
  skin: string;
  skinShade: string;
  jacket: string;
  shirt: string;
  pants: string;
  shoes: string;
  outline: string;
  eye: string;
}

const mirrorFrame = (frame: string[]) => frame.map((row) => row.split('').reverse().join(''));

const HERO_DOWN: string[][] = [
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchsssssssshck..',
    '..kcssdeeedssck...',
    '...kssddddddssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krn....nrk....',
    '....krk....krk....',
    '.....k......k.....',
    '..................'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchsssssssshck..',
    '..kcssdeeedssck...',
    '...kssddddddssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krnnnnnnrk....',
    '.....kr....rk.....',
    '.....k......k.....',
    '..................'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchsssssssshck..',
    '..kcssdeeedssck...',
    '...kssddddddssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krn....nrk....',
    '.....krr..rrk.....',
    '.....k......k.....',
    '..................'
  ]
];

const HERO_UP: string[][] = [
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhhhhhhhhshk..',
    '..kchhhhkkhhhshk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krn....nrk....',
    '....krk....krk....',
    '.....k......k.....',
    '..................'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhhhhhhhhshk..',
    '..kchhhhkkhhhshk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krnnnnnnrk....',
    '.....kr....rk.....',
    '.....k......k.....',
    '..................'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhhhhhhhhshk..',
    '..kchhhhkkhhhshk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnssk...',
    '...kssnnnnnnssk...',
    '....krn....nrk....',
    '.....krr..rrk.....',
    '.....k......k.....',
    '..................'
  ]
];

const HERO_LEFT: string[][] = [
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhssssssshck..',
    '..kchssddeeeessk..',
    '..kcssdddddddssk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnsk....',
    '...kssnnnnnnsk....',
    '...krnk..rk.......',
    '....krk.kr........',
    '.....k...k........'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhssssssshck..',
    '..kchssddeeeessk..',
    '..kcssdddddddssk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnsk....',
    '...kssnnnnnnsk....',
    '...krn...rk.......',
    '....krkrk.........',
    '.....k...k........'
  ],
  [
    '......kkkkkk......',
    '.....kcccccck.....',
    '....kcccwwccck....',
    '...kcccwllwccck...',
    '...kccwwwwwwcck...',
    '..kccchhhhhccck...',
    '..kchhssssssshck..',
    '..kchssddeeeessk..',
    '..kcssdddddddssk..',
    '...ksssoooosssk...',
    '...ksssoooosssk...',
    '..ksssooogoossk...',
    '..kssssoogoossk...',
    '...kssnnnnnnsk....',
    '...kssnnnnnnsk....',
    '...kr.k..nrk......',
    '....krr.kr........',
    '.....k...k........'
  ]
];

const HERO_FRAMES: Record<Facing, string[][]> = {
  down: HERO_DOWN,
  up: HERO_UP,
  left: HERO_LEFT,
  right: HERO_LEFT.map((frame) => mirrorFrame(frame))
};

const HERO_STYLE: CharacterStyle = {
  cap: '#dc2626',
  capLight: '#fca5a5',
  capBadge: '#f8fafc',
  hair: '#4b5563',
  skin: '#fdba74',
  skinShade: '#fb923c',
  jacket: '#2563eb',
  shirt: '#e5e7eb',
  pants: '#334155',
  shoes: '#7f1d1d',
  outline: '#111827',
  eye: '#0f172a'
};

class CharacterScene extends Phaser.Scene {
  private hero?: Phaser.GameObjects.Image;
  private facing: Facing = 'down';
  private animating = false;

  constructor() {
    super({ key: 'character-scene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#e2e8f0');
    this.add.rectangle(210, 150, 420, 300, 0xe5eef9, 1);
    this.add.ellipse(210, 220, 220, 56, 0x94a3b8, 0.22);
    this.add.ellipse(210, 214, 144, 28, 0x0f172a, 0.12);

    this.registerCharacterTextures('hero', HERO_STYLE, HERO_FRAMES);

    this.hero = this.add.image(210, 182, this.frameKey('hero', 'down', 1));
    this.hero.setOrigin(0.5, 0.88);
    this.hero.setScale(1.12);
    this.hero.setDepth(5);

    this.add.text(210, 258, 'Protagonista base', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#0f172a',
      fontStyle: '700'
    }).setOrigin(0.5, 0.5);
  }

  public setFacing(facing: Facing): void {
    this.facing = facing;
    if (!this.hero) {
      return;
    }
    this.hero.setTexture(this.frameKey('hero', facing, 1));
  }

  public previewWalk(): void {
    if (this.animating || !this.hero) {
      return;
    }

    this.animating = true;
    const frames = [0, 1, 2, 1];

    frames.forEach((frame, index) => {
      this.time.delayedCall(index * 110, () => {
        if (!this.hero) {
          return;
        }
        this.hero.setTexture(this.frameKey('hero', this.facing, frame));
        if (index === frames.length - 1) {
          this.animating = false;
        }
      });
    });
  }

  private frameKey(prefix: string, facing: Facing, frame: number): string {
    return `${prefix}-${facing}-${frame}`;
  }

  private normalizeFrame(frame: string[]): string[] {
    return frame.map((row) => row.padEnd(18, '.').slice(0, 18));
  }

  private registerCharacterTextures(
    prefix: string,
    style: CharacterStyle,
    framesByFacing: Record<Facing, string[][]>
  ): void {
    const palette = {
      '.': '#00000000',
      k: style.outline,
      c: style.cap,
      w: style.capLight,
      l: style.capBadge,
      h: style.hair,
      s: style.skin,
      d: style.skinShade,
      e: style.eye,
      o: style.jacket,
      g: style.shirt,
      n: style.pants,
      r: style.shoes
    } as unknown as Phaser.Types.Create.Palette;

    (Object.keys(framesByFacing) as Facing[]).forEach((facing) => {
      framesByFacing[facing].forEach((rawFrame, index) => {
        const key = this.frameKey(prefix, facing, index);
        if (this.textures.exists(key)) {
          return;
        }

        this.textures.generate(key, {
          data: this.normalizeFrame(rawFrame),
          pixelWidth: 3,
          palette
        });
      });
    });
  }
}

const FundamentosAdventure: React.FC = () => {
  const [facing, setFacing] = useState<Facing>('down');
  const sceneRef = useRef<CharacterScene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) {
      return;
    }

    const scene = new CharacterScene();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 420,
      height: 300,
      parent: hostRef.current,
      backgroundColor: '#e2e8f0',
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
      sceneRef.current = null;
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setFacing(facing);
  }, [facing]);

  return (
    <section className="character-shell mt-20">
      <div className="character-card">
        <div className="character-copy">
          <p className="character-kicker">Estudio de Personaje</p>
          <h3 className="character-title">Protagonista principal</h3>
          <p className="character-text">
            Se eliminó todo el mapa y la UI de aventura. Esta pantalla queda dedicada únicamente al personaje principal, con sprite original inspirado en RPG clásico de vista cenital.
          </p>
        </div>

        <div className="character-stage-frame">
          <div ref={hostRef} className="character-stage" />
        </div>

        <div className="character-controls">
          <button onClick={() => setFacing('up')} className={facing === 'up' ? 'active' : ''}>Arriba</button>
          <button onClick={() => setFacing('left')} className={facing === 'left' ? 'active' : ''}>Izquierda</button>
          <button onClick={() => setFacing('down')} className={facing === 'down' ? 'active' : ''}>Abajo</button>
          <button onClick={() => setFacing('right')} className={facing === 'right' ? 'active' : ''}>Derecha</button>
          <button onClick={() => sceneRef.current?.previewWalk()}>Caminar</button>
        </div>
      </div>
    </section>
  );
};

export default FundamentosAdventure;
