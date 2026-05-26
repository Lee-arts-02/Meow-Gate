import type { CatImageType, CatMemoryState, StudentExample } from '../types';

export type { CatMemoryState, StudentExample };

export const ALL_CAT_IMAGE_TYPES: CatImageType[] = [
  'standard',
  'midnight',
  'oneEar',
  'pirate',
  'round',
];

export function getInitialCoverage(): Record<CatImageType, number> {
  return {
    standard: 0.9,
    midnight: 0.28,
    oneEar: 0.25,
    pirate: 0.3,
    round: 0.27,
  };
}

export function getInitialMemoryState(): CatMemoryState {
  return {
    studentExamples: [],
    coverage: getInitialCoverage(),
  };
}
