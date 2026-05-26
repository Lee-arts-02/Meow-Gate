import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { predictUserDrawingGate, predictionToGateResult } from '../logic/predictGate';
import {
  clearSessionModelSingleton,
  getDebugInfo,
  getIsModelReady,
  getStatusMessage,
  getTrainingMessageForProgress,
  initializeCatModel,
  isDebugMode,
  predictGate,
  rebuildModelFromMemoryBook,
} from '../ml/catKnnModel';
import type { GatePrediction } from '../ml/modelTypes';
import type { CatMemoryState, DrawingAnalysisInput, GateResult } from '../types';

export type TrainingStatus = 'not-started' | 'training' | 'complete' | 'error';

/** Builder flow: Memory Book changed after last successful train, or no train yet. */
export type MeowGateDatasetStatus = 'needs-training' | 'trained';

export type EvaluationPredictPayload = {
  result: GateResult;
  prediction: GatePrediction;
};

type CatModelContextValue = {
  trainingStatus: TrainingStatus;
  /** Meow Gate KNN is in sync with the current Memory Book and may be used for evaluation. */
  modelStatus: MeowGateDatasetStatus;
  modelReady: boolean;
  trainingProgress: number;
  statusMessage: string;
  trainModel: (memoryState: CatMemoryState) => Promise<void>;
  rebuildModel: (memoryState: CatMemoryState, includeLearnerExamples?: boolean) => Promise<void>;
  markNeedsTraining: () => void;
  predictUserDrawing: (
    image: string,
    memoryState: CatMemoryState,
    drawingMeta: DrawingAnalysisInput,
  ) => Promise<GateResult>;
  predictEvaluation: (image: string, evaluationCatId?: string) => Promise<EvaluationPredictPayload>;
  canTest: boolean;
  debugMode: boolean;
  debugInfo: ReturnType<typeof getDebugInfo>;
};
const CatModelContext = createContext<CatModelContextValue | null>(null);

export function CatModelProvider({ children }: { children: ReactNode }) {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('not-started');
  const [modelStatus, setModelStatus] = useState<MeowGateDatasetStatus>('needs-training');
  const [modelReady, setModelReady] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(getStatusMessage());
  const [debugInfo, setDebugInfo] = useState(getDebugInfo());

  const syncStatus = useCallback(() => {
    setModelReady(getIsModelReady());
    setStatusMessage(getStatusMessage());
    setDebugInfo(getDebugInfo());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await initializeCatModel();
      clearSessionModelSingleton();
      if (cancelled) return;
      setTrainingStatus('not-started');
      setModelStatus('needs-training');
      setModelReady(false);
      setTrainingProgress(0);
      setStatusMessage(getStatusMessage());
      setDebugInfo(getDebugInfo());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rebuildModel = useCallback(async (state: CatMemoryState, includeLearnerExamples = false) => {
    await rebuildModelFromMemoryBook(state, { includeLearnerExamples });
    syncStatus();
  }, [syncStatus]);

  const markNeedsTraining = useCallback(() => {
    setModelStatus('needs-training');
    setModelReady(false);
    setTrainingProgress(0);
  }, []);

  const trainModel = useCallback(async (state: CatMemoryState) => {
    setTrainingStatus('training');
    setModelReady(false);
    try {
      await rebuildModelFromMemoryBook(state, {
        includeLearnerExamples: true,
        onProgress: (progress) => {
          setTrainingProgress(progress);
          setStatusMessage(getTrainingMessageForProgress(progress));
        },
      });
      setTrainingProgress(100);
      setTrainingStatus('complete');
      setModelStatus('trained');
      setModelReady(true);
      syncStatus();
    } catch (error) {
      setTrainingStatus('error');
      setModelReady(false);
      setModelStatus('needs-training');
      syncStatus();
      throw error;
    }
  }, [syncStatus]);

  const predictUserDrawing = useCallback(
    async (image: string, state: CatMemoryState, drawingMeta: DrawingAnalysisInput) =>
      predictUserDrawingGate(image, state, drawingMeta, {
        includeLearnerExamples: modelStatus === 'trained' && state.studentExamples.length > 0,
      }),
    [modelStatus],
  );

  const predictEvaluation = useCallback(
    async (image: string, evaluationCatId?: string) => {
      if (!modelReady || trainingStatus !== 'complete' || modelStatus !== 'trained') {
        throw new Error('Train Meow Gate before testing.');
      }
      const prediction = await predictGate(
        image,
        evaluationCatId ? { logTargetId: evaluationCatId } : undefined,
      );
      return { prediction, result: predictionToGateResult(prediction) };
    },
    [modelReady, trainingStatus, modelStatus],
  );
  const value = useMemo(
    () => ({
      trainingStatus,
      modelStatus,
      modelReady,
      trainingProgress,
      statusMessage,
      trainModel,
      rebuildModel,
      markNeedsTraining,
      predictUserDrawing,
      predictEvaluation,
      canTest: modelReady && trainingStatus === 'complete' && modelStatus === 'trained',
      debugMode: isDebugMode(),
      debugInfo,
    }),
    [
      trainingStatus,
      modelStatus,
      modelReady,
      trainingProgress,
      statusMessage,
      trainModel,
      rebuildModel,
      markNeedsTraining,
      predictUserDrawing,
      predictEvaluation,
      debugInfo,
    ],
  );

  return <CatModelContext.Provider value={value}>{children}</CatModelContext.Provider>;
}

export function useCatModel() {
  const context = useContext(CatModelContext);
  if (!context) throw new Error('useCatModel must be used within CatModelProvider');
  return context;
}
