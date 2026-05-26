import { gateResultToGateState } from '../logic/predictGate';
import type { GateResult } from '../types';

type TestResultCardProps = {
  image: string;
  result: GateResult;
  compact?: boolean;
};

function borderClassForGate(gate: ReturnType<typeof gateResultToGateState>): string {
  if (gate === 'open') return 'border-emerald-400/80 bg-emerald-50/50';
  if (gate === 'close') return 'border-rose-400/80 bg-rose-50/40';
  return 'border-amber-300/70 bg-amber-50/35';
}

function gateLabel(gate: ReturnType<typeof gateResultToGateState>): string {
  if (gate === 'open') return 'Gate Opens';
  if (gate === 'close') return 'Gate Closes';
  return 'Gate Pauses';
}

export function TestResultCard({ image, result, compact = true }: TestResultCardProps) {
  const gate = gateResultToGateState(result);
  const pct = Math.round(Math.min(1, Math.max(0, result.confidence)) * 100);

  return (
    <div
      className={`flex max-w-[140px] flex-col gap-1.5 rounded-2xl border-2 border-dashed p-2 shadow-sm ${borderClassForGate(gate)} ${compact ? '' : 'max-w-[180px] p-3'}`}
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white/70 p-1">
        <img src={image} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
      </div>
      <p className={`font-display text-center leading-tight text-ink ${compact ? 'text-xs' : 'text-sm'}`}>
        {gateLabel(gate)}
      </p>
      <p className="text-center text-[10px] text-ink/60 md:text-[11px]">Confidence: {pct}%</p>
    </div>
  );
}
