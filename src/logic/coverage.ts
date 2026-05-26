import type { CatImageType, CatMemoryState, GateResult, StudentExample } from '../types';
import type { EvaluationCat } from '../data/evaluationCats';

export type { CatMemoryState, StudentExample };

export const ALL_CAT_IMAGE_TYPES: CatImageType[] = [
  'standard',
  'midnight',
  'oneEar',
  'pirate',
  'round',
];

export function getInitialCoverage(): Record<CatImageType, number> {
  return {
    standard: 0.9,
    midnight: 0.28,
    oneEar: 0.25,
    pirate: 0.3,
    round: 0.27,
  };
}

export function getInitialMemoryState(): CatMemoryState {
  return {
    studentExamples: [],
    coverage: getInitialCoverage(),
  };
}

export function updateCoverageWithStudentExample(
  coverage: Record<CatImageType, number>,
  evaluationType: Exclude<CatImageType, 'standard'>,
  exampleCount: number,
): Record<CatImageType, number> {
  const boost = exampleCount >= 2 ? 0.35 : 0.25;
  const diversityBoost = Math.min(exampleCount * 0.08, 0.2);

  const updated = { ...coverage };
  updated[evaluationType] = Math.min((updated[evaluationType] ?? 0.2) + boost, 0.95);

  (['midnight', 'oneEar', 'pirate', 'round'] as const).forEach((t) => {
    updated[t] = Math.min((updated[t] ?? 0.2) + diversityBoost * 0.5, 0.9);
  });

  return updated;
}

function confidenceFromCoverage(coverage: number): GateResult['confidenceLabel'] {
  if (coverage >= 0.7) return 'high';
  if (coverage >= 0.45) return 'medium';
  return 'low';
}

function scoreFromCoverage(coverage: number): {
  confidence: number;
  confidenceLabel: GateResult['confidenceLabel'];
} {
  const confidenceLabel = confidenceFromCoverage(coverage);
  const confidence =
    confidenceLabel === 'high'
      ? 0.75 + coverage * 0.2
      : confidenceLabel === 'medium'
        ? 0.45 + coverage * 0.3
        : 0.15 + coverage * 0.4;
  return { confidence, confidenceLabel };
}

const friendlyReasons: Record<
  CatImageType,
  { unsure: string; open: string; afterTeaching: string }
> = {
  standard: {
    unsure: 'This cat looks close to the usual examples in my Memory Book.',
    open: 'This cat has clues I recognize from my usual examples.',
    afterTeaching: 'I have more examples to compare now.',
  },
  midnight: {
    unsure: 'Meow Gate noticed the face, but the dark body was harder to see clearly.',
    open: 'I noticed the cat shape, even though some dark lines were faint.',
    afterTeaching: 'Meow Gate may recognize more kinds of cats now.',
  },
  oneEar: {
    unsure: 'Meow Gate expected two ears, but this cat only shows one.',
    open: 'I noticed the face, even though the ear pattern felt different.',
    afterTeaching: 'Meow Gate may recognize more kinds of cats now.',
  },
  pirate: {
    unsure: 'Meow Gate saw something extra and became unsure.',
    open: 'I noticed the cat face, though the extra detail felt unusual.',
    afterTeaching: 'Meow Gate may recognize more kinds of cats now.',
  },
  round: {
    unsure: 'Meow Gate noticed the face, but the body shape was different from its usual examples.',
    open: 'I noticed the round shape and cat-like face together.',
    afterTeaching: 'Meow Gate may recognize more kinds of cats now.',
  },
};

export function testCatImageType(
  type: CatImageType,
  coverage: Record<CatImageType, number>,
  studentCount = 0,
): GateResult {
  let score = coverage[type] ?? 0.2;
  if (studentCount > 0 && type !== 'standard') {
    score = Math.min(score + 0.12 * Math.min(studentCount, 3), 0.95);
  }

  const { confidence, confidenceLabel } = scoreFromCoverage(score);
  const reasons = friendlyReasons[type];
  const visualClues = getCluesForType(type);

  if (type === 'standard' || score > 0.6) {
    const gateOpen = type === 'standard' ? true : score > 0.55;
    return {
      guess: 'cat',
      confidence,
      confidenceLabel,
      gateState: gateOpen ? 'open' : 'pause',
      gateOpen,
      visualClues,
      uncertainParts: score < 0.75 && type !== 'standard' ? ['some details still feel new'] : [],
      friendlyReason: studentCount > 0 ? reasons.afterTeaching : reasons.open,
    };
  }

  if (score >= 0.4) {
    return {
      guess: 'unsure',
      confidence,
      confidenceLabel,
      gateState: 'pause',
      gateOpen: false,
      visualClues: visualClues.slice(0, 2),
      uncertainParts: ['body shape', 'overall pattern'],
      friendlyReason: reasons.unsure,
    };
  }

  return {
    guess: 'unsure',
    confidence,
    confidenceLabel: 'low',
    gateState: 'close',
    gateOpen: false,
    visualClues: visualClues.slice(0, 1),
    uncertainParts: ['face', 'body shape'],
    friendlyReason: reasons.unsure,
  };
}

function getCluesForType(type: CatImageType): string[] {
  const map: Record<CatImageType, string[]> = {
    standard: ['two ears', 'clear face', 'simple cat shape'],
    midnight: ['dark body', 'cat shape'],
    oneEar: ['one visible ear', 'cat face'],
    pirate: ['cat face', 'unusual accessory'],
    round: ['round body', 'cat-like face'],
  };
  return map[type];
}

export function testEvaluationCat(
  cat: EvaluationCat,
  coverage: Record<CatImageType, number>,
  studentCount = 0,
): GateResult {
  return testCatImageType(cat.type, coverage, studentCount);
}

/** Before teaching — only standard examples in memory, evaluation cats score low. */
export function testEvaluationCatBeforeTeaching(cat: EvaluationCat): GateResult {
  return testCatImageType(cat.type, getInitialCoverage(), 0);
}
