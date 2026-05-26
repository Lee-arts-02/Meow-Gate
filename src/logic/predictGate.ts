import type { DrawingAnalysisInput, GateResult, GateState, NearestExampleInfo } from '../types';
import { analyzeDrawing } from './analyzeDrawing';
import { testEvaluationCat, testEvaluationCatBeforeTeaching } from './coverage';
import type { EvaluationCat } from '../data/evaluationCats';
import type { CatMemoryState } from '../types';
import {
  getIsModelReady,
  predictGate,
  rebuildModelFromMemoryBook,
} from '../ml/catKnnModel';
import type { GatePrediction } from '../ml/modelTypes';

function gateStateToGuess(gateState: GateState): GateResult['guess'] {
  if (gateState === 'open') return 'cat';
  if (gateState === 'close') return 'not-cat';
  return 'unsure';
}

export function gateResultToGateState(result: GateResult): GateState {
  return result.gateState ?? (result.gateOpen ? 'open' : 'pause');
}

export function predictionToGateResult(prediction: GatePrediction): GateResult {
  const gateState = prediction.gateState;
  const nearest = prediction.nearestExamples[0];
  const nearestSimilarity = prediction.nearestSimilarity ?? nearest?.similarity ?? 0;

  let friendlyReason =
    gateState === 'open'
      ? 'Meow Gate found a close match in its Memory Book.'
      : gateState === 'pause'
        ? 'Meow Gate sees some similar clues, but it is not fully sure yet.'
        : 'This cat does not look very similar to the cats Meow Gate has seen most often.';

  if (
    gateState === 'open' &&
    nearest?.source === 'initial-memory' &&
    nearestSimilarity >= 0.55
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
    nearestExamples: prediction.nearestExamples
      .filter(
        (item) =>
          item.label === 'cat' &&
          (item.source === 'initial-memory' || item.source === 'learner-memory'),
      )
      .map((item) => ({
        id: item.id,
        image: item.image,
        distance: item.distance,
        similarity: item.similarity,
        source: item.source,
      })),
  };
}

export async function predictGateFromCurrentModel(image: string): Promise<GateResult> {
  if (!getIsModelReady()) throw new Error('Meow Gate needs to finish learning first.');
  return predictionToGateResult(await predictGate(image));
}

export async function predictGateFromImage(
  image: string,
  memoryState: CatMemoryState,
  options: { includeLearnerExamples?: boolean } = {},
): Promise<GateResult> {
  await rebuildModelFromMemoryBook(memoryState, options);
  return predictionToGateResult(await predictGate(image));
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
      confidence: 0.18,
      confidenceLabel: 'low',
      gateState: 'pause',
      gateOpen: false,
      visualClues: [],
      uncertainParts: ['not enough lines to look for clues'],
      friendlyReason: 'I could not find many visual clues yet. Maybe add a few more lines?',
    };
  }
  try {
    await rebuildModelFromMemoryBook(memoryState, {
      includeLearnerExamples: options.includeLearnerExamples ?? false,
    });
    return predictionToGateResult(await predictGate(image));
  } catch {
    return analyzeDrawing(drawingMeta);
  }
}

export async function predictEvaluationGate(
  evaluationCat: EvaluationCat,
  memoryState: CatMemoryState,
  includeLearnerExamples: boolean,
): Promise<GateResult> {
  try {
    if (!getIsModelReady()) throw new Error('Model not trained');
    return predictionToGateResult(await predictGate(evaluationCat.image));
  } catch {
    const fallback = includeLearnerExamples
      ? testEvaluationCat(evaluationCat, memoryState.coverage, memoryState.studentExamples.length)
      : testEvaluationCatBeforeTeaching(evaluationCat);
    return {
      ...fallback,
      gateState: fallback.gateOpen ? 'open' : fallback.guess === 'unsure' ? 'pause' : 'close',
    };
  }
}

export function formatNearestExampleLabel(
  example: Pick<NearestExampleInfo, 'source'>,
): string {
  return example.source === 'learner-memory' ? 'Your example' : 'Memory Book example';
}
