import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getStandardCatImage } from '../data/standardMemoryCats';
import type { EvaluationCat } from '../data/evaluationCats';
import { predictGateFromImage } from '../logic/predictGate';
import {
  buildMemoryExamples,
  findClosestMemoryCat,
  rankMemoryExamples,
  type ClosestMemoryResult,
} from '../logic/findClosestMemoryCat';
import { clueTagsFromVisualClues } from '../logic/findSimilarCats';
import type { CatMemoryState, GateResult } from '../types';
import { GateGuessPanel } from './GateGuessPanel';
import { JudgmentStage } from './JudgmentStage';
import { SimilarityExplanationPanel } from './SimilarityExplanationPanel';
import { SketchButton } from './SketchButton';

type SurpriseCatSceneProps = {
  userGateOpen: boolean;
  evaluationCat: EvaluationCat;
  memoryState: CatMemoryState;
  onContinue: () => void;
};

export function SurpriseCatScene({
  userGateOpen,
  evaluationCat,
  memoryState,
  onContinue,
}: SurpriseCatSceneProps) {
  const [showJudgment, setShowJudgment] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [result, setResult] = useState<GateResult | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [closestResult, setClosestResult] = useState<ClosestMemoryResult | null>(null);
  const [rankedResults, setRankedResults] = useState<ClosestMemoryResult[]>([]);

  const contrastImage = userGateOpen ? evaluationCat.image : getStandardCatImage();
  const memoryExamples = buildMemoryExamples(memoryState);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const prediction = await predictGateFromImage(contrastImage, memoryState, {
        includeLearnerExamples: false,
      });

      if (!cancelled) {
        setResult(prediction);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contrastImage, memoryState]);

  useEffect(() => {
    if (!showComparison || !result) return;

    let cancelled = false;
    setComparisonLoading(true);

    (async () => {
      const [closest, ranked] = await Promise.all([
        findClosestMemoryCat(contrastImage, memoryExamples),
        rankMemoryExamples(contrastImage, memoryExamples, 3),
      ]);

      if (!cancelled) {
        setClosestResult(closest);
        setRankedResults(ranked);
        setComparisonLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showComparison, result, contrastImage, memoryExamples]);

  const text = userGateOpen
    ? {
        lead: 'Then another cat arrives…',
        body: 'But this is also a cat.',
        question: 'Why did Meow Gate hesitate?',
        extra:
          'Meow Gate has mostly seen cats like the ones in its Memory Book. This cat may look different from those examples.',
        bubble: 'Hmm… let me look again.',
      }
    : {
        lead: 'Then another cat arrives…',
        body: 'This cat looks closer to the examples in Meow Gate\'s memory.',
        question: 'Why was this one easier?',
        extra: 'Meow Gate noticed clues that felt similar to the standard examples.',
        bubble: 'Welcome to Cat City!',
      };

  if (!result) {
    return (
      <section className="flex flex-1 flex-col gap-6">
        <p className="story-text text-center text-ink/70">Comparing with Memory Book examples…</p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <p className="story-text mb-2 text-ink/70">{text.lead}</p>
        {!showJudgment && (
          <p className="font-display text-lg text-ink/60">Watch the cat walk to Meow Gate…</p>
        )}
      </div>

      <JudgmentStage
        catImage={contrastImage}
        catAlt="Surprise cat"
        variant="preset"
        gateOpen={result.gateOpen}
        gateState={result.gateState}
        speechBubble={text.bubble}
        resetKey={`${userGateOpen}-${evaluationCat.id}`}
        onArrival={() => setShowJudgment(true)}
      >
        {showJudgment && (
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-center">
              <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">{text.body}</h2>
              <p className="font-display text-lg text-ink/80">{text.question}</p>
              <p className="story-text mt-3 text-ink/75">{text.extra}</p>
            </div>

            <GateGuessPanel result={result} showConfidenceNote={false} />

            {showComparison ? (
              <SimilarityExplanationPanel
                targetImage={contrastImage}
                targetLabel="This cat"
                closestResult={closestResult}
                rankedResults={rankedResults}
                nearestExamples={result.nearestExamples}
                knnNearestIsNotCat={result.knnNearestIsNotCat}
                clueTags={clueTagsFromVisualClues(result.visualClues)}
                gateOpens={result.gateOpen}
                hasStudentExamples={memoryState.studentExamples.length > 0}
                loading={comparisonLoading}
                onClose={() => setShowComparison(false)}
              />
            ) : (
              <div className="flex justify-center">
                <SketchButton variant="secondary" onClick={() => setShowComparison(true)}>
                  Why?
                </SketchButton>
              </div>
            )}

            <div className="flex justify-center">
              <SketchButton variant="primary" onClick={onContinue}>
                Open the Cat Memory Book
              </SketchButton>
            </div>
          </motion.div>
        )}
      </JudgmentStage>
    </section>
  );
}
