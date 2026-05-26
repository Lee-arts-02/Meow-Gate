import type { CatMemoryState } from '../types';

export type MemoryBookCatSource = 'initial-memory' | 'learner-memory';

export type MemoryBookCat = {
  id: string;
  image: string;
  label: 'cat';
  source: MemoryBookCatSource;
};

export const initialMemoryBookCats: MemoryBookCat[] = [
  { id: 'standardcat', image: '/cat/standardcat.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat1', image: '/cat/cat1.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat2', image: '/cat/cat2.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat3', image: '/cat/cat3.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat4', image: '/cat/cat4.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat5', image: '/cat/cat5.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat6', image: '/cat/cat6.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat7', image: '/cat/cat7.png', label: 'cat', source: 'initial-memory' },
  { id: 'cat8', image: '/cat/cat8.png', label: 'cat', source: 'initial-memory' },
];

export function getStandardMemoryBookCatImage(): string {
  return initialMemoryBookCats[0]!.image;
}

export function buildLearnerMemoryBookCats(memoryState: CatMemoryState): MemoryBookCat[] {
  return memoryState.studentExamples.map((example) => ({
    id: example.id,
    image: example.imageData,
    label: 'cat',
    source: 'learner-memory',
  }));
}

export function getAllMemoryBookCats(memoryState: CatMemoryState): MemoryBookCat[] {
  return [...initialMemoryBookCats, ...buildLearnerMemoryBookCats(memoryState)];
}

/** @deprecated use getStandardMemoryBookCatImage */
export const getStandardCatImage = getStandardMemoryBookCatImage;

/** @deprecated use initialMemoryBookCats */
export const initialStandardCats = initialMemoryBookCats;

export type StandardCatExample = MemoryBookCat & { name: string };

/** @deprecated use MemoryBookCat */
export function toLegacyStandardCat(cat: MemoryBookCat): StandardCatExample {
  return { ...cat, name: cat.id };
}
