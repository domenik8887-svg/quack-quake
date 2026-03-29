import Phaser from 'phaser';

import './style.css';

import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { MenuScene } from './game/scenes/MenuScene';

declare global {
  interface Window {
    __quackQuakeGame?: Phaser.Game;
  }
}

const parent = document.querySelector<HTMLDivElement>('#app');

if (!parent) {
  throw new Error('Missing #app mount point.');
}

async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) {
    return;
  }

  await document.fonts.ready;
}

async function startGame(): Promise<void> {
  await waitForFonts();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#08121f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1.05 },
        enableSleeping: true,
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, GameScene],
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  });

  window.__quackQuakeGame = game;

  window.addEventListener('resize', () => {
    game.scale.refresh();
  });
}

void startGame();
