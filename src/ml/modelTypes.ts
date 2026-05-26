export type TrainingLabel = 'cat' | 'not-cat';

export type TrainingSource = 'initial-memory' | 'learner-memory' | 'negative';

/** Public KNN neighbor shape for UI and evidence (no training-internal source names). */
export type NeighborSource = 'initial' | 'learner' | 'negative';

export type NeighborResult = {
  id: string;
  image: string;
  label: TrainingLabel;
  source: NeighborSource;
  similarity: number;
};

export type GatePrediction = {
  gateState: 'open' | 'close' | 'pause';
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  nearestExamples: NeighborResult[];
  /** Closest positive Memory Book match (initial + learner only), even if top-K neighbor is not-cat. */
  closestMemoryExample?: NeighborResult;
  catVoteRatio: number;
  /** Cosine similarity of the single nearest training neighbor (top of ranked list). */
  bestSimilarity: number;
};

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type TrainingExample = {
  id: string;
  image: string;
  label: TrainingLabel;
  source: TrainingSource;
};
