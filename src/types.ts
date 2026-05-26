export type CatImageType = 'standard' | 'midnight' | 'oneEar' | 'pirate' | 'round';

export type GateGuess = 'cat' | 'not-cat' | 'unsure';

export type ConfidenceLabel = 'low' | 'medium' | 'high';

export type GateState = 'open' | 'close' | 'pause';

export type NearestExampleInfo = {
  id: string;
  image: string;
  label?: string;
  distance: number;
  similarity: number;
  source: 'initial-memory' | 'learner-memory' | 'negative';
};

export type GateResult = {
  guess: GateGuess;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  gateState: GateState;
  gateOpen: boolean;
  visualClues: string[];
  uncertainParts: string[];
  friendlyReason: string;
  nearestExamples?: NearestExampleInfo[];
};

export type StudentExample = {
  id: string;
  label: string;
  imageData: string;
  createdAt: number;
};

/** Serializable snapshot for sharing a trained Cat Gate (no evaluation-cat data). */
export type SharedCatCity = {
  cityId: string;
  createdAt: number;
  cityName?: string;
  learnerExamples: {
    id: string;
    image: string;
    featureTags?: string[];
    createdAt: number;
  }[];
  version: number;
};

export type CatMemoryState = {
  studentExamples: StudentExample[];
  coverage: Record<CatImageType, number>;
};

export type Scene =
  | 'opening'
  | 'draw'
  | 'gate'
  | 'surprise'
  | 'memoryBook'
  | 'teach'
  | 'test';

export type DrawingAnalysisInput = {
  imageDataUrl: string;
  strokeCount: number;
  boundingBox: { width: number; height: number } | null;
};

/** Legacy — used only by Quick, Draw! import script, not main UI */
export type QuickDrawCatExample = {
  id: string;
  source: 'quickdraw';
  label: 'cat';
  drawing: number[][][];
  features: string[];
  representation: 'common';
  note: string;
};
