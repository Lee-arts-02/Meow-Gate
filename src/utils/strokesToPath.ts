/**
 * Convert Quick, Draw! stroke data into a single SVG path `d` attribute.
 * Each stroke is [[x...], [y...]] with paired coordinates.
 */
export function strokesToPath(drawing: number[][][]): string {
  return drawing
    .map((stroke) => {
      const xs = stroke[0];
      const ys = stroke[1];
      if (!xs?.length || !ys?.length) return '';
      const len = Math.min(xs.length, ys.length);
      return Array.from({ length: len }, (_, i) => {
        const x = xs[i]!;
        const y = ys[i]!;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

/** Compute a viewBox that fits all strokes with padding. */
export function strokesViewBox(
  drawing: number[][][],
  padding = 8,
): { viewBox: string; width: number; height: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const stroke of drawing) {
    xs.push(...(stroke[0] ?? []));
    ys.push(...(stroke[1] ?? []));
  }
  if (xs.length === 0) {
    return { viewBox: '0 0 256 256', width: 256, height: 256 };
  }
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  const w = maxX - minX;
  const h = maxY - minY;
  return {
    viewBox: `${minX} ${minY} ${w} ${h}`,
    width: w,
    height: h,
  };
}
