import {
  getAllMemoryBookCats,
  initialMemoryBookCats,
} from '../data/memoryBookCats';
import type { CatMemoryState } from '../types';
import {
  assertMemoryBookOnlyExamples,
  filterEvaluationCatsFromTraining,
  isEvaluationTrainingExample,
} from './trainingDataGuard';
import { compareImageSimilarity } from '../ml/imagePreprocess';
import type { NeighborResult } from '../ml/modelTypes';

export type MemoryExample = {
  id: string;
  image: string;
  source: 'initial-memory' | 'learner-memory';
};

export type ClosestMemoryResult = {
  example: MemoryExample;
  score: number;
  label: 'very similar' | 'similar' | 'a little similar' | 'not very similar';
};

export function similarityLabelFromScore(
  score: number,
): ClosestMemoryResult['label'] {
  if (score >= 0.72) return 'very similar';
  if (score >= 0.52) return 'similar';
  if (score >= 0.32) return 'a little similar';
  return 'not very similar';
}

export function buildMemoryExamples(memoryState: CatMemoryState): MemoryExample[] {
  const examples: MemoryExample[] = getAllMemoryBookCats(memoryState).map((cat) => ({
    id: cat.id,
    image: cat.image,
    source: cat.source,
  }));

  const safeExamples = filterEvaluationCatsFromTraining(examples);
  assertMemoryBookOnlyExamples(safeExamples);
  return safeExamples;
}

export async function findClosestMemoryCat(
  targetImage: string,
  memoryExamples: MemoryExample[],
): Promise<ClosestMemoryResult> {
  const safeExamples = filterEvaluationCatsFromTraining(memoryExamples);

  if (safeExamples.length === 0) {
    throw new Error('No memory examples available');
  }

  const scored = await Promise.all(
    safeExamples.map(async (example) => {
      const score = await compareImageSimilarity(targetImage, example.image);
      return { example, score };
    }),
  );

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;

  return {
    example: best.example,
    score: best.score,
    label: similarityLabelFromScore(best.score),
  };
}

export async function rankMemoryExamples(
  targetImage: string,
  memoryExamples: MemoryExample[],
  limit = 3,
): Promise<ClosestMemoryResult[]> {
  const safeExamples = filterEvaluationCatsFromTraining(memoryExamples).filter(
    (example) => !isEvaluationTrainingExample(example),
  );

  const scored = await Promise.all(
    safeExamples.map(async (example) => {
      const score = await compareImageSimilarity(targetImage, example.image);
      return {
        example,
        score,
        label: similarityLabelFromScore(score),
      };
    }),
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Map a KNN Memory Book neighbor into the shape used by Why / overlay UI. */
export function neighborResultToClosestMemoryResult(n: NeighborResult): ClosestMemoryResult {
  return {
    example: {
      id: n.id,
      image: n.image,
      source: n.source === 'learner' ? 'learner-memory' : 'initial-memory',
    },
    score: n.similarity,
    label: similarityLabelFromScore(n.similarity),
  };
}

export { initialMemoryBookCats };
