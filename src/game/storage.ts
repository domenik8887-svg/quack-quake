import type { ProgressState } from './types';

const STORAGE_KEY = 'quack-quake-progress-v1';

export function createDefaultProgress(levelCount: number): ProgressState {
  return {
    unlockedLevel: 0,
    bestStars: Array.from({ length: levelCount }, () => 0),
  };
}

export function loadProgress(levelCount: number): ProgressState {
  const fallback = createDefaultProgress(levelCount);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const bestStars = Array.isArray(parsed.bestStars)
      ? parsed.bestStars.map((value) =>
          typeof value === 'number' && value >= 0 ? Math.floor(value) : 0,
        )
      : [];

    return {
      unlockedLevel:
        typeof parsed.unlockedLevel === 'number'
          ? Math.min(levelCount - 1, Math.max(0, Math.floor(parsed.unlockedLevel)))
          : 0,
      bestStars: Array.from({ length: levelCount }, (_, index) => bestStars[index] ?? 0),
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(progress: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage failures in private mode or restricted contexts.
  }
}

export function recordLevelResult(
  current: ProgressState,
  levelIndex: number,
  stars: number,
  levelCount: number,
): ProgressState {
  const next = {
    unlockedLevel: Math.max(current.unlockedLevel, Math.min(levelCount - 1, levelIndex + 1)),
    bestStars: [...current.bestStars],
  };

  next.bestStars[levelIndex] = Math.max(next.bestStars[levelIndex] ?? 0, stars);
  saveProgress(next);

  return next;
}
