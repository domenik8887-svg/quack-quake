import Phaser from 'phaser';

import { COLORS, FONT_STACKS } from './constants';

interface ButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  caption?: string;
  footer?: string;
  fill: number;
  stroke?: number;
  disabled?: boolean;
  onPress?: () => void;
  hitPadding?: number;
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

function wireTap(
  target: Phaser.GameObjects.Container,
  width: number,
  height: number,
  hitPadding: number,
  disabled: boolean,
  onPress?: () => void,
  redraw?: (state: 'idle' | 'hover' | 'pressed') => void,
): void {
  if (disabled || !onPress) {
    target.setAlpha(0.72);
    return;
  }

  let pressedPointerId: number | null = null;

  target
    .setInteractive(
      new Phaser.Geom.Rectangle(
        -width / 2 - hitPadding,
        -height / 2 - hitPadding,
        width + hitPadding * 2,
        height + hitPadding * 2,
      ),
      Phaser.Geom.Rectangle.Contains,
    )
    .on('pointerover', () => {
      if (pressedPointerId === null) {
        redraw?.('hover');
        target.setScale(1.015);
      }
    })
    .on('pointerout', () => {
      if (pressedPointerId === null) {
        redraw?.('idle');
        target.setScale(1);
      }
    })
    .on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      pressedPointerId = _pointer.id;
      redraw?.('pressed');
      target.setScale(0.99);
      onPress();
    })
    .on('pointerup', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (pressedPointerId === pointer.id) {
        pressedPointerId = null;
      }
      redraw?.('hover');
      target.setScale(1.015);
    })
    .on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      if (pressedPointerId === pointer.id) {
        pressedPointerId = null;
      }
      redraw?.('idle');
      target.setScale(1);
    });
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
    footer,
    fill,
    stroke = 0xffffff,
    disabled = false,
    onPress,
    hitPadding = 12,
  }: ButtonOptions,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const background = scene.add.graphics();
  const titleY = footer ? -18 : caption ? -10 : 0;
  const captionY = footer ? 10 : 18;
  const title = scene.add
    .text(0, titleY, label, {
      fontFamily: FONT_STACKS.body,
      fontSize: footer ? '30px' : caption ? '28px' : '24px',
      fontStyle: '800',
      color: '#fff8ef',
      align: 'center',
    })
    .setOrigin(0.5);

  const details = caption
    ? scene.add
        .text(0, captionY, caption, {
          fontFamily: FONT_STACKS.body,
          fontSize: footer ? '16px' : '15px',
          color: '#e5f2ff',
          align: 'center',
          wordWrap: { width: width - 42, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
        .setAlpha(0.88)
    : undefined;

  const meta = footer
    ? scene.add
        .text(0, height / 2 - 22, footer, {
          fontFamily: FONT_STACKS.body,
          fontSize: '15px',
          color: '#fff8de',
          fontStyle: '700',
          align: 'center',
          wordWrap: { width: width - 34, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
    : undefined;

  const draw = (state: 'idle' | 'hover' | 'pressed') => {
    background.clear();
    background.fillStyle(fill, disabled ? 0.38 : state === 'pressed' ? 1 : state === 'hover' ? 0.98 : 0.92);
    background.lineStyle(
      3,
      stroke,
      disabled ? 0.08 : state === 'pressed' ? 0.72 : state === 'hover' ? 0.55 : 0.32,
    );
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
    background.fillStyle(0xffffff, disabled ? 0.04 : state === 'pressed' ? 0.16 : 0.08);
    background.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, 24, 12);
  };

  draw('idle');
  container.add([background, title]);

  if (details) {
    container.add(details);
  }

  if (meta) {
    container.add(meta);
  }

  container.setSize(width, height);
  wireTap(container, width, height, hitPadding, disabled, onPress, draw);
  return container;
}

interface LevelCardOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  title: string;
  subtitle: string;
  footer: string;
  accent: number;
  locked?: boolean;
  onPress?: () => void;
}

export function createLevelCard(
  scene: Phaser.Scene,
  {
    x,
    y,
    width,
    height,
    label,
    title,
    subtitle,
    footer,
    accent,
    locked = false,
    onPress,
  }: LevelCardOptions,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const background = scene.add.graphics();
  const badge = scene.add.graphics();
  const labelText = scene.add
    .text(-width / 2 + 28, -height / 2 + 20, label, {
      fontFamily: FONT_STACKS.body,
      fontSize: '16px',
      color: '#fff8de',
      fontStyle: '800',
    })
    .setOrigin(0, 0.5);
  const titleText = scene.add
    .text(-width / 2 + 28, -18, title, {
      fontFamily: FONT_STACKS.body,
      fontSize: '28px',
      color: '#fef7eb',
      fontStyle: '800',
      wordWrap: { width: width - 56, useAdvancedWrap: true },
    })
    .setOrigin(0, 0.5);
  const subtitleText = scene.add
    .text(-width / 2 + 28, 20, subtitle, {
      fontFamily: FONT_STACKS.body,
      fontSize: '16px',
      color: '#d8eafb',
      wordWrap: { width: width - 56, useAdvancedWrap: true },
    })
    .setOrigin(0, 0.5)
    .setAlpha(locked ? 0.65 : 0.9);
  const footerText = scene.add
    .text(-width / 2 + 28, height / 2 - 22, footer, {
      fontFamily: FONT_STACKS.body,
      fontSize: '14px',
      color: '#fff8de',
      fontStyle: '700',
    })
    .setOrigin(0, 0.5)
    .setAlpha(locked ? 0.6 : 0.92);

  const draw = (state: 'idle' | 'hover' | 'pressed') => {
    const fill = locked ? 0x2a3e5b : COLORS.panelSoft;
    background.clear();
    background.fillStyle(fill, locked ? 0.82 : state === 'pressed' ? 0.98 : 0.92);
    background.lineStyle(3, locked ? 0x7f97b0 : accent, locked ? 0.18 : state === 'pressed' ? 0.75 : 0.45);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 26);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 26);
    background.fillStyle(0xffffff, locked ? 0.02 : 0.07);
    background.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, 28, 14);

    badge.clear();
    badge.fillStyle(locked ? 0x586b84 : accent, locked ? 0.65 : 0.96);
    badge.fillRoundedRect(width / 2 - 74, -height / 2 + 18, 52, 26, 13);
  };

  const lockText = scene.add
    .text(width / 2 - 48, -height / 2 + 31, locked ? 'LOCK' : 'OPEN', {
      fontFamily: FONT_STACKS.body,
      fontSize: '12px',
      color: '#08121f',
      fontStyle: '800',
      align: 'center',
    })
    .setOrigin(0.5);

  draw('idle');
  container.add([background, badge, labelText, titleText, subtitleText, footerText, lockText]);
  container.setSize(width, height);
  wireTap(container, width, height, 16, locked, onPress, draw);

  return container;
}

export function createStatChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const panel = createPanel(scene, 0, 0, width, 58, COLORS.panelSoft, 0.84);
  const labelText = scene.add
    .text(-width / 2 + 18, -8, label, {
      fontFamily: FONT_STACKS.body,
      fontSize: '14px',
      color: '#a9d7fb',
      fontStyle: '700',
    })
    .setOrigin(0, 0.5);
  const valueText = scene.add
    .text(-width / 2 + 18, 13, value, {
      fontFamily: FONT_STACKS.body,
      fontSize: '22px',
      color: '#fff8de',
      fontStyle: '800',
    })
    .setOrigin(0, 0.5);

  container.add([panel, labelText, valueText]);
  container.setSize(width, 58);
  container.setData('valueText', valueText);
  return container;
}

export function starsLabel(stars: number): string {
  return stars > 0 ? '*'.repeat(stars) : '-';
}
