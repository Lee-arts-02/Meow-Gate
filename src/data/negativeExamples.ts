function shapeToDataUrl(draw: (ctx: CanvasRenderingContext2D, size: number) => void): string {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx, size);
  return canvas.toDataURL('image/png');
}

/** Six internal negative examples — balanced against nine initial cats */
export const negativeExamples = [
  {
    id: 'neg-circle',
    image: shapeToDataUrl((ctx, size) => {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    }),
  },
  {
    id: 'neg-square',
    image: shapeToDataUrl((ctx, size) => {
      const s = size * 0.38;
      ctx.strokeRect(size / 2 - s / 2, size / 2 - s / 2, s, s);
    }),
  },
  {
    id: 'neg-star',
    image: shapeToDataUrl((ctx, size) => {
      const cx = size / 2;
      const cy = size / 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? size * 0.24 : size * 0.1;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }),
  },
  {
    id: 'neg-scribble',
    image: shapeToDataUrl((ctx, size) => {
      ctx.beginPath();
      ctx.moveTo(size * 0.3, size * 0.4);
      ctx.quadraticCurveTo(size * 0.5, size * 0.2, size * 0.7, size * 0.45);
      ctx.stroke();
    }),
  },
  {
    id: 'neg-house',
    image: shapeToDataUrl((ctx, size) => {
      ctx.beginPath();
      ctx.moveTo(size * 0.35, size * 0.55);
      ctx.lineTo(size * 0.5, size * 0.35);
      ctx.lineTo(size * 0.65, size * 0.55);
      ctx.stroke();
      ctx.strokeRect(size * 0.38, size * 0.55, size * 0.24, size * 0.18);
    }),
  },
  {
    id: 'neg-cloud',
    image: shapeToDataUrl((ctx, size) => {
      ctx.beginPath();
      ctx.arc(size * 0.4, size * 0.55, size * 0.12, 0, Math.PI * 2);
      ctx.arc(size * 0.52, size * 0.5, size * 0.14, 0, Math.PI * 2);
      ctx.stroke();
    }),
  },
];
