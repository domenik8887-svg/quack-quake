export type MaterialName = 'wood' | 'metal' | 'jelly' | 'tnt';

export interface LevelBlock {
  kind: 'block';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  material: Exclude<MaterialName, 'tnt'>;
}

export interface LevelTarget {
  kind: 'target';
  x: number;
  y: number;
  size?: number;
  health?: number;
}

export interface LevelTnt {
  kind: 'tnt';
  x: number;
  y: number;
  size?: number;
}

export type LevelPiece = LevelBlock | LevelTarget | LevelTnt;

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  accent: string;
  shots: number;
  pieces: LevelPiece[];
}

export interface ProgressState {
  unlockedLevel: number;
  bestStars: number[];
}
