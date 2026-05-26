import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCatModel } from '../context/CatModelContext';
import type { EvaluationCat } from '../data/evaluationCats';
import {
  buildMemoryExamples,
  findClosestMemoryCat,
  rankMemoryExamples,
  type ClosestMemoryResult,
} from '../logic/findClosestMemoryCat';
import { clueTagsFromVisualClues } from '../logic/findSimilarCats';
import { gateResultToGateState } from '../logic/predictGate';
import type { CatMemoryState, GateResult } from '../types';
import { JudgmentStage } from './JudgmentStage';
import { JudgmentStatusCard } from './JudgmentStatusCard';
import { SimilarityExplanationPanel } from './SimilarityExplanationPanel';
import { SketchButton } from './SketchButton';
import { TestResultsStrip, type StripResultItem } from './TestResultsStrip';

type SequentialEvaluationProps = {
  evaluationCats: EvaluationCat[];
  memoryState: CatMemoryState;
  onComplete: () => void | Promise<void>;
  onAddMoreExamples?: () => void;
  onBuildAgain?: () => void;
};

type Phase = 'intro' | 'walking' | 'predicting' | 'result' | 'summary';

export function SequentialEvaluation({
  evaluationCats,
  memoryState,
  onComplete,
  onAddMoreExamples,
  onBuildAgain,
}: SequentialEvaluationProps) {
  const { predictEvaluation, canTest } = useCatModel();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentResult, setCurrentResult] = useState<GateResult | null>(null);
  const [stripResults, setStripResults] = useState<StripResultItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [closestResult, setClosestResult] = useState<ClosestMemoryResult | null>(null);
  const [rankedResults, setRankedResults] = useState<ClosestMemoryResult[]>([]);

  const hasArrivedRef = useRef(false);
  const currentCat = evaluationCats[currentIndex];
  const memoryExamples = useMemo(() => buildMemoryExamples(memoryState), [memoryState]);
  const isLastCat = currentIndex >= evaluationCats.length - 1;

  const summaryCounts = useMemo(() => {
    return stripResults.reduce(
      (acc, { result }) => {
        const state = gateResultToGateState(result);
        if (state === 'open') acc.open += 1;
        else if (state === 'close') acc.close += 1;
        else acc.pause += 1;
        return acc;
      },
      { open: 0, close: 0, pause: 0 },
    );
  }, [stripResults]);

  useEffect(() => {
    if (phase === 'walking' && currentCat) {
      hasArrivedRef.current = false;
    }
  }, [phase, currentCat, currentIndex]);

  useEffect(() => {
    if (!showComparison || !currentCat || !currentResult) return;
    let cancelled = false;
    void (async () => {
      setComparisonLoading(true);
      try {
        const [closest, ranked] = await Promise.all([
          findClosestMemoryCat(currentCat.image, memoryExamples),
          rankMemoryExamples(currentCat.image, memoryExamples, 3),
        ]);
        if (!cancelled) {
          setClosestResult(closest);
          setRankedResults(ranked);
        }
      } finally {
        if (!cancelled) setComparisonLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showComparison, currentCat, currentResult, memoryExamples]);

  useEffect(() => {
    if (phase !== 'predicting' || !currentCat) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await predictEvaluation(currentCat.image);
        if (cancelled) return;
        setCurrentResult(res);
        setStripResults((prev) => {
          if (prev.some((r) => r.catId === currentCat.id)) return prev;
          return [...prev, { catId: currentCat.id, image: currentCat.image, result: res }];
        });
        setPhase('result');
      } catch {
        if (cancelled) return;
        const fallback: GateResult = {
          guess: 'unsure',
          confidence: 0.2,
          confidenceLabel: 'low',
          gateState: 'pause',
          gateOpen: false,
          visualClues: [],
          uncertainParts: [],
          friendlyReason: 'Meow Gate could not finish this guess.',
        };
        setCurrentResult(fallback);
        setStripResults((prev) => {
          if (prev.some((r) => r.catId === currentCat.id)) return prev;
          return [...prev, { catId: currentCat.id, image: currentCat.image, result: fallback }];
        });
        setPhase('result');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, currentCat, predictEvaluation]);

  const handleWalkArrived = useCallback(() => {
    if (hasArrivedRef.current) return;
    hasArrivedRef.current = true;
    setPhase('predicting');
  }, []);

  const handleNextCat = useCallback(() => {
    if (!currentResult) return;
    setShowComparison(false);
    if (isLastCat) {
      setPhase('summary');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setCurrentResult(null);
    setPhase('walking');
  }, [currentResult, isLastCat]);

  if (!canTest) {
    return (
      <section className="flex flex-1 flex-col gap-6">
        <p className="note-panel mx-auto max-w-lg p-4 text-center text-ink/80">
          Meow Gate needs to finish learning first.
        </p>
      </section>
    );
  }

  if (phase === 'intro') {
    return (
      <section className="flex flex-1 flex-col gap-6">
        <div className="text-center">
          <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Test the New Memory Book</h2>
          <p className="story-text mx-auto max-w-xl text-ink/75">
            Now let&apos;s see how Meow Gate responds to cats it has not seen before.
          </p>
        </div>
        <div className="flex justify-center">
          <SketchButton variant="primary" onClick={() => setPhase('walking')}>
            Start testing
          </SketchButton>
        </div>
      </section>
    );
  }

  if (phase === 'summary') {
    return (
      <section className="flex flex-1 flex-col gap-6">
        <div className="text-center">
          <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Testing complete.</h2>
        </div>
        <div className="book-page mx-auto w-full max-w-xl space-y-3 p-5 text-left">
          <p className="text-sm text-ink/80">Meow Gate opened for {summaryCounts.open} cats.</p>
          <p className="text-sm text-ink/80">Meow Gate closed for {summaryCounts.close} cats.</p>
          <p className="text-sm text-ink/80">Meow Gate paused for {summaryCounts.pause} cats.</p>
          <div className="mt-4 border-t border-dashed border-ink/15 pt-4">
            <p className="font-display text-sm text-ink">Which cats did it still miss?</p>
            <p className="mt-1 text-sm text-ink/75">What examples could you add next?</p>
          </div>
        </div>
        <TestResultsStrip results={stripResults} />
        <div className="flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
          {onAddMoreExamples && (
            <SketchButton variant="secondary" onClick={onAddMoreExamples}>
              Add more examples
            </SketchButton>
          )}
          <SketchButton
            variant="primary"
            onClick={() => {
              void Promise.resolve(onComplete());
            }}
          >
            Share your Cat City
          </SketchButton>
          {onBuildAgain && (
            <SketchButton variant="ghost" onClick={onBuildAgain}>
              Build again
            </SketchButton>
          )}
        </div>
      </section>
    );
  }

  if (!currentCat) return null;
  const gateState = currentResult ? gateResultToGateState(currentResult) : 'pause';

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Test the New Memory Book</h2>
        <p className="story-text text-ink/75">
          Cat {currentIndex + 1} of {evaluationCats.length}
        </p>
      </div>

      {phase === 'walking' && (
        <p className="text-center font-display text-sm text-ink/80">Here comes a new cat.</p>
      )}
      {phase === 'predicting' && (
        <p className="text-center text-sm text-ink/75">
          Meow Gate is comparing this cat with the Memory Book…
        </p>
      )}

      <div className="relative">
        <JudgmentStage
          catImage={currentCat.image}
          catAlt=""
          variant="preset"
          gateOpen={gateState === 'open'}
          gateState={gateState}
          resetKey={`${currentCat.id}-${currentIndex}`}
          onArrival={phase === 'walking' ? handleWalkArrived : undefined}
        />
      </div>

      <TestResultsStrip results={stripResults} />

      {phase === 'result' && currentResult && (
        <motion.div
          className="mx-auto w-full max-w-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="note-panel p-4">
            <JudgmentStatusCard gateState={gateState} confidenceLabel={currentResult.confidenceLabel} />
            <p className="mt-2 text-center text-sm text-ink/70">
              Confidence: {Math.round(Math.min(1, Math.max(0, currentResult.confidence)) * 100)}%
            </p>
            <p className="mt-1 text-center text-[11px] italic text-ink/55">This is Meow Gate&apos;s guess.</p>
          </div>
          {!showComparison ? (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <SketchButton variant="secondary" size="sm" onClick={() => setShowComparison(true)}>
                Why?
              </SketchButton>
              <SketchButton variant="primary" onClick={handleNextCat}>
                {isLastCat ? 'Finish testing' : 'Next cat'}
              </SketchButton>
            </div>
          ) : (
            <>
              <SimilarityExplanationPanel
                targetImage={currentCat.image}
                targetLabel="This cat"
                closestResult={closestResult}
                rankedResults={rankedResults}
                nearestExamples={currentResult.nearestExamples}
                clueTags={clueTagsFromVisualClues(currentResult.visualClues)}
                gateOpens={gateState === 'open'}
                hasStudentExamples={memoryState.studentExamples.length > 0}
                loading={comparisonLoading}
                onClose={() => setShowComparison(false)}
              />
              <div className="mt-4 flex justify-center">
                <SketchButton variant="primary" onClick={handleNextCat}>
                  {isLastCat ? 'Finish testing' : 'Next cat'}
                </SketchButton>
              </div>
            </>
          )}
        </motion.div>
      )}
    </section>
  );
}
