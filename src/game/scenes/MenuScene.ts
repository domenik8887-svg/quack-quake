import Phaser from 'phaser';

import { jukebox } from '../audio';
import { COLORS, FONT_STACKS, GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS, hexColor } from '../constants';
import { LEVELS } from '../levels';
import { loadProgress } from '../storage';
import { createButton, createLevelCard, createPanel, starsLabel } from '../ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    const progress = loadProgress(LEVELS.length);

    this.drawBackground();
    this.drawHeader(progress.unlockedLevel, progress.bestStars);
    this.drawLevelGrid(progress.unlockedLevel, progress.bestStars);
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(COLORS.night, COLORS.night, 0x204d7c, 0x163253, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const haze = this.add.graphics();
    haze.fillStyle(0xffd46d, 0.12);
    haze.fillCircle(1032, 120, 230);
    haze.fillStyle(0x5bc2ff, 0.1);
    haze.fillCircle(188, 612, 220);
    haze.fillStyle(0xffffff, 0.08);

    for (let index = 0; index < 28; index += 1) {
      haze.fillCircle(
        Phaser.Math.Between(40, GAME_WIDTH - 40),
        Phaser.Math.Between(40, GAME_HEIGHT - 40),
        Phaser.Math.Between(2, 7),
      );
    }

    const floor = this.add.graphics();
    floor.fillStyle(0x12264a, 1);
    floor.fillRoundedRect(24, 632, GAME_WIDTH - 48, 70, 26);
    floor.fillStyle(0x264d71, 1);
    floor.fillRoundedRect(24, 632, GAME_WIDTH - 48, 18, 26);

    const water = this.add.graphics();
    water.fillStyle(0x5bc2ff, 0.08);
    water.fillEllipse(618, 646, 1180, 78);
  }

  private drawHeader(unlockedLevel: number, bestStars: number[]): void {
    const leftPanel = createPanel(this, 230, 340, 380, 470, COLORS.panel, 0.88);
    const rightPanel = createPanel(this, 878, 340, 700, 470, COLORS.panel, 0.88);
    leftPanel.setDepth(1);
    rightPanel.setDepth(1);

    const mascot = this.add.image(202, 182, 'duck').setScale(1.32).setAngle(-8).setDepth(3);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 14,
      angle: 6,
      duration: 1300,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    this.add.text(52, 78, 'Quack Quake', {
      fontFamily: FONT_STACKS.title,
      fontSize: '58px',
      color: '#fff3c6',
    }).setDepth(3);

    this.add.text(54, 132, 'Ein richtiges iPhone-Arcade-Spiel mit Slingshot-Physik.', {
      fontFamily: FONT_STACKS.body,
      fontSize: '24px',
      color: '#d1e7fb',
      fontStyle: '700',
    }).setDepth(3);

    this.add.text(54, 170, `Freigeschaltet bis Level ${unlockedLevel + 1}`, {
      fontFamily: FONT_STACKS.body,
      fontSize: '20px',
      color: '#9dd7ff',
    }).setDepth(3);

    const totalStars = bestStars.reduce((sum, value) => sum + value, 0);

    this.add.text(72, 246, 'Schnellstart', {
      fontFamily: FONT_STACKS.title,
      fontSize: '34px',
      color: '#ffe8b2',
    }).setDepth(3);

    createButton(this, {
      x: 230,
      y: 310,
      width: 286,
      height: 116,
      label: 'Weiter',
      caption: `Starte direkt in Level ${unlockedLevel + 1}`,
      footer: `${totalStars} Sterne eingesammelt`,
      fill: COLORS.target,
      stroke: COLORS.sparkle,
      hitPadding: 20,
      onPress: () => {
        jukebox.playLaunch();
        this.scene.start(SCENE_KEYS.game, { levelIndex: unlockedLevel });
      },
    }).setDepth(3);

    this.add.text(
      70,
      404,
      'Tippen, ziehen, loslassen.\nJelly federt.\nTNT macht dummen Larm.\nDie besten Runs bleiben gespeichert.',
      {
        fontFamily: FONT_STACKS.body,
        fontSize: '22px',
        color: '#f5fbff',
        lineSpacing: 10,
      },
    ).setDepth(3);

    this.add.text(72, 572, 'Tipp: Ein flacher Schuss ist auf iPhones meist kontrollierbarer.', {
      fontFamily: FONT_STACKS.body,
      fontSize: '17px',
      color: '#b9d6ef',
    }).setDepth(3);

    this.add.text(556, 118, 'Level Auswahl', {
      fontFamily: FONT_STACKS.title,
      fontSize: '38px',
      color: '#ffe8b2',
    }).setDepth(3);

    this.add.text(556, 154, 'Große Touch-Karten, optimiert für Querformat.', {
      fontFamily: FONT_STACKS.body,
      fontSize: '18px',
      color: '#c8e2f8',
      fontStyle: '700',
    }).setDepth(3);
  }

  private drawLevelGrid(unlockedLevel: number, bestStars: number[]): void {
    const columns = 2;
    const startX = 704;
    const startY = 232;
    const gapX = 332;
    const gapY = 142;

    LEVELS.forEach((level, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * gapX;
      const y = startY + row * gapY;
      const unlocked = index <= unlockedLevel;
      const stars = starsLabel(bestStars[index] ?? 0);

      createLevelCard(this, {
        x,
        y,
        width: 300,
        height: 122,
        label: `LEVEL ${level.id}`,
        title: unlocked ? level.name : 'Noch gesperrt',
        subtitle: unlocked ? level.subtitle : 'Erst das vorherige Level schaffen.',
        footer: unlocked ? `${level.shots} Enten  |  Beste ${stars}` : 'Gesperrt',
        accent: hexColor(level.accent),
        locked: !unlocked,
        onPress: () => {
          jukebox.playLaunch();
          this.scene.start(SCENE_KEYS.game, { levelIndex: index });
        },
      }).setDepth(3);
    });
  }
}
