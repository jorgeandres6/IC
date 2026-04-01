import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import personajeCaminar from '../src/img/Personaje_caminar.png';

type Rotation = 0 | 90 | 180 | 270;

type TilePlacement = {
  tileId: number;
  rotation?: Rotation;
  scaleX?: number;
  scaleY?: number;
};

const worldTileSources = import.meta.glob('../src/img/mundo/Top-Down Simple Summer_Ground *.png', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

type Facing = 'up' | 'down' | 'left' | 'right';

const GAME_WIDTH = 420;
const GAME_HEIGHT = 300;
const SOURCE_TILE_SIZE = 256;
const TILE_SCALE = 2 / 3;
const TILE_SIZE = SOURCE_TILE_SIZE * TILE_SCALE;
const MAP_COLS = 10;
const MAP_ROWS = 7;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;
const FRAMES_PER_ROW = 6;
const HERO_SCALE = 1.65;
const HERO_ORIGIN_Y = 0.88;
const HERO_SHADOW_WIDTH = 44;
const HERO_SHADOW_HEIGHT = 14;
const HERO_SHADOW_GROUND_OFFSET = 4;
const WORLD_BACKGROUND = 0x40595d;
const SAND_BACKGROUND = 0xeabb71;
const DETAIL_GREEN = 0x73ad3e;
const DETAIL_GREEN_HIGHLIGHT = 0x95ca47;

const TILE_TEXTURES = Object.entries(worldTileSources).reduce<Record<number, string>>((textures, [path, source]) => {
  const match = path.match(/Ground (\d+)\.png$/);
  if (match) {
    textures[Number(match[1])] = source;
  }
  return textures;
}, {});

const WORLD_TILE_MAP: (TilePlacement | null)[][] = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLS }, () => null)
);

const WALKABLE_MAP: boolean[][] = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLS }, () => false)
);

const putTile = (x: number, y: number, tileId: number, options: Omit<TilePlacement, 'tileId'> = {}): void => {
  if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) {
    return;
  }

  WORLD_TILE_MAP[y][x] = {
    tileId,
    rotation: options.rotation ?? 0,
    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1
  };
};

const markWalkable = (startX: number, startY: number, width: number, height: number): void => {
  for (let offsetY = 0; offsetY < height; offsetY += 1) {
    for (let offsetX = 0; offsetX < width; offsetX += 1) {
      const x = startX + offsetX;
      const y = startY + offsetY;
      if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) {
        continue;
      }
      WALKABLE_MAP[y][x] = true;
    }
  }
};

const paintRoundedBlock = (startX: number, startY: number, width: number, height: number): void => {
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const isTop = row === 0;
      const isBottom = row === height - 1;
      const isLeft = col === 0;
      const isRight = col === width - 1;

      let tileId = 1;
      let rotation: Rotation = 0;

      if (isTop && isLeft) {
        tileId = 10;
      } else if (isTop && isRight) {
        tileId = 10;
        rotation = 90;
      } else if (isBottom && isRight) {
        tileId = 10;
        rotation = 180;
      } else if (isBottom && isLeft) {
        tileId = 10;
        rotation = 270;
      } else if (isTop) {
        tileId = 24;
        rotation = 270;
      } else if (isRight) {
        tileId = 24;
      } else if (isBottom) {
        tileId = 24;
        rotation = 90;
      } else if (isLeft) {
        tileId = 24;
        rotation = 180;
      }

      putTile(startX + col, startY + row, tileId, { rotation });
    }
  }

  markWalkable(startX, startY, width, height);
};

paintRoundedBlock(3, 0, 3, 3);
paintRoundedBlock(7, 0, 3, 3);
paintRoundedBlock(0, 3, 3, 3);
paintRoundedBlock(5, 3, 2, 2);
paintRoundedBlock(7, 3, 3, 3);

putTile(1, 1, 5);
markWalkable(1, 1, 1, 1);

putTile(4, 3, 37, { scaleY: 3 });
markWalkable(4, 3, 1, 3);

