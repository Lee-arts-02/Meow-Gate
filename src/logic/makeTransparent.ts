export type TransparencyOptions = {
  tolerance?: number;
  darkThreshold?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for transparency processing'));
    img.src = src;
  });
}

/**
 * Converts near-white / paper-colored pixels to transparent while preserving dark strokes.
 * Only modifies alpha — never sets RGB to black.
 * Runs entirely in the browser — no external services.
 */
export async function makeWhiteBackgroundTransparent(
  imageDataUrl: string,
  options?: TransparencyOptions,
): Promise<string> {
  const tolerance = options?.tolerance ?? 245;
  const darkThreshold = options?.darkThreshold ?? 180;

  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Could not get 2d context for transparency processing');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;
    const avg = (r + g + b) / 3;

    // Already transparent — keep transparent (do NOT treat as dark stroke)
    if (a < 15) {
      data[i + 3] = 0;
      continue;
    }

    const isWhite = r > tolerance && g > tolerance && b > tolerance;
    const isPaper = r > 235 && g > 230 && b > 215;
    const isLight = avg > 235;
    const isDarkStroke = r < darkThreshold && g < darkThreshold && b < darkThreshold && a > 128;

    if (isDarkStroke) {
      data[i + 3] = 255;
      continue;
    }

    if (isWhite || isPaper || isLight) {
      data[i + 3] = 0;
    } else if (avg > 200) {
      const fade = Math.max(0, 1 - (avg - 200) / 55);
      data[i + 3] = Math.round(a * fade);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Returns true if the image contains meaningful transparent pixels. */
export async function imageHasTransparency(imageDataUrl: string): Promise<boolean> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparentCount = 0;
  const total = canvas.width * canvas.height;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 15) transparentCount++;
  }

  // At least 10% transparent pixels suggests a transparent canvas export
  return transparentCount > total * 0.1;
}
