import type { DrawingAnalysisInput, GateResult, GateState, NearestExampleInfo } from '../types';
import { analyzeDrawing } from './analyzeDrawing';
import type { EvaluationCat } from '../data/evaluationCats';
import type { CatMemoryState } from '../types';
import {
  getIsModelReady,
  predictGate,
  rebuildModelFromMemoryBook,
  type PredictGateMeta,
} from '../ml/catKnnModel';
import type { GatePrediction, NeighborResult } from '../ml/modelTypes';

function gateStateToGuess(gateState: GateState): GateResult['guess'] {
  if (gateState === 'open') return 'cat';
  if (gateState === 'close') return 'not-cat';
  return 'unsure';
}

export function gateResultToGateState(result: GateResult): GateState {
  return result.gateState ?? (result.gateOpen ? 'open' : 'pause');
}

function neighborResultToNearestInfo(n: NeighborResult): NearestExampleInfo {
  const source: NearestExampleInfo['source'] =
    n.source === 'initial'
      ? 'initial-memory'
      : n.source === 'learner'
        ? 'learner-memory'
        : 'negative';
  return {
    id: n.id,
    image: n.image,
    label: n.label,
    distance: 1 - n.similarity,
    similarity: n.similarity,
    source,
  };
}

export function predictionToGateResult(prediction: GatePrediction): GateResult {
  const gateState = prediction.gateState;
  const topNeighbor = prediction.nearestExamples[0];
  const knnNearestIsNotCat = topNeighbor?.label === 'not-cat';
  const nearestMemoryInTopK = prediction.nearestExamples.find(
    (item) => item.label === 'cat' && (item.source === 'initial' || item.source === 'learner'),
  );
  const closest = prediction.closestMemoryExample;
  const nearestSimilarity =
    closest?.similarity ?? nearestMemoryInTopK?.similarity ?? prediction.bestSimilarity;

  let friendlyReason =
    gateState === 'open'
      ? 'Meow Gate found a close match in its Memory Book.'
      : gateState === 'pause'
        ? 'Meow Gate sees some similar clues, but it is not fully sure yet.'
        : 'This cat does not look very similar to the cats Meow Gate has seen most often.';

  if (knnNearestIsNotCat && !closest) {
    friendlyReason =
      'Meow Gate did not find a close cat example in the Memory Book for this picture.';
  } else if (knnNearestIsNotCat && closest) {
    friendlyReason =
      'The closest cat example in the Memory Book was still not very similar to this picture.';
  } else if (
    gateState === 'open' &&
    closest &&
    nearestSimilarity >= 0.5
  ) {
    friendlyReason = 'Meow Gate found a close match in its Memory Book.';
  }

  return {
    guess: gateStateToGuess(gateState),
    confidence: prediction.confidence,
    confidenceLabel: prediction.confidenceLabel,
    gateState,
    gateOpen: gateState === 'open',
    visualClues: ['similar shapes', 'ears, face, or body shape'],
    uncertainParts: gateState === 'pause' ? ['some small details'] : [],
    friendlyReason,
    knnNearestIsNotCat,
    bestSimilarity: prediction.bestSimilarity,
    closestMemoryImage: closest?.image,
    closestMemorySimilarity: closest?.similarity,
    nearestExamples: prediction.nearestExamples
      .filter(
        (item) =>
          item.label === 'cat' && (item.source === 'initial' || item.source === 'learner'),
      )
      .map(neighborResultToNearestInfo),
  };
}

export async function predictGateFromCurrentModel(
  image: string,
  meta?: PredictGateMeta,
): Promise<GateResult> {
  if (!getIsModelReady()) throw new Error('Meow Gate needs to finish learning first.');
  return predictionToGateResult(await predictGate(image, meta));
}

export async function predictGateFromImage(
  image: string,
  memoryState: CatMemoryState,
  options: { includeLearnerExamples?: boolean } = {},
  meta?: PredictGateMeta,
): Promise<GateResult> {
  await rebuildModelFromMemoryBook(memoryState, options);
  return predictionToGateResult(await predictGate(image, meta));
}

export async function predictUserDrawingGate(
  image: string,
  memoryState: CatMemoryState,
  drawingMeta: DrawingAnalysisInput,
  options: { includeLearnerExamples?: boolean } = {},
): Promise<GateResult> {
  if (drawingMeta.strokeCount < 3) {
    return {
      guess: 'unsure',
      confidence: 0,
      confidenceLabel: 'low',
      gateState: 'pause',
      gateOpen: false,
      visualClues: [],
      uncertainParts: ['not enough lines to look for clues'],
      friendlyReason: 'I could not find many visual clues yet. Maybe add a few more lines?',
      bestSimilarity: 0,
    };
  }
  try {
    await rebuildModelFromMemoryBook(memoryState, {
      includeLearnerExamples: options.includeLearnerExamples ?? false,
    });
    return predictionToGateResult(await predictGate(image));
  } catch {
    console.warn('Using fallback prediction because KNN model is unavailable.');
    return analyzeDrawing(drawingMeta);
  }
}

/** Evaluation cats are prediction targets only — KNN only, no scripted outcomes. */
export async function predictEvaluationGate(
  evaluationCat: EvaluationCat,
  _memoryState: CatMemoryState,
  _includeLearnerExamples: boolean,
): Promise<GateResult> {
  if (!getIsModelReady()) throw new Error('Meow Gate needs to finish learning first.');
  return predictionToGateResult(
    await predictGate(evaluationCat.image, { logTargetId: evaluationCat.id }),
  );
}

export function formatNearestExampleLabel(
  example: Pick<NearestExampleInfo, 'source'> | Pick<NeighborResult, 'source'>,
): string {
  const src = example.source;
  if (src === 'learner-memory' || src === 'learner') return 'Your example';
  if (src === 'initial-memory' || src === 'initial') return 'Memory Book example';
  return 'Memory Book example';
}
