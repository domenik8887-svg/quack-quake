import Phaser from 'phaser';

import { jukebox } from '../audio';
import {
  clampPointToRadius,
  COLORS,
  DUCK_REST,
  FONT_STACKS,
  GAME_HEIGHT,
  GAME_WIDTH,
  MATERIAL_CONFIG,
  MAX_PULL_DISTANCE,
  OFFSCREEN_MARGIN,
  SCENE_KEYS,
  SHOT_POWER,
  SLINGSHOT_ANCHOR,
  hexColor,
} from '../constants';
import { LEVELS } from '../levels';
import { loadProgress, recordLevelResult } from '../storage';
import type { LevelBlock, LevelConfig, LevelTarget, LevelTnt, MaterialName, ProgressState } from '../types';
import { createButton, createPanel, starsLabel } from '../ui';

interface Actor {
  id: string;
  kind: 'block' | 'target' | 'tnt';
  material?: MaterialName;
  sprite: Phaser.Physics.Matter.Image;
  health: number;
  maxHealth: number;
  destroyed: boolean;
  lastImpactAt: number;
}

type PlayState = 'ready' | 'dragging' | 'flying' | 'resolving' | 'ended';

interface GameSceneInit {
  levelIndex?: number;
}

export class GameScene extends Phaser.Scene {
  private levelIndex = 0;
  private level: LevelConfig = LEVELS[0];
  private progress: ProgressState = loadProgress(LEVELS.length);
  private shotsRemaining = 0;
  private targetsRemaining = 0;
  private launchedShots = 0;
  private state: PlayState = 'ready';
  private dragPointerId?: number;
  private duck?: Phaser.Physics.Matter.Image;
  private duckSettledAt?: number;
  private duckResolutionQueued = false;
  private inputUnlockedAt = 0;
  private overlay?: Phaser.GameObjects.Container;
  private slingGraphics?: Phaser.GameObjects.Graphics;
  private guideGraphics?: Phaser.GameObjects.Graphics;
  private shotsText?: Phaser.GameObjects.Text;
  private targetsText?: Phaser.GameObjects.Text;
  private bestText?: Phaser.GameObjects.Text;
  private actors: Actor[] = [];

  constructor() {
    super(SCENE_KEYS.game);
  }

