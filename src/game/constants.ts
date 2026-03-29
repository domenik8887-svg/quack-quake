import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_SIZE = { width: GAME_WIDTH, height: GAME_HEIGHT } as const;

export const SCENE_KEYS = {
  boot: 'boot',
  menu: 'menu',
  game: 'game',
} as const;

export const DUCK_REST = new Phaser.Math.Vector2(200, 560);
export const SLINGSHOT_ANCHOR = new Phaser.Math.Vector2(165, 570);
export const MAX_PULL_DISTANCE = 105;
export const SHOT_POWER = 0.22;
export const OFFSCREEN_MARGIN = 180;

export const COLORS = {
  cream: 0xfff7de,
  ink: 0x11243f,
  night: 0x08121f,
  sky: 0x6dc8ff,
  duck: 0xffcf3e,
  duckBeak: 0xff8b2e,
  duckWing: 0xf8bd2f,
  wood: 0xb8783d,
  woodDark: 0x844f25,
  metal: 0x8aa6c4,
  metalDark: 0x5f7898,
  jelly: 0x69e7da,
  jellyDark: 0x19b4ad,
  danger: 0xf54d4d,
  target: 0xff9d4b,
  targetDark: 0xd76a26,
  shadow: 0x10213f,
  panel: 0x13284d,
  panelSoft: 0x1e3b66,
  success: 0x8ef2a2,
  sparkle: 0xfff0a5,
} as const;

export const MATERIAL_CONFIG = {
  wood: {
    density: 0.0012,
    friction: 0.78,
    frictionAir: 0.015,
    restitution: 0.16,
    stroke: COLORS.woodDark,
  },
  metal: {
    density: 0.0026,
    friction: 0.46,
    frictionAir: 0.01,
    restitution: 0.08,
    stroke: COLORS.metalDark,
  },
  jelly: {
    density: 0.001,
    friction: 0.18,
    frictionAir: 0.02,
    restitution: 0.9,
    stroke: COLORS.jellyDark,
  },
  tnt: {
    density: 0.0014,
    friction: 0.5,
    frictionAir: 0.018,
    restitution: 0.12,
    stroke: 0x7d1616,
  },
} as const;

export const FONT_STACKS = {
  title: '"Bungee", "Arial Black", sans-serif',
  body: '"Nunito", "Segoe UI", sans-serif',
} as const;

export function hexColor(value: string): number {
  return Phaser.Display.Color.HexStringToColor(value).color;
}

export function clampPointToRadius(
  point: Phaser.Math.Vector2,
  anchor: Phaser.Math.Vector2,
  radius: number,
): Phaser.Math.Vector2 {
  const delta = point.clone().subtract(anchor);

  if (delta.length() <= radius) {
    return point;
  }

  return anchor.clone().add(delta.normalize().scale(radius));
}
