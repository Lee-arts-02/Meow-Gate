import { useCallback, useEffect, useRef, useState } from 'react';
import { exportTransparentDrawing } from '../logic/exportDrawingImage';
import { SketchButton } from './SketchButton';

export type DrawingResult = {
  imageDataUrl: string;
  strokeCount: number;
  boundingBox: { width: number; height: number } | null;
};

type DrawingCanvasProps = {
  instruction: string;
  hint?: string;
  onDone: (result: DrawingResult) => void;
  onBack?: () => void;
  compact?: boolean;
  doneLabel?: string;
  successMessage?: string;
};

type Point = { x: number; y: number };

type Tool = 'pen' | 'eraser';

export function DrawingCanvas({
  instruction,
  hint,
  onDone,
  onBack,
  compact = false,
  doneLabel = 'Done',
  successMessage,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const pointsRef = useRef<Point[]>([]);
  const allPointsRef = useRef<Point[]>([]);

  const initCanvas = useCallback((preserve?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (preserve) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = preserve;
    }
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const data = canvas.toDataURL('image/png');
      initCanvas(data);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getPoint = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getPoint(e);
    pointsRef.current = [pt];
    allPointsRef.current.push(pt);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pt = getPoint(e);
    const prev = pointsRef.current[pointsRef.current.length - 1];
    if (!prev) return;

    ctx.beginPath();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = compact ? 14 : 18;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = compact ? 2.5 : 3.5;
    }
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    pointsRef.current.push(pt);
    allPointsRef.current.push(pt);
  };

  const endDraw = () => {
    if (isDrawing && pointsRef.current.length > 1) {
      setStrokeCount((c) => c + 1);
    }
    setIsDrawing(false);
    pointsRef.current = [];
  };

  const clear = () => {
    initCanvas();
    setStrokeCount(0);
    allPointsRef.current = [];
    setMessage('');
  };

  const computeBoundingBox = (): DrawingResult['boundingBox'] => {
    const pts = allPointsRef.current;
    if (pts.length < 2) return null;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { width: maxX - minX, height: maxY - minY };
  };

  const handleDone = async () => {
    const canvas = canvasRef.current;
    if (!canvas || processing) return;

    const bbox = computeBoundingBox();
    if (strokeCount < 2 || !bbox || bbox.width < 20 || bbox.height < 20) {
      setMessage('Add a few more lines so your cat can walk to the gate.');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      const rawImage = canvas.toDataURL('image/png');
      const finalImage = await exportTransparentDrawing(rawImage);

      if (successMessage) {
        setMessage(successMessage);
        await new Promise((r) => setTimeout(r, 700));
      }

      onDone({
        imageDataUrl: finalImage,
        strokeCount,
        boundingBox: bbox,
      });
    } catch (err) {
      console.warn('[Meow Gate] Drawing export failed.', err);
      setMessage('Something went wrong saving your drawing. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
      <div>
        <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">{instruction}</h2>
        {hint && <p className="story-text text-ink/70">{hint}</p>}
      </div>

      <div
        className={`canvas-wrapper sketch-card overflow-hidden ${compact ? 'h-56' : 'h-72 md:h-96'}`}
      >
        <canvas
          ref={canvasRef}
          className="drawing-surface h-full w-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>

      {message && (
        <p className="rounded-lg border border-ink/20 bg-pastel-blue/20 px-4 py-2 text-ink/80">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SketchButton
          variant={tool === 'pen' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTool('pen')}
          disabled={processing}
        >
          Pen
        </SketchButton>
        <SketchButton
          variant={tool === 'eraser' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTool('eraser')}
          disabled={processing}
        >
          Eraser
        </SketchButton>
        <SketchButton variant="ghost" size="sm" onClick={clear} disabled={processing}>
          Clear
        </SketchButton>
        <div className="flex-1" />
        {onBack && (
          <SketchButton variant="ghost" size="sm" onClick={onBack} disabled={processing}>
            Back
          </SketchButton>
        )}
        <SketchButton variant="primary" onClick={handleDone} disabled={processing}>
          {processing ? 'Saving…' : doneLabel}
        </SketchButton>
      </div>
    </div>
  );
}
