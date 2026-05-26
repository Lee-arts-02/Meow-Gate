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
import type { GatePrediction, ModelStatus, NearestExample, TrainingExample } from './modelTypes';

type StoredExample = TrainingExample & { vector: number[] };

export type RebuildModelOptions = {
  includeLearnerExamples?: boolean;
  onProgress?: (progress: number) => void;
};

type CalibrationThresholds = {
  openThreshold: number;
  pauseThreshold: number;
  standardSelfSimilarity: number;
};

let storedExamples: StoredExample[] = [];
let modelStatus: ModelStatus = 'idle';
let statusMessage = 'Ready to compare.';
let isModelReady = false;
let lastPrediction: GatePrediction | null = null;
let lastTrainingEvaluationLeakCount = 0;
let calibration: CalibrationThresholds = {
  openThreshold: 0.55,
  pauseThreshold: 0.45,
  standardSelfSimilarity: 0.6,
};

const KNN_K = 5;

function setStatus(status: ModelStatus, message: string) {
  modelStatus = status;
  statusMessage = message;
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

export function getIsModelReady(): boolean {
  return isModelReady;
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
    isModelReady,
    trainingExamples: storedExamples.length,
    initialMemoryCats: initial,
    learnerMemoryCats: learner,
    negativeExamples: negative,
    evaluationCatsInTraining: evaluationInTraining,
    lastTrainingEvaluationLeakCount: lastTrainingEvaluationLeakCount,
    calibration,
    lastPrediction,
  };
}

export function getTrainingMessageForProgress(progress: number): string {
  if (progress >= 100) return 'Meow Gate is ready to test.';
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
  if (gateState === 'open' && confidence >= 0.65) return 'high';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.45) return 'medium';
  return 'low';
}

