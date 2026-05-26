import type { ConfidenceLabel, DrawingAnalysisInput, GateResult } from '../types';

const CLUE_POOL = [
  'pointed ears',
  'whiskers',
  'round face',
  'a tail',
  'four legs',
  'curved back',
  'triangle ears',
];

const UNCERTAIN_POOL = [
  'body shape',
  'tail',
  'legs',
  'face',
  'overall size',
  'ear placement',
];

function labelFromScore(score: number): ConfidenceLabel {
  if (score >= 0.65) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function pickRandom<T>(items: T[], count: number, seed: number): T[] {
  const copy = [...items];
  const picked: T[] = [];
  let s = seed;
  while (picked.length < count && copy.length > 0) {
    s = (s * 9301 + 49297) % 233280;
    const idx = s % copy.length;
    picked.push(copy[idx]!);
    copy.splice(idx, 1);
  }
  return picked;
}

export async function analyzeDrawing(input: DrawingAnalysisInput): Promise<GateResult> {
  const { imageDataUrl, strokeCount, boundingBox } = input;

  let pixelScore = 0;
  let seed = strokeCount * 17 + 3;

  if (strokeCount < 3) {
    return {
      guess: 'unsure',
      confidence: 0.18,
      confidenceLabel: 'low',
      gateState: 'pause',
      gateOpen: false,
      visualClues: [],
      uncertainParts: ['not enough lines to look for clues'],
      friendlyReason:
        'I could not find many visual clues yet. Maybe add a few more lines?',
    };
  }

  if (boundingBox) {
    const area = boundingBox.width * boundingBox.height;
    if (area < 800) {
      return {
        guess: 'unsure',
        confidence: 0.22,
        confidenceLabel: 'low',
        gateState: 'pause',
        gateOpen: false,
        visualClues: [],
        uncertainParts: ['drawing is very small'],
        friendlyReason:
          'Your cat is tiny on the page. I am not sure what clues to notice yet.',
      };
    }
    pixelScore += Math.min(area / 12000, 0.35);
  }

  pixelScore += Math.min(strokeCount / 40, 0.35);

  try {
    const density = await measureInkDensity(imageDataUrl);
    pixelScore += density * 0.3;
    seed += Math.floor(density * 100);
  } catch {
    pixelScore += 0.15;
  }

  const jitter = ((seed % 100) - 50) / 500;
  const confidence = Math.max(0.12, Math.min(0.92, pixelScore + jitter));
  const confidenceLabel = labelFromScore(confidence);

  const visualClues = pickRandom(CLUE_POOL, Math.min(3, 1 + Math.floor(strokeCount / 8)), seed);
  const uncertainParts = pickRandom(
    UNCERTAIN_POOL,
    confidence < 0.55 ? 2 : 1,
    seed + 7,
  );

  let guess: GateResult['guess'] = 'unsure';
  let gateOpen = false;
  let gateState: GateResult['gateState'] = 'pause';

  if (confidence >= 0.58) {
    guess = 'cat';
    gateOpen = confidence >= 0.48;
    gateState = gateOpen ? 'open' : 'pause';
  } else if (confidence < 0.28) {
    guess = 'not-cat';
    gateOpen = false;
    gateState = 'close';
  }

  if (strokeCount >= 12 && confidence >= 0.42) {
    gateOpen = confidence >= 0.5;
    guess = gateOpen ? 'cat' : 'unsure';
    gateState = gateOpen ? 'open' : 'pause';
  }

  const friendlyReason = buildFriendlyReason(guess, visualClues, uncertainParts);

  return {
    guess,
    confidence,
    confidenceLabel,
    gateState,
    gateOpen,
    visualClues,
    uncertainParts,
    friendlyReason,
  };
}

function buildFriendlyReason(
  guess: GateResult['guess'],
  clues: string[],
  uncertain: string[],
): string {
  const clueText =
    clues.length > 0 ? `I noticed ${clues.join(', ')}.` : 'I am still looking for clues.';

  if (guess === 'cat') {
    return `${clueText} So my guess is maybe a cat.`;
  }
  if (guess === 'not-cat') {
    return `${clueText} Some parts like ${uncertain.join(' and ')} feel unfamiliar to me.`;
  }
  return `${clueText} I am not sure yet — ${uncertain.join(' and ')} are hard for me to read.`;
}

async function measureInkDensity(imageDataUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no context'));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        const a = data[i + 3]!;
        if (a > 20 && r + g + b < 600) dark++;
      }
      resolve(dark / (size * size));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = imageDataUrl;
  });
}

export function formatGuess(guess: GateResult['guess']): string {
  switch (guess) {
    case 'cat':
      return 'maybe a cat';
    case 'not-cat':
      return 'maybe not a cat';
    default:
      return 'not sure';
  }
}

export function formatConfidence(label: ConfidenceLabel): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
