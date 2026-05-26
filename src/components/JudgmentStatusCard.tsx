import { motion } from 'framer-motion';
import { formatConfidence } from '../logic/analyzeDrawing';
import type { ConfidenceLabel, GateState } from '../types';

type JudgmentStatusCardProps = {
  gateState: GateState;
  confidenceLabel: ConfidenceLabel;
};

const STATUS_CONFIG: Record<GateState, { label: string; stampClass: string }> = {
  open: { label: 'Gate Opens', stampClass: 'judgment-result-stamp--open' },
  close: { label: 'Gate Closes', stampClass: 'judgment-result-stamp--close' },
  pause: { label: 'Gate Pauses', stampClass: 'judgment-result-stamp--pause' },
};

export function JudgmentStatusCard({ gateState, confidenceLabel }: JudgmentStatusCardProps) {
  const config = STATUS_CONFIG[gateState];
  return (
    <motion.div className="judgment-status-card mt-3 space-y-2.5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <p className="font-display text-[11px] uppercase tracking-widest text-ink/45">Confidence</p>
        <p className="font-display text-base text-ink/75">{formatConfidence(confidenceLabel)}</p>
      </div>
      <p className={`judgment-result-stamp font-display text-2xl uppercase tracking-wide md:text-3xl ${config.stampClass}`}>
        {config.label}
      </p>
      <p className="text-[11px] italic text-ink/55">This is Meow Gate&apos;s guess.</p>
    </motion.div>
  );
}