function rankBySimilarity(queryVector: number[]): NearestExample[] {
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

function computePredictionMetrics(neighbors: NearestExample[]) {
  const top = neighbors.slice(0, KNN_K);
  const catScore = top
    .filter((item) => item.label === 'cat')
    .reduce((sum, item) => sum + item.similarity, 0);
  const nonCatScore = top
    .filter((item) => item.label === 'not-cat')
    .reduce((sum, item) => sum + item.similarity, 0);
  const voteDenominator = catScore + nonCatScore;
  const catVoteRatio = voteDenominator > 0 ? catScore / voteDenominator : 0;
  const nearestSimilarity = top[0]?.similarity ?? 0;
  const confidence = catVoteRatio * nearestSimilarity;

  return {
    top,
    catVoteRatio,
    nearestSimilarity,
    confidence,
    nearest: top[0],
  };
}

function resolveGateState(
  catVoteRatio: number,
  nearestSimilarity: number,
  nearest?: NearestExample,
): GatePrediction['gateState'] {
  const { openThreshold, pauseThreshold } = calibration;

  if (
    nearest?.label === 'cat' &&
    nearest.source === 'initial-memory' &&
    nearestSimilarity >= openThreshold
  ) {
    return 'open';
  }

  if (catVoteRatio >= 0.6 && nearestSimilarity >= openThreshold) {
    return 'open';
  }

  if (catVoteRatio >= 0.45 || nearestSimilarity >= pauseThreshold) {
    return 'pause';
  }

  return 'close';
}

async function calibrateThresholds(): Promise<void> {
  const initialExamples = storedExamples.filter((item) => item.source === 'initial-memory');
  if (initialExamples.length === 0) return;

  let similaritySum = 0;

  for (const example of initialExamples) {
    let bestOther = 0;
    for (const other of initialExamples) {
      if (other.id === example.id) continue;
      const similarity = vectorCosineSimilarity(example.vector, other.vector);
      if (similarity > bestOther) bestOther = similarity;
    }
    similaritySum += bestOther;
  }

  const standardSelfSimilarity = similaritySum / initialExamples.length;
  const openThreshold = Math.max(0.45, standardSelfSimilarity * 0.65);
  const pauseThreshold = openThreshold * 0.75;

  calibration = { openThreshold, pauseThreshold, standardSelfSimilarity };

  if (isDebugMode()) {
    console.log('[Meow Gate] Calibration:', calibration);
  }
}

export async function runModelSanityCheck(): Promise<void> {
  if (!isModelReady) return;

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
      const ranked = rankBySimilarity(vector);
      const metrics = computePredictionMetrics(ranked);
      const gateState = resolveGateState(
        metrics.catVoteRatio,
        metrics.nearestSimilarity,
        metrics.nearest,
      );

      results.push({
        imageId: cat.id,
        closestNeighborId: metrics.nearest?.id ?? 'none',
        similarity: metrics.nearestSimilarity,
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
    console.warn('[Meow Gate] Model calibration failed: standard cats are not recognized.');
    calibration = {
      ...calibration,
      openThreshold: Math.max(0.4, calibration.openThreshold * 0.9),
      pauseThreshold: Math.max(0.35, calibration.pauseThreshold * 0.9),
    };
    if (isDebugMode()) {
      console.log('[Meow Gate] Adjusted thresholds:', calibration);
    }
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
  isModelReady = false;

  const rawEntries = buildTrainingExamples(memoryState, includeLearnerExamples);
  lastTrainingEvaluationLeakCount = countEvaluationCatsInTraining(rawEntries);
  const entries = assertNoEvaluationCatsInTraining(rawEntries);

  if (isDebugMode()) {
    console.log('[Meow Gate] Training loaded:', {
      initialMemoryCats: initialMemoryBookCats.length,
      learnerMemoryCats: includeLearnerExamples ? memoryState.studentExamples.length : 0,
      negativeExamples: negativeExamples.length,
      evaluationCatsInTraining: countEvaluationCatsInTraining(entries),
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

  await calibrateThresholds();
  await runModelSanityCheck();

  isModelReady = true;
  setStatus('ready', getTrainingMessageForProgress(100));
}

async function getNearestExamples(image: string, k = KNN_K): Promise<NearestExample[]> {
  const query = await imageToVector(image);
  return rankBySimilarity(query).slice(0, k);
}

/** Nearest Memory Book cats only — excludes negatives and evaluation cats */
export function getMemoryBookNearestExamples(
  prediction: GatePrediction,
  limit = 3,
): NearestExample[] {
  return prediction.nearestExamples
    .filter(
      (item) =>
        item.label === 'cat' &&
        (item.source === 'initial-memory' || item.source === 'learner-memory'),
    )
    .slice(0, limit);
}

export async function predictGate(image: string): Promise<GatePrediction> {
  if (!isModelReady) throw new Error('Model is not ready');

  const nearestExamples = await getNearestExamples(image, KNN_K);
  const metrics = computePredictionMetrics(nearestExamples);
  const { catVoteRatio, nearestSimilarity } = metrics;
  let { confidence } = metrics;
  const gateState = resolveGateState(catVoteRatio, nearestSimilarity, metrics.nearest);

  if (gateState === 'open' && metrics.nearest?.source === 'initial-memory') {
    confidence = Math.max(confidence, 0.78);
  }

  const prediction: GatePrediction = {
    gateState,
    confidence,
    confidenceLabel: confidenceLabelFromScore(confidence, gateState),
    nearestExamples: metrics.top,
    catVoteRatio,
    nearestSimilarity,
  };

  lastPrediction = prediction;

  if (isDebugMode()) {
    console.log('[Meow Gate] Prediction:', {
      nearestExamples: metrics.top.map((item) => ({
        id: item.id,
        source: item.source,
        label: item.label,
        similarity: item.similarity.toFixed(3),
      })),
      memoryBookNearest: getMemoryBookNearestExamples(prediction).map((item) => item.id),
      catVoteRatio: catVoteRatio.toFixed(3),
      nearestSimilarity: nearestSimilarity.toFixed(3),
      confidence: confidence.toFixed(3),
      gateState,
      calibration,
    });
  }

  return prediction;
}

export async function predictCat(image: string): Promise<GatePrediction> {
  return predictGate(image);
}

/** Clear module singleton between sessions (e.g. full page reload). */
export function clearSessionModelSingleton(): void {
  storedExamples = [];
  isModelReady = false;
  lastPrediction = null;
  lastTrainingEvaluationLeakCount = 0;
  calibration = {
    openThreshold: 0.55,
    pauseThreshold: 0.45,
    standardSelfSimilarity: 0.6,
  };
  setStatus('idle', 'Ready to compare.');
}
