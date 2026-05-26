import {
  initialMemoryBookCats,
  getStandardMemoryBookCatImage,
  type MemoryBookCat,
} from './memoryBookCats';

/** UI wrapper for Memory Book cards with observation prompts */
export type StandardMemoryCat = MemoryBookCat & {
  observationPrompt: string;
};

const OBSERVATION_PROMPTS = [
  'This cat has a clear face and visible ears.',
  'Notice the body shape and tail.',
  'What clues does Meow Gate look for here?',
  'How is this similar to the other examples?',
  'Look at the ears and face together.',
  'Another example Meow Gate may compare with.',
  'What pattern repeats across these cats?',
  'Similar shapes help Meow Gate guess.',
  'One more cat in the Memory Book.',
];

export const standardMemoryCats: StandardMemoryCat[] = initialMemoryBookCats.map(
  (cat, index) => ({
    ...cat,
    observationPrompt:
      index === 0
        ? 'What looks similar across these examples?'
        : (OBSERVATION_PROMPTS[index] ?? 'What looks similar across these examples?'),
  }),
);

export { getStandardMemoryBookCatImage as getStandardCatImage };
