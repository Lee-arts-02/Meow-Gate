/**
 * prepareQuickDrawCats.js
 *
 * Streams the Google Quick, Draw! simplified cat .ndjson file, randomly samples
 * a small batch of doodle drawings, and writes them to src/data/quickDrawCatPreview.ts
 * for use in the Cat Memory Book.
 *
 * Quick, Draw! cat doodles represent common doodle examples only — not a complete
 * or subtype-labeled dataset. They are for educational visualization, not live training.
 *
 * Usage:
 *   node scripts/prepareQuickDrawCats.js
 *   SAMPLE_SIZE=60 node scripts/prepareQuickDrawCats.js
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_TS = join(ROOT, 'src', 'data', 'quickDrawCatPreview.ts');
const OUTPUT_JSON = join(ROOT, 'public', 'data', 'quickdraw-cat-preview.json');

const QUICKDRAW_URL =
  'https://storage.googleapis.com/quickdraw_dataset/full/simplified/cat.ndjson';

const SAMPLE_SIZE = Number.parseInt(process.env.SAMPLE_SIZE ?? '60', 10);
const MIN_STROKES = 2;

/** Hardcoded fallback strokes — mirrors src/data/fallbackQuickDrawCats.ts */
const FALLBACK_SAMPLES = [
  {
    id: 'fallback-cat-001',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[40, 80, 120, 160, 200, 160, 120, 80], [140, 120, 110, 120, 140, 180, 190, 180]],
      [[60, 50, 70], [100, 70, 90]],
      [[190, 200, 210], [100, 70, 90]],
      [[200, 230, 250], [150, 130, 150]],
      [[30, 20], [130, 145]],
      [[210, 220], [130, 145]],
    ],
    features: ['doodle cat', 'simple line drawing'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-002',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[50, 100, 150, 200], [160, 130, 130, 160]],
      [[70, 60, 85], [110, 80, 95]],
      [[165, 175, 190], [110, 80, 95]],
      [[40, 30], [145, 155]],
      [[200, 215], [145, 155]],
      [[100, 130], [170, 185]],
    ],
    features: ['doodle cat', 'round face'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-003',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[30, 60, 90, 120, 150, 180, 210], [120, 100, 90, 95, 100, 120, 140]],
      [[55, 45, 65], [85, 60, 75]],
      [[145, 155, 170], [85, 60, 75]],
      [[210, 235, 255], [130, 110, 125]],
      [[80, 110], [140, 155]],
    ],
    features: ['doodle cat', 'whiskers'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-004',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[60, 90, 120, 150, 180], [150, 120, 115, 120, 150]],
      [[75, 65, 88], [105, 75, 90]],
      [[152, 162, 178], [105, 75, 90]],
      [[180, 210, 230], [140, 125, 140]],
      [[50, 40], [135, 148]],
      [[175, 190], [135, 148]],
    ],
    features: ['doodle cat', 'pointed ears'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-005',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[45, 75, 105, 135, 165, 195], [130, 105, 95, 100, 110, 135]],
      [[60, 50, 72], [95, 68, 82]],
      [[128, 138, 155], [95, 68, 82]],
      [[195, 220, 240], [120, 100, 115]],
      [[90, 120], [145, 160]],
      [[70, 95], [155, 175]],
      [[125, 150], [155, 175]],
    ],
    features: ['doodle cat', 'simple line drawing'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-006',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[80, 110, 140, 170], [145, 115, 110, 140]],
      [[95, 85, 108], [100, 72, 88]],
      [[138, 148, 165], [100, 72, 88]],
      [[170, 200, 215], [135, 115, 130]],
      [[65, 55], [130, 142]],
      [[160, 175], [130, 142]],
    ],
    features: ['doodle cat', 'round face'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-007',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[35, 65, 95, 125, 155, 185, 215], [125, 95, 85, 90, 100, 120, 145]],
      [[50, 40, 62], [88, 58, 72]],
      [[118, 128, 145], [88, 58, 72]],
      [[215, 240, 255], [125, 105, 120]],
    ],
    features: ['doodle cat', 'tail'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
  {
    id: 'fallback-cat-008',
    source: 'quickdraw',
    label: 'cat',
    drawing: [
      [[55, 85, 115, 145, 175], [155, 125, 118, 125, 155]],
      [[70, 58, 82], [108, 78, 92]],
      [[143, 153, 170], [108, 78, 92]],
      [[175, 205, 225], [145, 128, 142]],
      [[45, 35], [138, 150]],
      [[168, 183], [138, 150]],
      [[100, 130], [165, 180]],
    ],
    features: ['doodle cat', 'whiskers'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  },
];

/**
 * Reservoir sampling: keep a uniform random sample of size `sampleSize`
 * from a stream without storing the entire dataset.
 */
function reservoirSample(streamItem, reservoir, seenCount, sampleSize) {
  if (reservoir.length < sampleSize) {
    reservoir.push(streamItem);
    return;
  }
  const j = Math.floor(Math.random() * seenCount);
  if (j < sampleSize) {
    reservoir[j] = streamItem;
  }
}

function isValidDrawing(drawing) {
  if (!Array.isArray(drawing) || drawing.length < MIN_STROKES) return false;
  return drawing.every(
    (stroke) =>
      Array.isArray(stroke) &&
      stroke.length === 2 &&
      Array.isArray(stroke[0]) &&
      Array.isArray(stroke[1]) &&
      stroke[0].length >= 2 &&
      stroke[1].length >= 2,
  );
}

function normalizeDrawing(drawing) {
  return drawing.map((stroke) => [
    stroke[0].map((n) => Math.round(n)),
    stroke[1].map((n) => Math.round(n)),
  ]);
}

function toPreviewExample(drawing, index) {
  const id = `quickdraw-cat-${String(index + 1).padStart(3, '0')}`;
  return {
    id,
    source: 'quickdraw',
    label: 'cat',
    drawing: normalizeDrawing(drawing),
    features: ['doodle cat', 'simple line drawing'],
    representation: 'common',
    note: "This is one cat doodle from the system's old memory.",
  };
}

async function streamSampleFromUrl(url, sampleSize) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error('Download failed: empty response body');
  }

  const nodeStream = Readable.fromWeb(response.body);
  const rl = createInterface({ input: nodeStream, crlfDelay: Infinity });

  const reservoir = [];
  let seenCount = 0;
  let linesRead = 0;
  const maxLines = sampleSize * 500;

  for await (const line of rl) {
    linesRead++;
    if (!line.trim()) continue;

    try {
      const record = JSON.parse(line);
      if (!isValidDrawing(record.drawing)) continue;

      seenCount++;
      reservoirSample(record.drawing, reservoir, seenCount, sampleSize);

      if (reservoir.length >= sampleSize && seenCount >= sampleSize * 3) {
        break;
      }
    } catch {
      // skip malformed lines
    }

    if (linesRead >= maxLines && reservoir.length >= Math.min(10, sampleSize)) {
      break;
    }
  }

  rl.close();

  if (reservoir.length === 0) {
    throw new Error('No valid cat drawings found in stream');
  }

  return reservoir.map((drawing, i) => toPreviewExample(drawing, i));
}

