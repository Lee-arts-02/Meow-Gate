export type EvaluationCatType = 'midnight' | 'oneEar' | 'pirate' | 'round';

export type EvaluationCat = {
  id: string;
  image: string;
  role: 'evaluation-only';
  /** Display-only — never used for training */
  name: string;
  type: EvaluationCatType;
  challenge: string;
};

/** Evaluation-only cats — never in Memory Book or training data. */
export const evaluationCats: EvaluationCat[] = [
  {
    id: 'midnightcat',
    image: '/cat/midnightcat.png',
    role: 'evaluation-only',
    name: 'Midnight Cat',
    type: 'midnight',
    challenge: 'This cat is dark, so some details may be harder to notice.',
  },
  {
    id: 'oneearcat',
    image: '/cat/oneearcat.png',
    role: 'evaluation-only',
    name: 'One-Ear Cat',
    type: 'oneEar',
    challenge: 'This cat has one visible ear, so it does not match the usual two-ear pattern.',
  },
  {
    id: 'piratecat',
    image: '/cat/piratecat.png',
    role: 'evaluation-only',
    name: 'Pirate Cat',
    type: 'pirate',
    challenge: 'This cat has an accessory, so Meow Gate may focus on an unexpected clue.',
  },
  {
    id: 'roundcat',
    image: '/cat/roundcat.png',
    role: 'evaluation-only',
    name: 'Round Cat',
    type: 'round',
    challenge: 'This cat has a different body shape from the standard examples.',
  },
];

export function getRandomEvaluationCat(): EvaluationCat {
  return evaluationCats[Math.floor(Math.random() * evaluationCats.length)]!;
}

export function getEvaluationCatByType(
  type: EvaluationCatType,
): EvaluationCat | undefined {
  return evaluationCats.find((cat) => cat.type === type);
}

export function isEvaluationCatId(id: string): boolean {
  return evaluationCats.some((cat) => cat.id === id);
}

export function isEvaluationCatImage(image: string): boolean {
  return evaluationCats.some((cat) => cat.image === image);
}
