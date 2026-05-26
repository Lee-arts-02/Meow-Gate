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
  /** KNN top neighbor is a not-cat training image — not part of the Memory Book. */
  knnNearestIsNotCat?: boolean;
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
  knnNearestIsNotCat = false,
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
          {closestResult && (
            <p className="mt-2 text-sm text-ink/75">This was the closest example it found.</p>
          )}
          {knnNearestIsNotCat && (
            <p className="mt-3 rounded-lg border border-ink/15 bg-pastel-blue/20 p-3 text-sm text-ink/85">
              Meow Gate did not find a close cat example in the Memory Book.
            </p>
          )}
        </div>
        {onClose && (
          <SketchButton variant="ghost" size="sm" onClick={onClose}>
            Back
          </SketchButton>
        )}
      </div>

      {loading ? (
        <WhyComparisonPanel
          targetImage={targetImage}
          targetLabel={targetLabel}
          closestResult={null}
          rankedResults={[]}
          nearestExamples={nearestExamples}
          clueTags={clueTags}
          loading
        />
      ) : closestResult ? (
        <WhyComparisonPanel
          targetImage={targetImage}
          targetLabel={targetLabel}
          closestResult={closestResult}
          rankedResults={rankedResults}
          nearestExamples={nearestExamples}
          clueTags={clueTags}
          loading={false}
        />
      ) : (
        <p className="story-text mt-4 text-ink/75">
          No close Memory Book cat found for a side-by-side picture. Meow Gate still compared this
          cat with its training examples to make a guess.
        </p>
      )}

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
