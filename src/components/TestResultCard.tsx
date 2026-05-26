import { gateResultToGateState } from '../logic/predictGate';
import { formatSimilarityLabel, scoreToSimilarityLabel } from '../logic/findSimilarCats';
import type { GatePrediction } from '../ml/modelTypes';
import type { GateResult } from '../types';

type TestResultCardProps = {
  evaluationCat: { id: string; image: string };
  result: GateResult;
  prediction: GatePrediction;
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

export function TestResultCard({
  evaluationCat,
  result,
  prediction,
  compact = true,
}: TestResultCardProps) {
  const gate = gateResultToGateState(result);
  const confPct = Math.round(Math.min(1, Math.max(0, result.confidence)) * 100);
  const closest = prediction.closestMemoryExample;
  const matchSim = closest?.similarity ?? result.closestMemorySimilarity ?? 0;
  const matchPct = Math.round(Math.min(1, Math.max(0, matchSim)) * 100);
  const simLabel = formatSimilarityLabel(scoreToSimilarityLabel(matchSim));

  return (
    <div
      className={`flex max-w-[min(100%,280px)] flex-col gap-2 rounded-2xl border-2 border-dashed p-2.5 shadow-sm ${borderClassForGate(gate)} ${compact ? '' : 'p-3'}`}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <p className="font-display text-[9px] uppercase tracking-wide text-ink/45">Test cat</p>
          <div className="flex aspect-square w-full max-w-[88px] items-center justify-center overflow-hidden rounded-xl bg-white/70 p-1">
            <img
              src={evaluationCat.image}
              alt=""
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
        <span className="shrink-0 font-display text-lg text-ink/35" aria-hidden>
          →
        </span>
        <div className="flex flex-1 flex-col items-center gap-1">
          <p className="font-display text-[9px] uppercase tracking-wide text-ink/45">Closest match</p>
          <div className="flex aspect-square w-full max-w-[88px] items-center justify-center overflow-hidden rounded-xl bg-white/70 p-1">
            {closest ? (
              <img
                src={closest.image}
                alt=""
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            ) : (
              <p className="px-1 text-center text-[9px] leading-tight text-ink/55">
                No close Memory Book cat found.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className={`font-display text-center leading-tight text-ink ${compact ? 'text-xs' : 'text-sm'}`}>
        {gateLabel(gate)}
      </p>
      <p className="text-center text-[10px] text-ink/60 md:text-[11px]">Confidence: {confPct}%</p>
      <p className="text-center text-[10px] text-ink/60 md:text-[11px]">
        Closest match: {closest ? `${matchPct}% · ${simLabel}` : '—'}
      </p>
    </div>
  );
}
