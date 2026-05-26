import {
  buildLearnerMemoryBookCats,
  initialMemoryBookCats,
} from '../data/memoryBookCats';
import { negativeExamples } from '../data/negativeExamples';
import {
  assertNoEvaluationCatsInTraining,
  countEvaluationCatsInTraining,
} from '../logic/trainingDataGuard';
import type { CatMemoryState } from '../types';
import { imageToVector, vectorCosineSimilarity } from './imagePreprocess';
import type {
  GatePrediction,
  ModelStatus,
  NeighborResult,
  TrainingExample,
  TrainingLabel,
  TrainingSource,
} from './modelTypes';

type StoredExample = TrainingExample & { vector: number[] };

/** Tunable KNN gate thresholds (cosine similarity in [0, 1]). */
export const KNN_GATE_THRESHOLDS = {
  OPEN_MIN_CAT_VOTE_RATIO: 0.65,
  OPEN_MIN_BEST_SIMILARITY: 0.5,
  PAUSE_MIN_CAT_VOTE_RATIO: 0.45,
  PAUSE_MIN_BEST_SIMILARITY: 0.35,
} as const;

type ScoredTrainingNeighbor = {
  id: string;
  image: string;
  label: TrainingLabel;
  source: TrainingSource;
  distance: number;
  similarity: number;
};

export type RebuildModelOptions = {
  includeLearnerExamples?: boolean;
  onProgress?: (progress: number) => void;
};

let storedExamples: StoredExample[] = [];
let modelStatus: ModelStatus = 'idle';
let statusMessage = 'Ready to compare.';
const modelState = { isModelReady: false };
let lastPrediction: GatePrediction | null = null;
let lastTrainingEvaluationLeakCount = 0;

const KNN_K = 5;

function setStatus(status: ModelStatus, message: string) {
  modelStatus = status;
  statusMessage = message;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toNeighborResult(n: ScoredTrainingNeighbor): NeighborResult {
  const source: NeighborResult['source'] =
    n.source === 'initial-memory' ? 'initial' : n.source === 'learner-memory' ? 'learner' : 'negative';
  return {
    id: n.id,
    image: n.image,
    label: n.label,
    source,
    similarity: n.similarity,
  };
}

export function resolveKnnGateState(
  catVoteRatio: number,
  bestSimilarity: number,
): GatePrediction['gateState'] {
  const t = KNN_GATE_THRESHOLDS;
  if (catVoteRatio >= t.OPEN_MIN_CAT_VOTE_RATIO && bestSimilarity >= t.OPEN_MIN_BEST_SIMILARITY) {
    return 'open';
  }
  if (catVoteRatio >= t.PAUSE_MIN_CAT_VOTE_RATIO && bestSimilarity >= t.PAUSE_MIN_BEST_SIMILARITY) {
    return 'pause';
  }
  return 'close';
}

export function isDebugMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true'
  );
}

export function getModelStatus(): ModelStatus {
  return modelStatus;
}

export function getStatusMessage(): string {
  return statusMessage;
}

export function isModelReady(): boolean {
  return modelState.isModelReady;
}

export function getLastPrediction(): GatePrediction | null {
  return lastPrediction;
}

export function getDebugInfo() {
  const initial = storedExamples.filter((item) => item.source === 'initial-memory').length;
  const learner = storedExamples.filter((item) => item.source === 'learner-memory').length;
  const negative = storedExamples.filter((item) => item.source === 'negative').length;
  const evaluationInTraining = countEvaluationCatsInTraining(storedExamples);

  return {
    modelStatus,
    statusMessage,
    isModelReady: isModelReady(),
    trainingExamples: storedExamples.length,
    initialMemoryCats: initial,
    learnerMemoryCats: learner,
    negativeExamples: negative,
    evaluationCatsInTraining: evaluationInTraining,
    lastTrainingEvaluationLeakCount: lastTrainingEvaluationLeakCount,
    knnThresholds: KNN_GATE_THRESHOLDS,
    lastPrediction,
  };
}

export function getTrainingMessageForProgress(progress: number): string {
  if (progress >= 100) return 'Now Meow Gate can compare new cats with your examples.';
  if (progress >= 66) return 'Meow Gate is comparing shapes…';
  if (progress >= 33) return 'Meow Gate is learning from your examples…';
  return 'Meow Gate is reading the Memory Book…';
}

export async function initializeCatModel(): Promise<void> {
  setStatus('idle', statusMessage);
}

