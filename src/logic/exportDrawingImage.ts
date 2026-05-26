import { cropTransparentImage } from './cropTransparentImage';
import { imageHasTransparency, makeWhiteBackgroundTransparent } from './makeTransparent';

/**
 * Export pipeline: preserve transparent canvas exports, remove paper background
 * only when needed, then crop to drawing bounds.
 */
export async function exportTransparentDrawing(rawImageDataUrl: string): Promise<string> {
  try {
    const alreadyTransparent = await imageHasTransparency(rawImageDataUrl);

    const processed = alreadyTransparent
      ? rawImageDataUrl
      : await makeWhiteBackgroundTransparent(rawImageDataUrl);

    return await cropTransparentImage(processed, 24);
  } catch (err) {
    console.warn('[Meow Gate] Transparent export failed, using original image.', err);
    try {
      return await cropTransparentImage(rawImageDataUrl, 24);
    } catch {
      return rawImageDataUrl;
    }
  }
}
