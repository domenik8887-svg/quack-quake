import Phaser from 'phaser';

import { jukebox } from '../audio';
import { COLORS, FONT_STACKS, GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS, hexColor } from '../constants';
import { LEVELS } from '../levels';
import { loadProgress } from '../storage';
import { createButton, createPanel, starsLabel } from '../ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    const progress = loadProgress(LEVELS.length);

    this.drawBackground();
    this.drawHeader(progress.unlockedLevel);

    createButton(this, {
      x: 205,
      y: 288,
      width: 242,
      height: 78,
      label: 'Losquaken',
      caption: `Weiter mit Level ${progress.unlockedLevel + 1}`,
      fill: COLORS.target,
      stroke: COLORS.sparkle,
      onPress: () => {
        jukebox.playLaunch();
        this.scene.start(SCENE_KEYS.game, { levelIndex: progress.unlockedLevel });
      },
    });

    this.add.text(70, 352, 'So gehts', {
      fontFamily: FONT_STACKS.title,
      fontSize: '34px',
      color: '#ffe9b0',
    });

    this.add.text(
      70,
      400,
      'Zieh die Gummiente nach hinten,\nlass los und werf die grummeligen\nToaster aus ihren Tuerme.\nJelly springt, TNT fliegt, Metall haelt durch.',
      {
        fontFamily: FONT_STACKS.body,
        fontSize: '24px',
        color: '#f5fbff',
        lineSpacing: 8,
      },
    );

    this.add.text(70, 588, 'Tippe ein freigeschaltetes Level an.', {
      fontFamily: FONT_STACKS.body,
      fontSize: '20px',
      color: '#c6def5',
    });

    this.drawLevelGrid(progress.unlockedLevel, progress.bestStars);
  }

  private drawBackground(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(COLORS.night, COLORS.night, 0x204d7c, 0x163253, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const haze = this.add.graphics();
    haze.fillStyle(0xffd46d, 0.12);
    haze.fillCircle(1020, 140, 220);
    haze.fillStyle(0x5bc2ff, 0.1);
    haze.fillCircle(220, 620, 200);
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
    floor.fillRoundedRect(28, 632, GAME_WIDTH - 56, 70, 26);
    floor.fillStyle(0x264d71, 1);
    floor.fillRoundedRect(28, 632, GAME_WIDTH - 56, 18, 26);
  }

  private drawHeader(unlockedLevel: number): void {
    const mascot = this.add.image(192, 156, 'duck').setScale(1.24).setAngle(-8);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 14,
      angle: 6,
      duration: 1300,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    this.add.text(72, 72, 'Quack Quake', {
      fontFamily: FONT_STACKS.title,
      fontSize: '64px',
      color: '#fff3c6',
    });

    this.add.text(72, 132, 'Physik, Chaos und beleidigte Toaster.', {
      fontFamily: FONT_STACKS.body,
      fontSize: '28px',
      color: '#d1e7fb',
      fontStyle: '700',
    });

    this.add.text(72, 176, `Freigeschaltet bis Level ${unlockedLevel + 1}`, {
      fontFamily: FONT_STACKS.body,
      fontSize: '20px',
      color: '#9dd7ff',
    });
  }

  private drawLevelGrid(unlockedLevel: number, bestStars: number[]): void {
    createPanel(this, 866, 360, 720, 468, COLORS.panel, 0.86);

    this.add.text(546, 120, 'Level Auswahl', {
      fontFamily: FONT_STACKS.title,
      fontSize: '38px',
      color: '#ffe8b2',
    });

    const columns = 3;

    LEVELS.forEach((level, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = 544 + column * 216;
      const y = 230 + row * 170;
      const unlocked = index <= unlockedLevel;
      const accent = hexColor(level.accent);

      const card = createButton(this, {
        x,
        y,
        width: 186,
        height: 126,
        label: `Level ${level.id}`,
        caption: unlocked ? level.name : 'Gesperrt',
        fill: unlocked ? accent : 0x324967,
        stroke: unlocked ? COLORS.sparkle : 0xa6bdd6,
        disabled: !unlocked,
        onPress: () => {
          jukebox.playLaunch();
          this.scene.start(SCENE_KEYS.game, { levelIndex: index });
        },
      });

      const subtitle = this.add
        .text(x, y + 18, unlocked ? level.subtitle : 'Erst die vorherige Etage ententoesen.', {
          fontFamily: FONT_STACKS.body,
          fontSize: '14px',
          color: '#eef7ff',
          align: 'center',
          wordWrap: { width: 160, useAdvancedWrap: true },
        })
        .setOrigin(0.5, 0);
      subtitle.setAlpha(unlocked ? 0.9 : 0.7);

      const stars = this.add
        .text(x, y + 48, `Beste ${starsLabel(bestStars[index] ?? 0)}`, {
          fontFamily: FONT_STACKS.body,
          fontSize: '18px',
          color: '#fff3c6',
          fontStyle: '800',
        })
        .setOrigin(0.5);

      stars.setAlpha(unlocked ? 1 : 0.55);
      card.setDepth(2);
      subtitle.setDepth(3);
      stars.setDepth(3);
    });
  }
}
