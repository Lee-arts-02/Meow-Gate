import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { predictUserDrawingGate, predictGateFromCurrentModel } from '../logic/predictGate';
import {
  getDebugInfo,
  getIsModelReady,
  getStatusMessage,
  getTrainingMessageForProgress,
  initializeCatModel,
  isDebugMode,
  rebuildModelFromMemoryBook,
} from '../ml/catKnnModel';
import type { CatMemoryState, DrawingAnalysisInput, GateResult } from '../types';

export type TrainingStatus = 'not-started' | 'training' | 'complete' | 'error';

type CatModelContextValue = {
  trainingStatus: TrainingStatus;
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
  predictEvaluation: (image: string) => Promise<GateResult>;
  canTest: boolean;
  debugMode: boolean;
  debugInfo: ReturnType<typeof getDebugInfo>;
};

const CatModelContext = createContext<CatModelContextValue | null>(null);

export function CatModelProvider({
  memoryState,
  children,
}: {
  memoryState: CatMemoryState;
  children: ReactNode;
}) {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('not-started');
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
    (async () => {
      await initializeCatModel();
      if (cancelled) return;
      await rebuildModelFromMemoryBook(memoryState, { includeLearnerExamples: false });
      if (cancelled) return;
      syncStatus();
      setTrainingStatus(memoryState.studentExamples.length > 0 ? 'not-started' : 'complete');
      setModelReady(getIsModelReady());
    })();
    return () => { cancelled = true; };
  }, [memoryState, syncStatus]);

  const rebuildModel = useCallback(async (state: CatMemoryState, includeLearnerExamples = false) => {
    await rebuildModelFromMemoryBook(state, { includeLearnerExamples });
    syncStatus();
  }, [syncStatus]);

  const markNeedsTraining = useCallback(() => {
    setTrainingStatus('not-started');
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
      setModelReady(true);
      syncStatus();
    } catch (error) {
      setTrainingStatus('error');
      setModelReady(false);
      syncStatus();
      throw error;
    }
  }, [syncStatus]);

  const predictUserDrawing = useCallback(
    async (image: string, state: CatMemoryState, drawingMeta: DrawingAnalysisInput) =>
      predictUserDrawingGate(image, state, drawingMeta, {
        includeLearnerExamples: trainingStatus === 'complete',
      }),
    [trainingStatus],
  );

  const predictEvaluation = useCallback(async (image: string) => {
    if (!modelReady || trainingStatus !== 'complete') {
      throw new Error('Meow Gate needs to finish learning first.');
    }
    return predictGateFromCurrentModel(image);
  }, [modelReady, trainingStatus]);

  const value = useMemo(
    () => ({
      trainingStatus,
      modelReady,
      trainingProgress,
      statusMessage,
      trainModel,
      rebuildModel,
      markNeedsTraining,
      predictUserDrawing,
      predictEvaluation,
      canTest: modelReady && trainingStatus === 'complete',
      debugMode: isDebugMode(),
      debugInfo,
    }),
    [
      trainingStatus,
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
