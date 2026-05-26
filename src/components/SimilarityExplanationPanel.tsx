import { motion } from 'framer-motion';
import type { ClosestMemoryResult } from '../logic/findClosestMemoryCat';
import { getWhySimilarityMessage } from '../logic/findSimilarCats';
import type { NearestExampleInfo } from '../types';
import { SketchButton } from './SketchButton';
import { WhyComparisonPanel } from './WhyComparisonPanel';

type SimilarityExplanationPanelProps = {
  targetImage: string;
  targetLabel?: string;
  closestResult: ClosestMemoryResult | null;
  rankedResults?: ClosestMemoryResult[];
  nearestExamples?: NearestExampleInfo[];
  clueTags?: string[];
  gateOpens?: boolean;
  hasStudentExamples?: boolean;
  loading?: boolean;
  title?: string;
  onClose?: () => void;
};

export function SimilarityExplanationPanel({
  targetImage,
  targetLabel = 'Your Cat',
  closestResult,
  rankedResults = [],
  nearestExamples = [],
  clueTags = [],
  gateOpens = true,
  hasStudentExamples = false,
  loading = false,
  title = 'Why did Meow Gate think that?',
  onClose,
}: SimilarityExplanationPanelProps) {
  const looksSimilar = (closestResult?.score ?? 0) >= 0.52;

  return (
    <motion.div
      className="book-page mx-auto w-full max-w-4xl p-5 md:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink md:text-2xl">{title}</h3>
          <p className="mt-1 text-sm text-ink/65">
            Meow Gate compared this cat with examples in its Memory Book.
          </p>
        </div>
        {onClose && (
          <SketchButton variant="ghost" size="sm" onClick={onClose}>
            Back
          </SketchButton>
        )}
      </div>

      <WhyComparisonPanel
        targetImage={targetImage}
        targetLabel={targetLabel}
        closestResult={closestResult}
        rankedResults={rankedResults}
        nearestExamples={nearestExamples}
        clueTags={clueTags}
        loading={loading}
      />

      <motion.div
        className="note-panel mt-6 space-y-2 p-4 text-sm text-ink/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {closestResult && (
          <p>{getWhySimilarityMessage(closestResult.score)}</p>
        )}
        <p>This helps us see what Meow Gate may be comparing.</p>
        {gateOpens && looksSimilar ? (
          <p>That is why Meow Gate guessed the gate could open.</p>
        ) : (
          <p>
            These examples do not look very similar. Meow Gate may need more examples like this.
          </p>
        )}
        {hasStudentExamples && (
          <p className="font-display text-ink/80">
            Your new examples helped most when they looked similar to the test cat.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
