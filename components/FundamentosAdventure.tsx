import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import personajeCaminar from '../src/img/Personaje_caminar.png';
import nuevoPersonajeIdle from '../src/img/1_IDLE.png';
import { apiService } from '../services/api';

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
const WORLD_SCALE = 1.08;
const BASE_TILE_SCALE = 2 / 3;
const TILE_SCALE = BASE_TILE_SCALE * WORLD_SCALE;
const TILE_SIZE = SOURCE_TILE_SIZE * TILE_SCALE;
const MAP_COLS = 10;
const MAP_ROWS = 7;
const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;
const FRAMES_PER_ROW = 6;
const NEW_CHARACTER_FRAME_SIZE = 128;
const NEW_CHARACTER_FRAMES = 5;
const BASE_HERO_SCALE = 1.65;
const HERO_SCALE = BASE_HERO_SCALE * WORLD_SCALE;
const HERO_ORIGIN_Y = 0.88;
const CHARACTER_HITBOX_WIDTH_FACTOR = 0.36;
const CHARACTER_HITBOX_HEIGHT_FACTOR = 0.48;
const WORLD_BACKGROUND = 0x40595d;
const SAND_BACKGROUND = 0xeabb71;
const DETAIL_GREEN = 0x73ad3e;
const DETAIL_GREEN_HIGHLIGHT = 0x95ca47;
const MOVE_SPEED = 155 * WORLD_SCALE;
const DIALOG_MARGIN_X = 10;
const DIALOG_MARGIN_BOTTOM = 10;
const DIALOG_BOX_HEIGHT = 92;
const DIALOG_PADDING_X = 12;
const DIALOG_PADDING_Y = 10;
const DIALOG_TYPEWRITER_DELAY = 18;
const DIALOG_HINT_TEXT = 'ESPACIO para continuar';
const WALK_BOUNDS_PADDING = {
  left: TILE_SIZE * 0.2578125,
  right: TILE_SIZE * 0.2578125,
  top: TILE_SIZE * 0.59765625,
  bottom: TILE_SIZE * 0.10546875
};

const scaleWorldValue = (value: number): number => value * WORLD_SCALE;

const TILE_TEXTURES = Object.entries(worldTileSources).reduce<Record<number, string>>((textures, [path, source]) => {
  const match = path.match(/Ground (\d+)\.png$/);
  if (match) {
    textures[Number(match[1])] = source;
  }
  return textures;
}, {});

const createBaseTile = (): TilePlacement => ({
  tileId: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1
});

const WORLD_TILE_MAP: TilePlacement[][] = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLS }, () => createBaseTile())
);

