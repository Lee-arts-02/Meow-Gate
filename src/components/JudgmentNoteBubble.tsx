import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { gateResultToGateState } from '../logic/predictGate';
import type { GateResult } from '../types';
import { JudgmentDetails } from './JudgmentDetails';
import { JudgmentStatusCard } from './JudgmentStatusCard';
import { SketchButton } from './SketchButton';

type JudgmentNoteBubbleProps = {
  text: string;
  result: GateResult;
  showResult?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
};

export function JudgmentNoteBubble({
  text,
  result,
  showResult = false,
  showDetails = false,
  onToggleDetails,
}: JudgmentNoteBubbleProps) {
  return (
    <motion.div className="judgment-note-bubble z-20 w-[min(280px,78vw)] px-4 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="font-display text-sm leading-snug text-ink/85 md:text-[15px]">{text}</p>
      {showResult && (
        <>
          <JudgmentStatusCard gateState={gateResultToGateState(result)} confidenceLabel={result.confidenceLabel} />
          {!showDetails && onToggleDetails && (
            <SketchButton variant="ghost" size="sm" className="mt-3 w-full text-xs md:text-sm" onClick={onToggleDetails}>
              Look closer
            </SketchButton>
          )}
          <AnimatePresence>{showDetails && <JudgmentDetails result={result} />}</AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
