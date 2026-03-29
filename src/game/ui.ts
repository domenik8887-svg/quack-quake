import Phaser from 'phaser';

import { FONT_STACKS } from './constants';

interface ButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  caption?: string;
  fill: number;
  stroke?: number;
  disabled?: boolean;
  onPress?: () => void;
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  alpha = 0.92,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics({ x, y });
  graphics.fillStyle(fill, alpha);
  graphics.lineStyle(3, 0xffffff, 0.08);
  graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
  graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);
  return graphics;
}

export function createButton(
  scene: Phaser.Scene,
  {
    x,
    y,
    width,
    height,
    label,
    caption,
    fill,
    stroke = 0xffffff,
    disabled = false,
    onPress,
  }: ButtonOptions,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const background = scene.add.graphics();
  const title = scene.add
    .text(0, caption ? -8 : 0, label, {
      fontFamily: FONT_STACKS.body,
      fontSize: caption ? '28px' : '24px',
      fontStyle: '800',
      color: '#fff8ef',
      align: 'center',
    })
    .setOrigin(0.5);

  const details = caption
    ? scene.add
        .text(0, 18, caption, {
          fontFamily: FONT_STACKS.body,
          fontSize: '15px',
          color: '#e5f2ff',
          align: 'center',
        })
        .setOrigin(0.5)
        .setAlpha(0.88)
    : undefined;

  const draw = (hovered: boolean) => {
    background.clear();
    background.fillStyle(fill, disabled ? 0.38 : hovered ? 1 : 0.92);
    background.lineStyle(3, stroke, disabled ? 0.08 : hovered ? 0.55 : 0.32);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
  };

  draw(false);
  container.add([background, title]);

  if (details) {
    container.add(details);
  }

  container.setSize(width, height);

  if (!disabled && onPress) {
    container
      .setInteractive(
        new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      )
      .on('pointerover', () => {
        draw(true);
        container.setScale(1.02);
      })
      .on('pointerout', () => {
        draw(false);
        container.setScale(1);
      })
      .on('pointerdown', () => {
        container.setScale(0.985);
      })
      .on('pointerup', () => {
        container.setScale(1.02);
        onPress();
      });
  } else {
    container.setAlpha(0.7);
  }

  return container;
}

export function starsLabel(stars: number): string {
  return stars > 0 ? '*'.repeat(stars) : '-';
}