  init(data: GameSceneInit): void {
    const requestedLevel = data.levelIndex ?? 0;
    this.levelIndex = Phaser.Math.Clamp(requestedLevel, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
  }

  create(): void {
    this.progress = loadProgress(LEVELS.length);
    this.shotsRemaining = this.level.shots;
    this.targetsRemaining = this.level.pieces.filter((piece) => piece.kind === 'target').length;
    this.launchedShots = 0;
    this.state = 'ready';
    this.dragPointerId = undefined;
    this.actors = [];
    this.duck = undefined;
    this.duckSettledAt = undefined;
    this.duckResolutionQueued = false;
    this.inputUnlockedAt = 0;

    this.drawBackground();
    this.createHud();
    this.createPhysicsBounds();
    this.createLevelPieces();

    this.slingGraphics = this.add.graphics();
    this.guideGraphics = this.add.graphics();

    this.spawnDuck();
    this.updateHud();
    this.updateSlingshotVisuals();
    this.inputUnlockedAt = this.time.now + 250;

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.matter.world.on('collisionstart', this.handleCollision, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
  }

  update(time: number): void {
    this.updateSlingshotVisuals();

    if (this.state !== 'flying' || !this.duck) {
      return;
    }

    if (!this.duck.active) {
      this.resolveShot();
      return;
    }

    const speed = this.bodySpeed(this.duck);

    if (this.isOutOfBounds(this.duck.x, this.duck.y) || speed < 1.25) {
      this.duckSettledAt ??= time;

      if (time - this.duckSettledAt > (this.isOutOfBounds(this.duck.x, this.duck.y) ? 260 : 920)) {
        this.resolveShot();
      }
    } else {
      this.duckSettledAt = undefined;
    }
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(
      hexColor(this.level.skyTop),
      hexColor(this.level.skyTop),
      hexColor(this.level.skyBottom),
      hexColor(this.level.skyBottom),
      1,
    );
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const accents = this.add.graphics();
    accents.fillStyle(hexColor(this.level.accent), 0.12);
    accents.fillCircle(1030, 128, 220);
    accents.fillStyle(0xffffff, 0.07);

    for (let index = 0; index < 18; index += 1) {
      accents.fillCircle(
        Phaser.Math.Between(60, GAME_WIDTH - 60),
        Phaser.Math.Between(50, 330),
        Phaser.Math.Between(4, 9),
      );
    }

    const skyline = this.add.graphics();
    skyline.fillStyle(0x112447, 0.34);
    skyline.fillRect(0, 400, GAME_WIDTH, 160);
    skyline.fillStyle(0x0c1932, 1);
    skyline.fillRoundedRect(0, 640, GAME_WIDTH, 90, 0);
    skyline.fillStyle(0x204d71, 1);
    skyline.fillRoundedRect(0, 640, GAME_WIDTH, 18, 0);

    const slingshot = this.add.graphics();
    slingshot.fillStyle(COLORS.woodDark, 1);
    slingshot.fillRoundedRect(120, 502, 18, 132, 8);
    slingshot.fillRoundedRect(178, 482, 18, 152, 8);
    slingshot.fillStyle(COLORS.wood, 1);
    slingshot.fillRoundedRect(100, 622, 130, 18, 12);
  }

  private createHud(): void {
    this.add.text(46, 34, `Level ${this.level.id}: ${this.level.name}`, {
      fontFamily: FONT_STACKS.title,
      fontSize: '34px',
      color: '#fff0bf',
    });

    this.add.text(48, 84, this.level.subtitle, {
      fontFamily: FONT_STACKS.body,
      fontSize: '20px',
      color: '#d7ebff',
      fontStyle: '700',
    });

    this.shotsText = this.add.text(48, 668, '', {
      fontFamily: FONT_STACKS.body,
      fontSize: '24px',
      color: '#fff8de',
      fontStyle: '800',
    });

    this.targetsText = this.add.text(286, 668, '', {
      fontFamily: FONT_STACKS.body,
      fontSize: '24px',
      color: '#fff8de',
      fontStyle: '800',
    });

    this.bestText = this.add.text(520, 668, '', {
      fontFamily: FONT_STACKS.body,
      fontSize: '22px',
      color: '#b5dfff',
      fontStyle: '700',
    });

    createButton(this, {
      x: 1040,
      y: 60,
      width: 112,
      height: 54,
      label: 'Neu',
      fill: COLORS.panelSoft,
      stroke: COLORS.sky,
      onPress: () => {
        jukebox.playBounce();
        this.scene.restart({ levelIndex: this.levelIndex });
      },
    }).setDepth(30);

    createButton(this, {
      x: 1170,
      y: 60,
      width: 112,
      height: 54,
      label: 'Menu',
      fill: 0x0f213e,
      stroke: 0x99caef,
      onPress: () => {
        jukebox.playBounce();
        this.scene.start(SCENE_KEYS.menu);
      },
    }).setDepth(30);
  }

  private createPhysicsBounds(): void {
    this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT, 64, true, true, false, true);
  }

  private createLevelPieces(): void {
    for (const piece of this.level.pieces) {
      if (piece.kind === 'block') {
        this.createBlock(piece);
      } else if (piece.kind === 'target') {
        this.createTarget(piece);
      } else {
        this.createTnt(piece);
      }
    }
  }

  private createBlock(piece: LevelBlock): void {
    const texture = `block-${piece.material}`;
    const config = MATERIAL_CONFIG[piece.material];
    const sprite = this.matter.add.image(piece.x, piece.y, texture);

    sprite.setDisplaySize(piece.width, piece.height);
    sprite.setRectangle(piece.width, piece.height, {
      chamfer: { radius: piece.material === 'jelly' ? 16 : 8 },
    });
    sprite.setDensity(config.density);
    sprite.setFriction(config.friction, config.frictionAir, config.friction * 0.8);
    sprite.setBounce(config.restitution);
    sprite.setAngle(Phaser.Math.RadToDeg(piece.rotation ?? 0));

    const actor: Actor = {
      id: `${piece.kind}-${this.actors.length}`,
      kind: 'block',
      material: piece.material,
      sprite,
      health: 1,
      maxHealth: 1,
      destroyed: false,
      lastImpactAt: 0,
    };

    sprite.setData('actor', actor);
    this.actors.push(actor);
  }

  private createTarget(piece: LevelTarget): void {
    const size = piece.size ?? 70;
    const sprite = this.matter.add.image(piece.x, piece.y, 'target');

    sprite.setDisplaySize(size, size);
    sprite.setCircle(size * 0.36);
    sprite.setDensity(0.0011);
    sprite.setFriction(0.2, 0.018, 0.12);
    sprite.setBounce(0.28);

    const actor: Actor = {
      id: `${piece.kind}-${this.actors.length}`,
      kind: 'target',
      sprite,
      health: piece.health ?? 2,
      maxHealth: piece.health ?? 2,
      destroyed: false,
      lastImpactAt: 0,
    };

    sprite.setData('actor', actor);
    this.actors.push(actor);
  }

  private createTnt(piece: LevelTnt): void {
    const size = piece.size ?? 58;
    const config = MATERIAL_CONFIG.tnt;
    const sprite = this.matter.add.image(piece.x, piece.y, 'tnt');

    sprite.setDisplaySize(size, size);
    sprite.setCircle(size * 0.32);
    sprite.setDensity(config.density);
    sprite.setFriction(config.friction, config.frictionAir, config.friction * 0.7);
    sprite.setBounce(config.restitution);

    const actor: Actor = {
      id: `${piece.kind}-${this.actors.length}`,
      kind: 'tnt',
      material: 'tnt',
      sprite,
      health: 1,
      maxHealth: 1,
      destroyed: false,
      lastImpactAt: 0,
    };

    sprite.setData('actor', actor);
    this.actors.push(actor);
  }

  private spawnDuck(): void {
    if (this.state === 'ended' || this.shotsRemaining <= 0) {
      return;
    }

    this.duck = this.matter.add.image(DUCK_REST.x, DUCK_REST.y, 'duck');
    this.duck.setDisplaySize(82, 82);
    this.duck.setCircle(29);
    this.duck.setDensity(0.001);
    this.duck.setBounce(0.72);
    this.duck.setFriction(0.015, 0.003, 0.02);
    this.duck.setStatic(true);
    this.duck.setDepth(20);
    this.duck.setData('kind', 'duck');
    this.state = 'ready';
    this.duckSettledAt = undefined;
    this.updateHud();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    jukebox.unlock();

    if (this.time.now < this.inputUnlockedAt || this.state !== 'ready' || !this.duck || this.overlay) {
      return;
    }

    const worldPoint = this.toWorldPoint(pointer);

    if (!worldPoint) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.duck.x, this.duck.y);

    if (distance > 62) {
      return;
    }

    this.state = 'dragging';
    this.dragPointerId = pointer.id;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (
      this.time.now < this.inputUnlockedAt ||
      this.state !== 'dragging' ||
      !this.duck ||
      pointer.id !== this.dragPointerId
    ) {
      return;
    }

    const worldPoint = this.toWorldPoint(pointer);

    if (!worldPoint) {
      return;
    }

    const clamped = clampPointToRadius(worldPoint, SLINGSHOT_ANCHOR, MAX_PULL_DISTANCE);
    this.duck.setPosition(clamped.x, clamped.y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (
      this.time.now < this.inputUnlockedAt ||
      this.state !== 'dragging' ||
      !this.duck ||
      pointer.id !== this.dragPointerId
    ) {
      return;
    }

    const stretch = SLINGSHOT_ANCHOR.clone().subtract(new Phaser.Math.Vector2(this.duck.x, this.duck.y));

    if (stretch.length() < 12) {
      this.state = 'ready';
      this.dragPointerId = undefined;
      this.duck.setPosition(DUCK_REST.x, DUCK_REST.y);
      return;
    }

    this.dragPointerId = undefined;
    this.releaseDuck(stretch);
  }

  private releaseDuck(stretch: Phaser.Math.Vector2): void {
    if (!this.duck) {
      return;
    }

    this.duck.setStatic(false);
    this.duck.setVelocity(stretch.x * SHOT_POWER, stretch.y * SHOT_POWER);
    this.duck.setAngularVelocity(Phaser.Math.Clamp(stretch.length() / 1200, 0.02, 0.18));

    this.launchedShots += 1;
    this.shotsRemaining -= 1;
    this.state = 'flying';
    this.duckSettledAt = undefined;
    this.updateHud();
    jukebox.playLaunch();
  }

  private handleCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    for (const pair of event.pairs) {
      const bodyA = pair.bodyA as MatterJS.BodyType & { gameObject?: Phaser.GameObjects.GameObject };
      const bodyB = pair.bodyB as MatterJS.BodyType & { gameObject?: Phaser.GameObjects.GameObject };
      const spriteA = bodyA.gameObject as Phaser.Physics.Matter.Image | undefined;
      const spriteB = bodyB.gameObject as Phaser.Physics.Matter.Image | undefined;

      if (!spriteA || !spriteB) {
        continue;
      }

      const velocityA = bodyA.velocity;
      const velocityB = bodyB.velocity;
      const relativeSpeed = Phaser.Math.Distance.Between(velocityA.x, velocityA.y, velocityB.x, velocityB.y);

      if (relativeSpeed > 4.5) {
        jukebox.playImpact(relativeSpeed);
      }

      if (relativeSpeed > 11) {
        this.cameras.main.shake(80, 0.0025);
      }

      const actorA = spriteA.getData('actor') as Actor | undefined;
      const actorB = spriteB.getData('actor') as Actor | undefined;
      const duckHit = spriteA === this.duck || spriteB === this.duck;

      if (this.launchedShots === 0) {
        continue;
      }

      if (duckHit && (actorA?.material === 'jelly' || actorB?.material === 'jelly') && relativeSpeed > 5) {
        jukebox.playBounce();
      }

      if (actorA?.kind === 'target') {
        this.tryDamageTarget(actorA, relativeSpeed);
      }

      if (actorB?.kind === 'target') {
        this.tryDamageTarget(actorB, relativeSpeed);
      }

      if (actorA?.kind === 'tnt' && relativeSpeed > 7.2) {
        this.detonate(actorA);
      }

      if (actorB?.kind === 'tnt' && relativeSpeed > 7.2) {
        this.detonate(actorB);
      }
    }
  }

