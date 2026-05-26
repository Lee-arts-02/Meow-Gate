export {
  GATE_IMAGE,
  drawChallenges,
  getDrawChallenge,
  initialMemoryBookCats,
  initialMemoryBookCats as initialStandardCats,
  getStandardMemoryBookCatImage,
  getStandardMemoryBookCatImage as getStandardCatImage,
  standardMemoryCats,
  evaluationCats,
  getRandomEvaluationCat,
  getEvaluationCatByType,
} from './catImageDataset';

export type { DrawChallenge, EvaluationCat, EvaluationCatType } from './catImageDataset';
export type { MemoryBookCat, MemoryBookCatSource } from './memoryBookCats';
export type { StandardMemoryCat } from './standardMemoryCats';
