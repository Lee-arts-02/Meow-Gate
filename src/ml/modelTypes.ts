export type TrainingLabel = 'cat' | 'not-cat';

export type TrainingSource = 'initial-memory' | 'learner-memory' | 'negative';

export type NearestExample = {
  id: string;
  image: string;
  label: TrainingLabel;
  source: TrainingSource;
  similarity: number;
  distance: number;
};

export type GatePrediction = {
  gateState: 'open' | 'close' | 'pause';
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  nearestExamples: NearestExample[];
  catVoteRatio?: number;
  nearestSimilarity?: number;
};

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type TrainingExample = {
  id: string;
  image: string;
  label: TrainingLabel;
  source: TrainingSource;
};
