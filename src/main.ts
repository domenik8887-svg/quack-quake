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

parent.innerHTML = `
  <div id="game-shell">
    <div id="game-root"></div>
    <div id="rotate-overlay" data-active="false" aria-live="polite">
      <div class="rotate-card">
        <div class="rotate-phone" aria-hidden="true"></div>
        <h1>Bitte ins Querformat drehen</h1>
        <p>Quack Quake ist fuer iPhone-Landscape gebaut und reagiert dort deutlich praeziser.</p>
      </div>
    </div>
  </div>
`;

const gameRoot = parent.querySelector<HTMLDivElement>('#game-root');
const rotateOverlay = parent.querySelector<HTMLDivElement>('#rotate-overlay');

if (!gameRoot || !rotateOverlay) {
  throw new Error('Game shell could not be created.');
}

const rotateOverlayElement = rotateOverlay;

async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) {
    return;
  }

  await document.fonts.ready;
}

async function tryLockLandscape(): Promise<void> {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (orientation: 'landscape' | 'portrait' | 'any') => Promise<void>;
  };

  if (!orientation.lock) {
    return;
  }

  try {
    await orientation.lock('landscape');
  } catch {
    // Some browsers only allow this in fullscreen or native wrappers.
  }
}

function updateOrientationUi(): void {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  rotateOverlayElement.dataset.active = isPortrait ? 'true' : 'false';
}

async function startGame(): Promise<void> {
  await waitForFonts();
  await tryLockLandscape();
  updateOrientationUi();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#08121f',
    scale: {
      mode: Phaser.Scale.ENVELOP,
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

  const refresh = () => {
    updateOrientationUi();
    game.scale.refresh();
  };

  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
  window.addEventListener('focus', () => {
    void tryLockLandscape();
    refresh();
  });
  window.addEventListener(
    'pointerdown',
    () => {
      void tryLockLandscape();
    },
    { passive: true },
  );
}

void startGame();