async function writeOutputs(examples, source) {
  const tsContent = `/**
 * AUTO-GENERATED by scripts/prepareQuickDrawCats.js
 * Source: ${source}
 * Count: ${examples.length}
 *
 * Quick, Draw! cat doodles are common doodle preview examples only.
 * They do not represent a complete or subtype-labeled dataset.
 * Not used for live model training — educational visualization only.
 */
import type { QuickDrawCatExample } from '../types';

export const quickDrawCatPreview: QuickDrawCatExample[] = ${JSON.stringify(examples, null, 2)} as QuickDrawCatExample[];
`;

  await writeFile(OUTPUT_TS, tsContent, 'utf8');

  await mkdir(dirname(OUTPUT_JSON), { recursive: true });
  await writeFile(OUTPUT_JSON, JSON.stringify(examples, null, 2), 'utf8');

  console.log(`Wrote ${examples.length} examples to:`);
  console.log(`  ${OUTPUT_TS}`);
  console.log(`  ${OUTPUT_JSON}`);
}

async function main() {
  console.log(`Sampling ${SAMPLE_SIZE} Quick, Draw! cat doodles…`);
  console.log(`Source: ${QUICKDRAW_URL}`);

  try {
    const examples = await streamSampleFromUrl(QUICKDRAW_URL, SAMPLE_SIZE);
    await writeOutputs(examples, QUICKDRAW_URL);
    console.log('Done.');
  } catch (err) {
    console.error('Quick, Draw! download/sample failed:', err.message);
    console.warn(`Writing ${FALLBACK_SAMPLES.length} hardcoded fallback examples instead.`);

    try {
      await writeOutputs(FALLBACK_SAMPLES, 'fallback (download failed)');
      console.log('Fallback data written — app will still run.');
    } catch (writeErr) {
      console.error('Failed to write fallback output:', writeErr.message);
      process.exit(1);
    }
  }
}

main();
