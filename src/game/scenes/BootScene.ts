import Phaser from 'phaser';

import { SCENE_KEYS } from '../constants';
import { createGameTextures } from '../textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    createGameTextures(this);
    this.scene.start(SCENE_KEYS.menu);
  }
}