function confidenceLabelFromScore(
  confidence: number,
  gateState: GatePrediction['gateState'],
): GatePrediction['confidenceLabel'] {
  if (gateState === 'open' && confidence >= 0.55) return 'high';
  if (confidence >= 0.72) return 'high';
  if (confidence >= 0.38) return 'medium';
  return 'low';
}

function rankBySimilarity(queryVector: number[]): ScoredTrainingNeighbor[] {
  return storedExamples
    .map((example) => {
      const similarity = vectorCosineSimilarity(queryVector, example.vector);
      return {
        id: example.id,
        image: example.image,
        label: example.label,
        source: example.source,
        distance: 1 - similarity,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

function findFirstMemoryBookCat(sorted: ScoredTrainingNeighbor[]): ScoredTrainingNeighbor | undefined {
  return sorted.find(
    (n) => n.label === 'cat' && (n.source === 'initial-memory' || n.source === 'learner-memory'),
  );
}

function computePredictionMetrics(neighbors: ScoredTrainingNeighbor[]) {
  const top = neighbors.slice(0, KNN_K);
  const catScore = top
    .filter((item) => item.label === 'cat')
    .reduce((sum, item) => sum + item.similarity, 0);
  const nonCatScore = top
    .filter((item) => item.label === 'not-cat')
    .reduce((sum, item) => sum + item.similarity, 0);
  const voteDenominator = catScore + nonCatScore;
  const catVoteRatio = voteDenominator > 0 ? catScore / voteDenominator : 0;
  const bestSimilarity = top[0]?.similarity ?? 0;

  const confidence = clamp01(catVoteRatio * 0.6 + bestSimilarity * 0.4);

  return {
    top,
    catVoteRatio,
    bestSimilarity,
    confidence,
    nearest: top[0],
  };
}

export async function runModelSanityCheck(): Promise<void> {
  if (!isModelReady()) return;

  const results: Array<{
    imageId: string;
    closestNeighborId: string;
    similarity: number;
    gateState: GatePrediction['gateState'];
    confidence: number;
  }> = [];

  for (const cat of initialMemoryBookCats) {
    try {
      const vector = await imageToVector(cat.image);
      const fullRanked = rankBySimilarity(vector);
      const top = fullRanked.slice(0, KNN_K);
      const metrics = computePredictionMetrics(top);
      const gateState = resolveKnnGateState(metrics.catVoteRatio, metrics.bestSimilarity);

      results.push({
        imageId: cat.id,
        closestNeighborId: metrics.nearest?.id ?? 'none',
        similarity: metrics.bestSimilarity,
        gateState,
        confidence: metrics.confidence,
      });
    } catch (error) {
      if (isDebugMode()) {
        console.warn('[Meow Gate] Sanity check failed for', cat.id, error);
      }
    }
  }

  const openCount = results.filter((item) => item.gateState === 'open').length;

  if (isDebugMode()) {
    console.table(results);
    console.log('[Meow Gate] Sanity check opens:', `${openCount}/${results.length}`);
  }

  if (openCount < Math.ceil(initialMemoryBookCats.length * 0.7)) {
    console.warn('Sanity check failed: Memory Book cats are not recognized.');
  }
}

async function vectorizeTrainingEntry(entry: TrainingExample): Promise<number[]> {
  try {
    return await imageToVector(entry.image);
  } catch (error) {
    if (isDebugMode()) {
      console.warn('[Meow Gate] Failed to vectorize training example:', entry.id, entry.image, error);
    }
    throw error;
  }
}

function buildTrainingExamples(
  memoryState: CatMemoryState,
  includeLearnerExamples: boolean,
): TrainingExample[] {
  const positiveExamples = [
    ...initialMemoryBookCats.map((cat) => ({
      id: cat.id,
      image: cat.image,
      label: 'cat' as const,
      source: cat.source,
    })),
    ...(includeLearnerExamples ? buildLearnerMemoryBookCats(memoryState) : []),
  ];

  const negativeEntries = negativeExamples.map((example) => ({
    id: example.id,
    image: example.image,
    label: 'not-cat' as const,
    source: 'negative' as const,
  }));

  return [...positiveExamples, ...negativeEntries];
}

export async function rebuildModelFromMemoryBook(
  memoryState: CatMemoryState,
  options: RebuildModelOptions = {},
): Promise<void> {
  const includeLearnerExamples = options.includeLearnerExamples ?? true;
  setStatus('loading', getTrainingMessageForProgress(0));
  storedExamples = [];
  modelState.isModelReady = false;

  const rawEntries = buildTrainingExamples(memoryState, includeLearnerExamples);
  lastTrainingEvaluationLeakCount = countEvaluationCatsInTraining(rawEntries);
  const entries = assertNoEvaluationCatsInTraining(rawEntries);

  const learnerCount = includeLearnerExamples ? memoryState.studentExamples.length : 0;
  const evalInTraining = countEvaluationCatsInTraining(entries);
  console.log('[Training] Initial memory examples:', initialMemoryBookCats.length);
  console.log('[Training] Learner examples:', learnerCount);
  console.log('[Training] Negative examples:', negativeExamples.length);
  console.log('[Training] Evaluation cats in training:', evalInTraining);

  if (isDebugMode()) {
    console.log('[Meow Gate] Training loaded (verbose):', {
      initialMemoryCats: initialMemoryBookCats.length,
      learnerMemoryCats: learnerCount,
      negativeExamples: negativeExamples.length,
      evaluationCatsInTraining: evalInTraining,
    });
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const vector = await vectorizeTrainingEntry(entry);
    storedExamples.push({ ...entry, vector });
    options.onProgress?.(Math.round(((index + 1) / entries.length) * 100));
    setStatus(
      'loading',
      getTrainingMessageForProgress(Math.round(((index + 1) / entries.length) * 100)),
    );
  }

  await runModelSanityCheck();

  modelState.isModelReady = true;
  setStatus('ready', getTrainingMessageForProgress(100));
}

export function getMemoryBookNearestExamples(prediction: GatePrediction, limit = 3): NeighborResult[] {
  return prediction.nearestExamples
    .filter((n) => n.label === 'cat' && (n.source === 'initial' || n.source === 'learner'))
    .slice(0, limit);
}

export type PredictGateMeta = {
  /** Logged in dev as `[Prediction] Target:` */
  logTargetId?: string;
};

export async function predictGate(image: string, meta?: PredictGateMeta): Promise<GatePrediction> {
  if (!isModelReady()) throw new Error('Model is not ready');

  const queryVector = await imageToVector(image);
  const fullRanked = rankBySimilarity(queryVector);
  const top = fullRanked.slice(0, KNN_K);
  const metrics = computePredictionMetrics(top);
  const gateState = resolveKnnGateState(metrics.catVoteRatio, metrics.bestSimilarity);
  const confidence = metrics.confidence;
  const closestScored = findFirstMemoryBookCat(fullRanked);

  const nearestExamples = top.map(toNeighborResult);
  const closestMemoryExample = closestScored ? toNeighborResult(closestScored) : undefined;

  const prediction: GatePrediction = {
    gateState,
    confidence,
    confidenceLabel: confidenceLabelFromScore(confidence, gateState),
    nearestExamples,
    closestMemoryExample,
    catVoteRatio: metrics.catVoteRatio,
    bestSimilarity: metrics.bestSimilarity,
  };

  lastPrediction = prediction;

  if (import.meta.env.DEV && meta?.logTargetId) {
    console.log('[Prediction] Target:', meta.logTargetId);
    console.log(
      '[Prediction] Nearest examples:',
      nearestExamples.map((e) => ({
        id: e.id,
        source: e.source,
        label: e.label,
        similarity: Number(e.similarity.toFixed(4)),
      })),
    );
    console.log('[Prediction] Gate:', gateState, 'confidence:', Number(confidence.toFixed(4)));
    if (closestMemoryExample) {
      console.log(
        '[Prediction] Closest Memory Book example:',
        closestMemoryExample.id,
        Number(closestMemoryExample.similarity.toFixed(4)),
      );
    }
  }

  if (isDebugMode()) {
    console.log('[Meow Gate] Prediction:', {
      nearestExamples: nearestExamples.map((item) => ({
        id: item.id,
        source: item.source,
        label: item.label,
        similarity: item.similarity.toFixed(3),
      })),
      memoryBookNearest: getMemoryBookNearestExamples(prediction).map((item) => item.id),
      catVoteRatio: metrics.catVoteRatio.toFixed(3),
      bestSimilarity: metrics.bestSimilarity.toFixed(3),
      confidence: confidence.toFixed(3),
      gateState,
      closestMemoryId: closestMemoryExample?.id,
    });
  }

  return prediction;
}

export async function predictCat(image: string, meta?: PredictGateMeta): Promise<GatePrediction> {
  return predictGate(image, meta);
}

/** Clear module singleton between sessions (e.g. full page reload). */
export function clearSessionModelSingleton(): void {
  storedExamples = [];
  modelState.isModelReady = false;
  lastPrediction = null;
  lastTrainingEvaluationLeakCount = 0;
  setStatus('idle', 'Ready to compare.');
}