putTile(0, 6, 41, { scaleX: 3 });
markWalkable(0, 6, 3, 1);

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

    Object.entries(TILE_TEXTURES).forEach(([tileId, source]) => {
      this.load.image(`world-tile-${tileId}`, source);
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(`#${WORLD_BACKGROUND.toString(16)}`);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, WORLD_BACKGROUND).setDepth(0);
    this.drawWorld();

    const spawnX = TILE_SIZE * 5.75;
    const spawnY = TILE_SIZE * 4.1;

    this.createAnimations();

    this.hero = this.add.sprite(spawnX, spawnY, 'hero-sheet', this.frameIndex('down', IDLE_COL.down));
    this.hero.setOrigin(0.5, HERO_ORIGIN_Y);
    this.hero.setScale(HERO_SCALE);
    this.hero.setDepth(5);

    this.heroShadow = this.add.ellipse(spawnX, spawnY, HERO_SHADOW_WIDTH, HERO_SHADOW_HEIGHT, 0x0f172a, 0.18);
    this.heroShadow.setDepth(4);
    this.updateHeroShadowPosition();

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

    const nextX = Phaser.Math.Clamp(this.hero.x + normalizedX * this.moveSpeed * (delta / 1000), 44, WORLD_WIDTH - 44);
    const nextY = Phaser.Math.Clamp(this.hero.y + normalizedY * this.moveSpeed * (delta / 1000), 102, WORLD_HEIGHT - 18);

    if (this.isWalkable(nextX, this.hero.y)) {
      this.hero.x = nextX;
    }
    if (this.isWalkable(this.hero.x, nextY)) {
      this.hero.y = nextY;
    }

    this.updateHeroShadowPosition();

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

  private drawWorld(): void {
    const terrainBase = this.add.graphics();
    terrainBase.setDepth(0.5);
    terrainBase.fillStyle(SAND_BACKGROUND, 1);

    WALKABLE_MAP.forEach((row, rowIndex) => {
      row.forEach((isWalkable, colIndex) => {
        if (!isWalkable) {
          return;
        }

        terrainBase.fillRect(colIndex * TILE_SIZE, rowIndex * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      });
    });

    WORLD_TILE_MAP.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile) {
          return;
        }

        const scaleX = tile.scaleX ?? 1;
        const scaleY = tile.scaleY ?? 1;
        const sprite = this.add.image(
          colIndex * TILE_SIZE + (TILE_SIZE * scaleX) / 2,
          rowIndex * TILE_SIZE + (TILE_SIZE * scaleY) / 2,
          `world-tile-${tile.tileId}`
        );

        sprite.setOrigin(0.5);
        sprite.setDisplaySize(TILE_SIZE * scaleX + 1, TILE_SIZE * scaleY + 1);
        sprite.setAngle(tile.rotation ?? 0);
        sprite.setDepth(1);
      });
    });

    const details = this.add.graphics();
    details.setDepth(2);

    this.drawGrassCircle(details, TILE_SIZE * 0.52, TILE_SIZE * 3.92, 42);
    this.drawGrassCircle(details, TILE_SIZE * 1.5, TILE_SIZE * 3.92, 42);
    this.drawGrassCircle(details, TILE_SIZE * 0.52, TILE_SIZE * 4.9, 42);
    this.drawGrassCircle(details, TILE_SIZE * 1.5, TILE_SIZE * 4.9, 42);
    this.drawGrassCircle(details, TILE_SIZE * 5.72, TILE_SIZE * 4.02, 44);
    this.drawGrassCircle(details, TILE_SIZE * 8.5, TILE_SIZE * 4.5, 176);
  }

  private drawGrassCircle(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    graphics.fillStyle(DETAIL_GREEN_HIGHLIGHT, 1);
    graphics.fillCircle(x, y, radius + 8);
    graphics.fillStyle(DETAIL_GREEN, 1);
    graphics.fillCircle(x, y, radius);
  }

  private updateHeroShadowPosition(): void {
    if (!this.hero || !this.heroShadow) {
      return;
    }

    const feetOffset = this.hero.displayHeight * (1 - this.hero.originY);
    this.heroShadow.setPosition(this.hero.x, this.hero.y + feetOffset - HERO_SHADOW_GROUND_OFFSET);
  }

  private isWalkable(x: number, y: number): boolean {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return WALKABLE_MAP[row]?.[col] ?? false;
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
          <p className="character-kicker">Mundo Por Tiles</p>
          <h3 className="character-title">Escenario armado desde el tileset</h3>
          <p className="character-text">
            Esta vista construye el fondo con las piezas en src/img/mundo para aproximar la composicion de la referencia, combinando bloques redondeados, pasillos y detalles de cesped dentro de un mapa explorables con flechas o WASD.
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