  private tryDamageTarget(actor: Actor, impact: number): void {
    if (actor.destroyed || impact < 5.1 || this.time.now - actor.lastImpactAt < 150) {
      return;
    }

    actor.lastImpactAt = this.time.now;
    const damage = impact > 10.5 ? 2 : 1;
    actor.health -= damage;

    if (actor.health <= 0) {
      actor.destroyed = true;
      this.targetsRemaining -= 1;
      this.burst(actor.sprite.x, actor.sprite.y, COLORS.target, 16, 200);
      actor.sprite.destroy();
      this.updateHud();

      if (this.targetsRemaining <= 0) {
        this.handleWin();
      }

      return;
    }

    this.updateTargetLook(actor);
    this.tweens.add({
      targets: actor.sprite,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 80,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  private updateTargetLook(actor: Actor): void {
    const ratio = actor.health / actor.maxHealth;

    if (ratio >= 0.75) {
      actor.sprite.clearTint();
    } else if (ratio >= 0.5) {
      actor.sprite.setTint(0xffc88f);
    } else {
      actor.sprite.setTint(0xff8c73);
    }
  }

  private detonate(actor: Actor): void {
    if (actor.destroyed) {
      return;
    }

    actor.destroyed = true;
    const center = new Phaser.Math.Vector2(actor.sprite.x, actor.sprite.y);

    this.burst(center.x, center.y, COLORS.danger, 22, 280);
    this.cameras.main.shake(180, 0.006);
    jukebox.playExplosion();

    for (const other of this.actors) {
      if (other.destroyed || other.sprite === actor.sprite) {
        continue;
      }

      const dx = other.sprite.x - center.x;
      const dy = other.sprite.y - center.y;
      const distance = Math.max(24, Math.hypot(dx, dy));

      if (distance > 190) {
        continue;
      }

      const force = new Phaser.Math.Vector2(dx / distance, dy / distance)
        .scale((190 - distance) / 190)
        .scale(0.03);

      const otherBody = other.sprite.body as (MatterJS.BodyType & { isStatic?: boolean }) | undefined;

      if (!(other.kind === 'block' && otherBody?.isStatic)) {
        other.sprite.applyForce(force);
      }

      if (other.kind === 'target') {
        other.health -= distance < 100 ? 2 : 1;
        other.lastImpactAt = this.time.now;

        if (other.health <= 0) {
          other.destroyed = true;
          this.targetsRemaining -= 1;
          this.burst(other.sprite.x, other.sprite.y, COLORS.target, 14, 180);
          other.sprite.destroy();
        } else {
          this.updateTargetLook(other);
        }
      }
    }

    const duckBody = this.duck?.body as (MatterJS.BodyType & { isStatic?: boolean }) | undefined;

    if (this.duck && this.duck.active && !duckBody?.isStatic) {
      const dx = this.duck.x - center.x;
      const dy = this.duck.y - center.y;
      const distance = Math.max(18, Math.hypot(dx, dy));

      if (distance <= 190) {
        this.duck.applyForce(new Phaser.Math.Vector2(dx / distance, dy / distance).scale(0.045));
      }
    }

    actor.sprite.destroy();
    this.updateHud();

    if (this.targetsRemaining <= 0) {
      this.handleWin();
    }
  }

  private resolveShot(): void {
    if (this.duckResolutionQueued || this.state === 'ended') {
      return;
    }

    this.duckResolutionQueued = true;
    this.state = 'resolving';

    if (this.duck?.active) {
      this.tweens.add({
        targets: this.duck,
        alpha: 0,
        duration: 220,
        onComplete: () => {
          this.duck?.destroy();
        },
      });
    }

    this.time.delayedCall(360, () => {
      this.duck = undefined;
      this.duckSettledAt = undefined;
      this.duckResolutionQueued = false;

      if (this.state === 'ended') {
        return;
      }

      if (this.targetsRemaining <= 0) {
        this.handleWin();
        return;
      }

      if (this.shotsRemaining > 0) {
        this.spawnDuck();
        return;
      }

      this.time.delayedCall(900, () => {
        if (this.state !== 'ended' && this.targetsRemaining > 0) {
          this.handleLoss();
        }
      });
    });
  }

  private handleWin(): void {
    if (this.state === 'ended') {
      return;
    }

    this.state = 'ended';
    const stars = Phaser.Math.Clamp(this.shotsRemaining + 1, 1, 3);
    this.progress = recordLevelResult(this.progress, this.levelIndex, stars, LEVELS.length);
    this.updateHud();
    jukebox.playWin();

    const nextLevelExists = this.levelIndex < LEVELS.length - 1;
    this.showOverlay({
      title: 'Level geschafft',
      body: `Du hast ${starsLabel(stars)} Sterne geholt und noch ${this.shotsRemaining} Enten uebrig.`,
      accent: COLORS.success,
      buttons: [
        {
          label: 'Nochmal',
          action: () => this.scene.restart({ levelIndex: this.levelIndex }),
        },
        {
          label: 'Menu',
          action: () => this.scene.start(SCENE_KEYS.menu),
        },
        ...(nextLevelExists
          ? [
              {
                label: 'Naechstes',
                action: () => this.scene.start(SCENE_KEYS.game, { levelIndex: this.levelIndex + 1 }),
              },
            ]
          : []),
      ],
    });
  }

  private handleLoss(): void {
    if (this.state === 'ended') {
      return;
    }

    this.state = 'ended';
    jukebox.playLose();
    this.showOverlay({
      title: 'Mehr Quack braucht es',
      body: 'Die Toaster stehen noch. Versuch eine flachere Flugbahn oder triggere TNT frueher.',
      accent: COLORS.danger,
      buttons: [
        {
          label: 'Neu starten',
          action: () => this.scene.restart({ levelIndex: this.levelIndex }),
        },
        {
          label: 'Menu',
          action: () => this.scene.start(SCENE_KEYS.menu),
        },
      ],
    });
  }

  private showOverlay(config: {
    title: string;
    body: string;
    accent: number;
    buttons: Array<{ label: string; action: () => void }>;
  }): void {
    this.overlay?.destroy(true);

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(100);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x07101d, 0.6).setOrigin(0.5);
    const panel = createPanel(this, 0, 0, 560, 320, COLORS.panel, 0.96);
    const stripe = this.add.rectangle(0, -128, 496, 12, config.accent).setOrigin(0.5);
    const title = this.add
      .text(0, -92, config.title, {
        fontFamily: FONT_STACKS.title,
        fontSize: '34px',
        color: '#fff0bf',
      })
      .setOrigin(0.5);
    const body = this.add
      .text(0, -18, config.body, {
        fontFamily: FONT_STACKS.body,
        fontSize: '22px',
        color: '#eef7ff',
        align: 'center',
        wordWrap: { width: 420, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    container.add([shade, panel, stripe, title, body]);

    const startX = -(config.buttons.length - 1) * 98;

    config.buttons.forEach((button, index) => {
      const actionButton = createButton(this, {
        x: startX + index * 196,
        y: 98,
        width: 172,
        height: 68,
        label: button.label,
        fill: index === config.buttons.length - 1 ? config.accent : COLORS.panelSoft,
        stroke: COLORS.sparkle,
        onPress: button.action,
      });

      container.add(actionButton);
    });

    this.overlay = container;
  }

  private updateSlingshotVisuals(): void {
    if (!this.slingGraphics || !this.guideGraphics) {
      return;
    }

    this.slingGraphics.clear();
    this.guideGraphics.clear();

    const leftBand = new Phaser.Math.Vector2(128, 528);
    const rightBand = new Phaser.Math.Vector2(187, 504);
    const target =
      this.duck && (this.state === 'ready' || this.state === 'dragging')
        ? new Phaser.Math.Vector2(this.duck.x, this.duck.y)
        : DUCK_REST.clone();

    this.slingGraphics.lineStyle(8, COLORS.woodDark, 0.95);
    this.slingGraphics.beginPath();
    this.slingGraphics.moveTo(leftBand.x, leftBand.y);
    this.slingGraphics.lineTo(target.x - 8, target.y + 4);
    this.slingGraphics.moveTo(rightBand.x, rightBand.y);
    this.slingGraphics.lineTo(target.x + 8, target.y + 4);
    this.slingGraphics.strokePath();

    if (this.state !== 'dragging' || !this.duck) {
      return;
    }

    const stretch = SLINGSHOT_ANCHOR.clone().subtract(new Phaser.Math.Vector2(this.duck.x, this.duck.y));
    const velocity = stretch.scale(SHOT_POWER * 0.92);
    const gravity = 0.86;

    this.guideGraphics.fillStyle(0xfff5d1, 0.94);

    for (let step = 1; step <= 7; step += 1) {
      const t = step * 6;
      const x = this.duck.x + velocity.x * t;
      const y = this.duck.y + velocity.y * t + gravity * step * step * 12;
      this.guideGraphics.fillCircle(x, y, Math.max(3, 8 - step * 0.7));
    }
  }

  private updateHud(): void {
    this.shotsText?.setText(`Enten ${this.shotsRemaining}`);
    this.targetsText?.setText(`Toaster ${this.targetsRemaining}`);
    this.bestText?.setText(`Beste Runde ${starsLabel(this.progress.bestStars[this.levelIndex] ?? 0)}`);
  }

  private burst(x: number, y: number, color: number, count: number, spread: number): void {
    for (let index = 0; index < count; index += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(3, 7), color, 0.9).setDepth(70);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(Math.floor(spread * 0.28), spread);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.tweens.add({
        targets: dot,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 420),
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  private toWorldPoint(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 | undefined {
    const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2 | undefined;

    if (!point) {
      return undefined;
    }

    return new Phaser.Math.Vector2(point.x, point.y);
  }

  private bodySpeed(sprite: Phaser.Physics.Matter.Image): number {
    const body = sprite.body as MatterJS.BodyType | undefined;

    if (!body) {
      return 0;
    }

    return Math.hypot(body.velocity.x, body.velocity.y);
  }

  private isOutOfBounds(x: number, y: number): boolean {
    return (
      x < -OFFSCREEN_MARGIN ||
      x > GAME_WIDTH + OFFSCREEN_MARGIN ||
      y < -OFFSCREEN_MARGIN ||
      y > GAME_HEIGHT + OFFSCREEN_MARGIN
    );
  }

  private cleanupScene(): void {
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.matter.world.off('collisionstart', this.handleCollision, this);
  }
}
