export const DEFAULT_VECTOR_SIZE = 64;

function isDebugMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true'
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (isDebugMode()) {
        console.warn('[Meow Gate] Failed to load image:', src);
      }
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

function isDarkStroke(r: number, g: number, b: number, a: number): boolean {
  if (a < 20) return false;
  const brightness = (r + g + b) / 3;
  return brightness < 240;
}

function findStrokeBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const r = data[offset]!;
      const g = data[offset + 1]!;
      const b = data[offset + 2]!;
      const a = data[offset + 3]!;
      if (!isDarkStroke(r, g, b, a)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

export async function normalizeDrawingToCanvas(
  imageSrc: string,
  size = DEFAULT_VECTOR_SIZE,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageSrc);

  const temp = document.createElement('canvas');
  temp.width = img.width;
  temp.height = img.height;
  const tempCtx = temp.getContext('2d');
  if (!tempCtx) throw new Error('Could not create temp canvas');

  tempCtx.clearRect(0, 0, temp.width, temp.height);
  tempCtx.drawImage(img, 0, 0);

  const sourceData = tempCtx.getImageData(0, 0, temp.width, temp.height);
  const bounds = findStrokeBounds(sourceData.data, temp.width, temp.height);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const padding = size * 0.1;
  const inner = size - padding * 2;

  if (!bounds) {
    ctx.drawImage(img, padding, padding, inner, inner);
    return canvas;
  }

  const cropW = bounds.maxX - bounds.minX + 1;
  const cropH = bounds.maxY - bounds.minY + 1;
  const scale = Math.min(inner / cropW, inner / cropH);
  const drawW = cropW * scale;
  const drawH = cropH * scale;
  const drawX = padding + (inner - drawW) / 2;
  const drawY = padding + (inner - drawH) / 2;

  ctx.drawImage(
    temp,
    bounds.minX,
    bounds.minY,
    cropW,
    cropH,
    drawX,
    drawY,
    drawW,
    drawH,
  );

  return canvas;
}

export function canvasToVector(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const vector: number[] = [];

  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    const r = data[offset]!;
    const g = data[offset + 1]!;
    const b = data[offset + 2]!;
    const a = data[offset + 3]!;
    const brightness = a < 20 ? 255 : (r + g + b) / 3;
    vector.push(1 - brightness / 255);
  }

  return vector;
}

export function vectorCosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i]!;
    const bv = b[i]!;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

export async function imageToVector(
  imageSrc: string,
  size = DEFAULT_VECTOR_SIZE,
): Promise<number[]> {
  const canvas = await normalizeDrawingToCanvas(imageSrc, size);
  return canvasToVector(canvas);
}

export async function compareImageSimilarity(
  aSrc: string,
  bSrc: string,
  size = DEFAULT_VECTOR_SIZE,
): Promise<number> {
  const [vectorA, vectorB] = await Promise.all([
    imageToVector(aSrc, size),
    imageToVector(bSrc, size),
  ]);
  return vectorCosineSimilarity(vectorA, vectorB);
}
