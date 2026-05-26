export const EVALUATION_CAT_IDS = [
  'midnightcat',
  'oneearcat',
  'piratecat',
  'roundcat',
] as const;

export const EVALUATION_CAT_IMAGES = [
  '/cat/midnightcat.png',
  '/cat/oneearcat.png',
  '/cat/piratecat.png',
  '/cat/roundcat.png',
] as const;

type IdentifiableExample = {
  id: string;
  image: string;
};

export function isEvaluationTrainingExample(example: IdentifiableExample): boolean {
  const idLower = example.id.toLowerCase();
  const imageLower = example.image.toLowerCase();

  return EVALUATION_CAT_IDS.some(
    (evalId) => idLower.includes(evalId) || imageLower.includes(evalId),
  );
}

export function countEvaluationCatsInTraining(examples: IdentifiableExample[]): number {
  return examples.filter(isEvaluationTrainingExample).length;
}

export function filterEvaluationCatsFromTraining<T extends IdentifiableExample>(
  trainingExamples: T[],
): T[] {
  return trainingExamples.filter((example) => !isEvaluationTrainingExample(example));
}

export function assertNoEvaluationCatsInTraining<T extends IdentifiableExample>(
  trainingExamples: T[],
): T[] {
  const invalid = trainingExamples.filter(isEvaluationTrainingExample);

  if (invalid.length === 0) {
    return trainingExamples;
  }

  console.error('[Meow Gate] Evaluation cats must not be used for training:', invalid);

  if (import.meta.env.DEV) {
    throw new Error('Evaluation cats leaked into training data.');
  }

  console.warn('[Meow Gate] Removing evaluation cats from training data.');
  return filterEvaluationCatsFromTraining(trainingExamples);
}

export function assertMemoryBookOnlyExamples(examples: IdentifiableExample[]): void {
  const invalid = examples.filter(isEvaluationTrainingExample);
  if (invalid.length > 0 && import.meta.env.DEV) {
    throw new Error('Evaluation cats must not appear in Memory Book comparison examples.');
  }
}
