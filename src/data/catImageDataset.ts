export const GATE_IMAGE = '/gate.png';

export type DrawIdea = {
  id: string;
  label: string;
};

export const drawIdeas: DrawIdea[] = [
  { id: 'different-ears', label: 'different ears' },
  { id: 'different-body', label: 'different body shape' },
  { id: 'dark-fur', label: 'dark fur' },
  { id: 'long-whiskers', label: 'long whiskers' },
  { id: 'side-view', label: 'side view' },
  { id: 'no-tail', label: 'no tail' },
  { id: 'accessory', label: 'an accessory' },
  { id: 'your-idea', label: 'your own idea' },
];

/** @deprecated use drawIdeas */
export type DrawChallenge = DrawIdea & { prompt: string };

/** @deprecated use drawIdeas */
export const drawChallenges: DrawChallenge[] = drawIdeas.map((idea) => ({
  ...idea,
  prompt: `Try drawing a cat with ${idea.label}.`,
}));

export function getDrawChallenge(id: string): DrawChallenge | undefined {
  return drawChallenges.find((c) => c.id === id);
}

export {
  initialMemoryBookCats,
  initialMemoryBookCats as initialStandardCats,
  getStandardMemoryBookCatImage,
  getStandardMemoryBookCatImage as getStandardCatImage,
  type MemoryBookCat,
} from './memoryBookCats';

export { standardMemoryCats, type StandardMemoryCat } from './standardMemoryCats';

export {
  evaluationCats,
  getRandomEvaluationCat,
  getEvaluationCatByType,
  type EvaluationCat,
  type EvaluationCatType,
} from './evaluationCats';
