import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import personajeCaminar from '../src/img/Personaje_caminar.png';
import cesped from '../src/img/cesped.jpg';

type Facing = 'up' | 'down' | 'left' | 'right';

const GAME_WIDTH = 420;
const GAME_HEIGHT = 300;
const WORLD_WIDTH = 1680;
const WORLD_HEIGHT = 1200;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;
const FRAMES_PER_ROW = 6;

const FACING_ROW: Record<Facing, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};

const IDLE_COL: Record<Facing, number> = {
  down: 0,
  left: 0,
  right: 0,
  up: 0
};

const WALK_COLS: Record<Facing, number[]> = {
  down: [1, 2, 3, 2],
  left: [1, 2, 3, 2],
  right: [1, 2, 3, 2],
  up: [1, 2, 3, 2]
};

class CharacterScene extends Phaser.Scene {
  private hero?: Phaser.GameObjects.Sprite;
  private heroShadow?: Phaser.GameObjects.Ellipse;
  private activeFacing: Facing = 'down';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private readonly moveSpeed = 155;

  constructor() {
    super({ key: 'character-scene' });
  }

  preload(): void {
    this.load.spritesheet('hero-sheet', personajeCaminar, {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT
    });
    this.load.image('grass-tile', cesped);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#4b6b2b');
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const grass = this.add.tileSprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 'grass-tile');
    grass.setOrigin(0.5);

    this.heroShadow = this.add.ellipse(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 38, 44, 14, 0x0f172a, 0.18);
    this.heroShadow.setDepth(4);

    this.createAnimations();

    this.hero = this.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'hero-sheet', this.frameIndex('down', IDLE_COL.down));
    this.hero.setOrigin(0.5, 0.88);
    this.hero.setScale(1.65);
    this.hero.setDepth(5);

    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

    this.setWalking(false);
  }

  update(_: number, delta: number): void {
    if (!this.hero || !this.cursors || !this.wasd) {
      return;
    }

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    let moveX = 0;
    let moveY = 0;

    if (left) {
      moveX -= 1;
    }
    if (right) {
      moveX += 1;
    }
    if (up) {
      moveY -= 1;
    }
    if (down) {
      moveY += 1;
    }

    const isMoving = moveX !== 0 || moveY !== 0;
    if (!isMoving) {
      this.setWalking(false);
      return;
    }

    const magnitude = Math.hypot(moveX, moveY) || 1;
    const normalizedX = moveX / magnitude;
    const normalizedY = moveY / magnitude;

    const nextX = this.hero.x + normalizedX * this.moveSpeed * (delta / 1000);
    const nextY = this.hero.y + normalizedY * this.moveSpeed * (delta / 1000);

    this.hero.x = Phaser.Math.Clamp(nextX, 44, WORLD_WIDTH - 44);
    this.hero.y = Phaser.Math.Clamp(nextY, 102, WORLD_HEIGHT - 18);

    if (this.heroShadow) {
      this.heroShadow.x = this.hero.x;
      this.heroShadow.y = this.hero.y + 38;
    }

    const nextFacing: Facing = Math.abs(normalizedX) > Math.abs(normalizedY)
      ? (normalizedX > 0 ? 'right' : 'left')
      : (normalizedY > 0 ? 'down' : 'up');

    this.activeFacing = nextFacing;
    this.setWalking(true);
  }

  public setFacing(facing: Facing): void {
    this.activeFacing = facing;
    if (!this.hero) {
      return;
    }
    this.hero.setFrame(this.frameIndex(facing, IDLE_COL[facing]));
  }

  public setWalking(shouldWalk: boolean): void {
    if (!this.hero) {
      return;
    }

    if (shouldWalk) {
      this.playWalk(this.activeFacing);
      return;
    }

    this.hero.anims.stop();
    this.hero.setFrame(this.frameIndex(this.activeFacing, IDLE_COL[this.activeFacing]));
  }

  private animationKey(facing: Facing): string {
    return `hero-walk-${facing}`;
  }

  private frameIndex(facing: Facing, col: number): number {
    return FACING_ROW[facing] * FRAMES_PER_ROW + col;
  }

  private playWalk(facing: Facing): void {
    if (!this.hero) {
      return;
    }

    const key = this.animationKey(facing);
    if (this.hero.anims.currentAnim?.key === key && this.hero.anims.isPlaying) {
      return;
    }

    this.hero.anims.play(key, true);
  }

  private createAnimations(): void {
    (Object.keys(FACING_ROW) as Facing[]).forEach((facing) => {
      const key = this.animationKey(facing);
      if (this.anims.exists(key)) {
        return;
      }

      this.anims.create({
        key,
        frames: WALK_COLS[facing].map((col) => ({
          key: 'hero-sheet',
          frame: this.frameIndex(facing, col)
        })),
        frameRate: 9,
        repeat: -1
      });
    });
  }
}

const FundamentosAdventure: React.FC = () => {
  const [facing, setFacing] = useState<Facing>('down');
  const [walking, setWalking] = useState(true);
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
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
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

  useEffect(() => {
    sceneRef.current?.setWalking(walking);
  }, [walking]);

  return (
    <section className="character-shell mt-20">
      <div className="character-card">
        <div className="character-copy">
          <p className="character-kicker">Sprite Principal</p>
          <h3 className="character-title">Personaje desde Sprite Sheet</h3>
          <p className="character-text">
            Esta vista usa el sprite sheet en src/img/Personaje_caminar.png sobre un terreno de cesped repetido desde src/img/cesped.jpg para extender el mundo mas alla de la pantalla.
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
          <button onClick={() => setWalking((prev) => !prev)}>{walking ? 'Pausar' : 'Caminar'}</button>
        </div>
      </div>
    </section>
  );
};

export default FundamentosAdventure;