const WALKABLE_MAP: boolean[][] = Array.from({ length: MAP_ROWS }, () =>
  Array.from({ length: MAP_COLS }, () => true)
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
  private npc?: Phaser.GameObjects.Sprite;
  private dialogBox?: Phaser.GameObjects.Rectangle;
  private dialogText?: Phaser.GameObjects.Text;
  private dialogHintText?: Phaser.GameObjects.Text;
  private dialogTypingEvent?: Phaser.Time.TimerEvent;
  private dialogPages: string[] = [];
  private dialogPageIndex = 0;
  private isDialogAwaitingAdvance = false;
  private isDialogVisible = false;
  private activeFacing: Facing = 'down';
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private isFetchingDialog = false;
  private readonly moveSpeed = MOVE_SPEED;

  constructor() {
    super({ key: 'character-scene' });
  }

  preload(): void {
    this.load.spritesheet('hero-sheet', personajeCaminar, {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT
    });

    this.load.spritesheet('npc-idle-sheet', nuevoPersonajeIdle, {
      frameWidth: NEW_CHARACTER_FRAME_SIZE,
      frameHeight: NEW_CHARACTER_FRAME_SIZE
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
    this.createNpcAnimations();

    this.hero = this.add.sprite(spawnX, spawnY, 'hero-sheet', this.frameIndex('down', IDLE_COL.down));
    this.hero.setOrigin(0.5, HERO_ORIGIN_Y);
    this.hero.setScale(HERO_SCALE);
    this.hero.setDepth(5);

    this.npc = this.add.sprite(TILE_SIZE * 6.9, TILE_SIZE * 4.3, 'npc-idle-sheet', 0);
    this.npc.setOrigin(0.5, HERO_ORIGIN_Y);
    this.npc.setDisplaySize(this.hero.displayWidth * 0.6885, this.hero.displayHeight * 0.6885);
    this.npc.setDepth(5);
    this.npc.play('npc-idle', true);

    this.createDialogUI();

    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    this.cameras.main.roundPixels = true;

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.setWalking(false);
  }

  update(_: number, delta: number): void {
    if (!this.hero || !this.cursors || !this.wasd) {
      return;
    }

    this.updateDialogPosition();
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.isDialogVisible) {
        this.advanceDialog();
      } else if (this.isHeroNearNpc()) {
        void this.requestNpcDialog();
      } else {
        this.hideDialog();
      }
    }

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    if (left || right || up || down) {
      this.hideDialog();
    }

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

    const nextX = Phaser.Math.Clamp(
      this.hero.x + normalizedX * this.moveSpeed * (delta / 1000),
      WALK_BOUNDS_PADDING.left,
      WORLD_WIDTH - WALK_BOUNDS_PADDING.right
    );
    const nextY = Phaser.Math.Clamp(
      this.hero.y + normalizedY * this.moveSpeed * (delta / 1000),
      WALK_BOUNDS_PADDING.top,
      WORLD_HEIGHT - WALK_BOUNDS_PADDING.bottom
    );

    if (this.isWalkable(nextX, this.hero.y) && !this.wouldCollideWithNpc(nextX, this.hero.y)) {
      this.hero.x = nextX;
    }
    if (this.isWalkable(this.hero.x, nextY) && !this.wouldCollideWithNpc(this.hero.x, nextY)) {
      this.hero.y = nextY;
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

  private createNpcAnimations(): void {
    if (this.anims.exists('npc-idle')) {
      return;
    }

    this.anims.create({
      key: 'npc-idle',
      frames: this.anims.generateFrameNumbers('npc-idle-sheet', {
        start: 0,
        end: NEW_CHARACTER_FRAMES - 1
      }),
      frameRate: 6,
      repeat: -1
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

    this.drawGrassCircle(details, TILE_SIZE * 0.52, TILE_SIZE * 3.92, scaleWorldValue(42));
    this.drawGrassCircle(details, TILE_SIZE * 1.5, TILE_SIZE * 3.92, scaleWorldValue(42));
    this.drawGrassCircle(details, TILE_SIZE * 0.52, TILE_SIZE * 4.9, scaleWorldValue(42));
    this.drawGrassCircle(details, TILE_SIZE * 1.5, TILE_SIZE * 4.9, scaleWorldValue(42));
    this.drawGrassCircle(details, TILE_SIZE * 5.72, TILE_SIZE * 4.02, scaleWorldValue(44));
    this.drawGrassCircle(details, TILE_SIZE * 8.5, TILE_SIZE * 4.5, scaleWorldValue(176));
  }

  private drawGrassCircle(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    graphics.fillStyle(DETAIL_GREEN_HIGHLIGHT, 1);
    graphics.fillCircle(x, y, radius + scaleWorldValue(8));
    graphics.fillStyle(DETAIL_GREEN, 1);
    graphics.fillCircle(x, y, radius);
  }

  private isWalkable(x: number, y: number): boolean {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return WALKABLE_MAP[row]?.[col] ?? false;
  }

  private wouldCollideWithNpc(heroNextX: number, heroNextY: number): boolean {
    if (!this.hero || !this.npc) {
      return false;
    }

    const heroBounds = this.getCharacterHitboxBounds(this.hero, heroNextX, heroNextY);
    const npcBounds = this.getCharacterHitboxBounds(this.npc, this.npc.x, this.npc.y);
    return Phaser.Geom.Intersects.RectangleToRectangle(heroBounds, npcBounds);
  }

  private getCharacterHitboxBounds(sprite: Phaser.GameObjects.Sprite, x: number, y: number): Phaser.Geom.Rectangle {
    const hitboxWidth = sprite.displayWidth * CHARACTER_HITBOX_WIDTH_FACTOR;
    const hitboxHeight = sprite.displayHeight * CHARACTER_HITBOX_HEIGHT_FACTOR;
    const left = x - hitboxWidth * 0.5;
    const top = y - hitboxHeight * sprite.originY;

    return new Phaser.Geom.Rectangle(
      left,
      top,
      hitboxWidth,
      hitboxHeight
    );
  }

  private createDialogUI(): void {
    this.dialogBox = this.add.rectangle(0, 0, GAME_WIDTH - DIALOG_MARGIN_X * 2, DIALOG_BOX_HEIGHT, 0xffffff, 0.96);
    this.dialogBox.setStrokeStyle(2, 0x1f2937, 1);
    this.dialogBox.setDepth(30);
    this.dialogBox.setVisible(false);

    this.dialogText = this.add.text(0, 0, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#111827',
      align: 'left'
    });
    this.dialogText.setOrigin(0, 0);
    this.dialogText.setDepth(31);
    this.dialogText.setVisible(false);

    this.dialogHintText = this.add.text(0, 0, DIALOG_HINT_TEXT, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#374151',
      align: 'right'
    });
    this.dialogHintText.setOrigin(1, 1);
    this.dialogHintText.setDepth(31);
    this.dialogHintText.setVisible(false);
  }

  private updateDialogPosition(): void {
    if (!this.dialogBox || !this.dialogText || !this.dialogHintText) {
      return;
    }

    const camera = this.cameras.main;
    const view = camera.worldView;
    const dialogWidth = camera.width - DIALOG_MARGIN_X * 2;
    const dialogX = view.x + camera.width / 2;
    const dialogY = view.y + camera.height - DIALOG_MARGIN_BOTTOM - DIALOG_BOX_HEIGHT / 2;

    this.dialogBox.setSize(dialogWidth, DIALOG_BOX_HEIGHT);
    this.dialogBox.setDisplaySize(dialogWidth, DIALOG_BOX_HEIGHT);
    this.dialogBox.setPosition(dialogX, dialogY);

    const left = dialogX - dialogWidth / 2 + DIALOG_PADDING_X;
    const top = dialogY - DIALOG_BOX_HEIGHT / 2 + DIALOG_PADDING_Y;
    const textArea = this.getDialogTextArea();

    this.dialogText.setPosition(left, top);
    this.dialogText.setWordWrapWidth(textArea.width, true);
    this.dialogHintText.setPosition(
      dialogX + dialogWidth / 2 - DIALOG_PADDING_X,
      dialogY + DIALOG_BOX_HEIGHT / 2 - DIALOG_PADDING_Y
    );
  }

  private isHeroNearNpc(): boolean {
    if (!this.hero || !this.npc) {
      return false;
    }

    const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.npc.x, this.npc.y);
    const proximityThreshold = (this.hero.displayWidth + this.npc.displayWidth) * 0.55;
    return distance <= proximityThreshold;
  }

  private showDialog(message: string): void {
    this.startDialogPagination(message);
  }

  private showDialogInstant(message: string): void {
    if (!this.dialogBox || !this.dialogText || !this.dialogHintText) {
      return;
    }

    this.stopDialogTypewriter();
    this.isDialogVisible = true;
    this.isDialogAwaitingAdvance = false;
    this.dialogPages = [message];
    this.dialogPageIndex = 0;
    this.dialogText.setText(message);
    this.dialogBox.setVisible(true);
    this.dialogText.setVisible(true);
    this.dialogHintText.setVisible(false);
    this.updateDialogPosition();
  }

  private startDialogPagination(message: string): void {
    if (!this.dialogBox || !this.dialogText || !this.dialogHintText) {
      return;
    }

    this.stopDialogTypewriter();
    this.updateDialogPosition();

    const finalMessage = message.trim();
    console.log('[NPC Dialog]', finalMessage);
    this.dialogPages = this.paginateDialogMessage(finalMessage);
    this.dialogPageIndex = 0;
    this.isDialogVisible = true;
    this.isDialogAwaitingAdvance = false;

    this.dialogBox.setVisible(true);
    this.dialogText.setVisible(true);
    this.dialogHintText.setVisible(false);

    if (this.dialogPages.length === 0) {
      this.dialogText.setText('');
      return;
    }

    this.typeCurrentDialogPage();
  }

  private typeCurrentDialogPage(): void {
    if (!this.dialogText || !this.dialogHintText) {
      return;
    }

    const currentPage = this.dialogPages[this.dialogPageIndex] ?? '';
    let visibleChars = 0;
    this.dialogText.setText('');
    this.isDialogAwaitingAdvance = false;
    this.dialogHintText.setVisible(false);

    this.dialogTypingEvent = this.time.addEvent({
      delay: DIALOG_TYPEWRITER_DELAY,
      loop: true,
      callback: () => {
        if (!this.dialogText) {
          return;
        }

        visibleChars += 1;
        this.dialogText.setText(currentPage.slice(0, visibleChars));

        if (visibleChars >= currentPage.length) {
          this.stopDialogTypewriter();

          if (this.dialogPageIndex < this.dialogPages.length - 1) {
            this.isDialogAwaitingAdvance = true;
            this.dialogHintText?.setVisible(true);
          }
        }
      }
    });
  }

  private advanceDialog(): void {
    if (!this.isDialogVisible) {
      return;
    }

    if (this.dialogTypingEvent && this.dialogText) {
      const page = this.dialogPages[this.dialogPageIndex] ?? '';
      this.stopDialogTypewriter();
      this.dialogText.setText(page);
      if (this.dialogPageIndex < this.dialogPages.length - 1) {
        this.isDialogAwaitingAdvance = true;
        this.dialogHintText?.setVisible(true);
      }
      return;
    }

    if (!this.isDialogAwaitingAdvance) {
      return;
    }

    this.dialogPageIndex += 1;
    this.isDialogAwaitingAdvance = false;
    this.dialogHintText?.setVisible(false);

    if (this.dialogPageIndex >= this.dialogPages.length) {
      this.hideDialog();
      return;
    }

    this.typeCurrentDialogPage();
  }

  private stopDialogTypewriter(): void {
    if (!this.dialogTypingEvent) {
      return;
    }

    this.dialogTypingEvent.remove(false);
    this.dialogTypingEvent = undefined;
  }

  private getDialogTextArea(): { width: number; height: number } {
    if (!this.dialogBox) {
      return { width: 0, height: 0 };
    }

    return {
      width: Math.max(1, this.dialogBox.displayWidth - DIALOG_PADDING_X * 2),
      height: Math.max(1, this.dialogBox.displayHeight - DIALOG_PADDING_Y * 2 - 16)
    };
  }

  private paginateDialogMessage(message: string): string[] {
    if (!this.dialogText) {
      return [message];
    }

    const content = message.trim();
    if (!content) {
      return [];
    }

    const textArea = this.getDialogTextArea();
    this.dialogText.setWordWrapWidth(textArea.width, true);

    const pages: string[] = [];
    let index = 0;

    while (index < content.length) {
      while (index < content.length && content[index] === ' ') {
        index += 1;
      }

      if (index >= content.length) {
        break;
      }

      let low = index + 1;
      let high = content.length;
      let best = index + 1;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = content.slice(index, mid).trim();

        this.dialogText.setText(candidate);
        const bounds = this.dialogText.getBounds();
        const fits = bounds.height <= textArea.height;

        if (fits) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const page = content.slice(index, best).trim();
      pages.push(page);
      index = best;
    }

    this.dialogText.setText('');
    return pages;
  }

  private refreshDialogBoxSize(): void {
    if (!this.dialogBox || !this.dialogText) {
      return;
    }

    this.updateDialogPosition();
  }

  private async requestNpcDialog(): Promise<void> {
    if (this.isFetchingDialog) {
      return;
    }

    this.isFetchingDialog = true;
    this.showDialogInstant('Consultando...');

    try {
      const response = await apiService.getNpcPoliticalConsultantDialog('heroe');
      this.showDialog(response.message);
    } catch {
      this.showDialog('Soy consultor politico: te ayudo a definir estrategia, mensajes y escenarios para tomar mejores decisiones publicas.');
    } finally {
      this.isFetchingDialog = false;
    }
  }

  private hideDialog(): void {
    if (!this.dialogBox || !this.dialogText || !this.dialogHintText) {
      return;
    }

    this.stopDialogTypewriter();
    this.isDialogVisible = false;
    this.isDialogAwaitingAdvance = false;
    this.dialogPages = [];
    this.dialogPageIndex = 0;
    this.dialogBox.setVisible(false);
    this.dialogText.setVisible(false);
    this.dialogHintText.setVisible(false);
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
