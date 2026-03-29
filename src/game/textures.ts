import Phaser from 'phaser';

import { COLORS } from './constants';

function withGraphics(
  scene: Phaser.Scene,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics({ x: 0, y: 0 });
  graphics.setVisible(false);
  draw(graphics);
  return graphics;
}

export function createGameTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('duck')) {
    return;
  }

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.duck);
    graphics.fillEllipse(52, 56, 72, 58);
    graphics.fillStyle(COLORS.duckWing);
    graphics.fillEllipse(60, 58, 32, 24);
    graphics.fillStyle(COLORS.duckBeak);
    graphics.fillTriangle(74, 56, 96, 48, 96, 64);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(46, 44, 11);
    graphics.fillStyle(COLORS.ink);
    graphics.fillCircle(48, 44, 5);
    graphics.lineStyle(4, COLORS.woodDark, 0.45);
    graphics.strokeEllipse(52, 56, 72, 58);
    graphics.generateTexture('duck', 104, 104);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.target);
    graphics.fillRoundedRect(8, 8, 88, 88, 24);
    graphics.fillStyle(0xfff4dc);
    graphics.fillCircle(52, 52, 24);
    graphics.lineStyle(5, COLORS.targetDark, 1);
    graphics.strokeRoundedRect(8, 8, 88, 88, 24);
    graphics.lineStyle(4, COLORS.targetDark, 0.9);
    graphics.beginPath();
    graphics.moveTo(36, 36);
    graphics.lineTo(44, 42);
    graphics.moveTo(68, 36);
    graphics.lineTo(60, 42);
    graphics.strokePath();
    graphics.fillStyle(COLORS.targetDark);
    graphics.fillCircle(43, 53, 4);
    graphics.fillCircle(61, 53, 4);
    graphics.lineStyle(4, COLORS.targetDark, 1);
    graphics.beginPath();
    graphics.moveTo(42, 68);
    graphics.lineTo(52, 62);
    graphics.lineTo(62, 68);
    graphics.strokePath();
    graphics.generateTexture('target', 104, 104);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.wood);
    graphics.fillRoundedRect(0, 0, 128, 64, 12);
    graphics.lineStyle(5, COLORS.woodDark, 0.8);
    graphics.strokeRoundedRect(3, 3, 122, 58, 10);
    graphics.lineStyle(3, COLORS.woodDark, 0.45);
    graphics.beginPath();
    graphics.moveTo(28, 8);
    graphics.lineTo(22, 56);
    graphics.moveTo(74, 8);
    graphics.lineTo(80, 56);
    graphics.strokePath();
    graphics.generateTexture('block-wood', 128, 64);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.metal);
    graphics.fillRoundedRect(0, 0, 128, 64, 10);
    graphics.lineStyle(4, COLORS.metalDark, 0.95);
    graphics.strokeRoundedRect(2, 2, 124, 60, 10);
    graphics.lineStyle(3, COLORS.metalDark, 0.4);
    graphics.beginPath();
    graphics.moveTo(18, 18);
    graphics.lineTo(110, 18);
    graphics.moveTo(18, 32);
    graphics.lineTo(110, 32);
    graphics.moveTo(18, 46);
    graphics.lineTo(110, 46);
    graphics.strokePath();
    graphics.fillStyle(COLORS.metalDark, 0.8);
    graphics.fillCircle(18, 18, 4);
    graphics.fillCircle(110, 18, 4);
    graphics.fillCircle(18, 46, 4);
    graphics.fillCircle(110, 46, 4);
    graphics.generateTexture('block-metal', 128, 64);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.jelly, 0.95);
    graphics.fillRoundedRect(0, 0, 128, 64, 22);
    graphics.fillStyle(0xffffff, 0.24);
    graphics.fillRoundedRect(14, 10, 74, 18, 9);
    graphics.lineStyle(4, COLORS.jellyDark, 0.85);
    graphics.strokeRoundedRect(2, 2, 124, 60, 22);
    graphics.generateTexture('block-jelly', 128, 64);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.danger);
    graphics.fillRoundedRect(8, 0, 48, 64, 14);
    graphics.fillStyle(0xf2d7d7);
    graphics.fillRect(8, 24, 48, 14);
    graphics.fillStyle(0x7d1616);
    graphics.fillRect(28, 0, 8, 64);
    graphics.fillCircle(32, 12, 7);
    graphics.lineStyle(4, 0x7d1616, 1);
    graphics.strokeRoundedRect(10, 2, 44, 60, 12);
    graphics.generateTexture('tnt', 64, 64);
    graphics.destroy();
  });

  withGraphics(scene, (graphics) => {
    graphics.fillStyle(COLORS.sparkle);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('spark', 16, 16);
    graphics.destroy();
  });
}
