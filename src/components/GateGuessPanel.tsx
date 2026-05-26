import { motion } from 'framer-motion';
import type { GateResult } from '../types';
import { formatConfidence } from '../logic/analyzeDrawing';
import { gateResultToGateState } from '../logic/predictGate';

type GateGuessPanelProps = {
  result: GateResult;
  showConfidenceNote?: boolean;
};

export function GateGuessPanel({ result, showConfidenceNote = true }: GateGuessPanelProps) {
  const confidencePercent = Math.round(result.confidence * 100);
  const gateState = gateResultToGateState(result);
  const gateLabel =
    gateState === 'open'
      ? 'Gate Opens'
      : gateState === 'close'
        ? 'Gate Closes'
        : 'Gate Pauses';

  return (
    <motion.div
      className="note-panel mx-auto max-w-md p-5 md:p-6"
      initial={{ opacity: 0, rotate: -2, y: 20 }}
      animate={{ opacity: 1, rotate: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
    >
      <p className="font-display mb-3 text-sm uppercase tracking-widest text-ink/50">
        Meow Gate&apos;s note
      </p>

      <div className="space-y-3 text-left">
        <div>
          <p className="font-display text-sm text-ink/60">Confidence</p>
          <p className="text-ink/85">
            I feel <strong>{formatConfidence(result.confidenceLabel)}</strong> confidence (
            {confidencePercent}%).
          </p>
          <div className="confidence-meter mt-2">
            <motion.div
              className="confidence-fill"
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercent}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </div>
          {showConfidenceNote && (
            <p className="mt-2 text-sm text-ink/65">
              Confidence means how sure Meow Gate feels. It does not always match what you expect.
            </p>
          )}
        </div>

        <div>
          <p className="font-display text-sm text-ink/60">Gate</p>
          <p className="text-ink/85">{gateLabel}</p>
          <p className="mt-1 text-xs italic text-ink/55">This is Meow Gate&apos;s guess.</p>
        </div>

        {result.visualClues.length > 0 && (
          <div>
            <p className="font-display text-sm text-ink/60">I noticed</p>
            <p className="text-ink/85">{result.visualClues.join(' · ')}</p>
          </div>
        )}

        {result.uncertainParts.length > 0 && (
          <div>
            <p className="font-display text-sm text-ink/60">I was unsure about</p>
            <p className="text-ink/85">{result.uncertainParts.join(' · ')}</p>
          </div>
        )}

        <p className="border-t border-ink/15 pt-3 text-ink/80 italic">{result.friendlyReason}</p>
      </div>
    </motion.div>
  );
}
