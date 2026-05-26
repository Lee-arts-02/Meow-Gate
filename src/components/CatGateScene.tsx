import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { GATE_IMAGE } from '../data/catImageDataset';
import { catDoodles } from '../data/catDoodles';
import {
  buildMemoryExamples,
  findClosestMemoryCat,
  rankMemoryExamples,
  type ClosestMemoryResult,
} from '../logic/findClosestMemoryCat';
import { clueTagsFromVisualClues } from '../logic/findSimilarCats';
import { gateResultToGateState } from '../logic/predictGate';
import type { CatMemoryState, GateResult } from '../types';
import { AnimatedCat } from './AnimatedCat';
import { FeatureLens } from './FeatureLens';
import { JudgmentNoteBubble } from './JudgmentNoteBubble';
import { SimilarityExplanationPanel } from './SimilarityExplanationPanel';
import { SketchButton } from './SketchButton';

type CatGateSceneProps = {
  userCatImage: string;
  gateResult: GateResult;
  memoryState: CatMemoryState;
  phase: 'walk' | 'guess';
  onWalkComplete: () => void;
  onContinue: () => void;
  /** Visitor test flow: different actions instead of “Continue the story”. */
  visitorMode?: boolean;
  onVisitorWhy?: () => void;
  onVisitorTryAnother?: () => void;
  onVisitorBuildOwn?: () => void;
};

const RESULT_REVEAL_DELAY_MS = 700;

export function CatGateScene({
  userCatImage,
  gateResult,
  memoryState,
  phase,
  onWalkComplete,
  onContinue,
  visitorMode = false,
  onVisitorWhy,
  onVisitorTryAnother,
  onVisitorBuildOwn,
}: CatGateSceneProps) {
  const [walkDone, setWalkDone] = useState(phase === 'guess');
  const [gateGlow, setGateGlow] = useState(false);
  const [catEntered, setCatEntered] = useState(false);
  const [showJudgmentResult, setShowJudgmentResult] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [closestResult, setClosestResult] = useState<ClosestMemoryResult | null>(null);
  const [rankedResults, setRankedResults] = useState<ClosestMemoryResult[]>([]);

  const memoryExamples = useMemo(
    () => buildMemoryExamples(memoryState),
    [memoryState],
  );

  const clueTags = useMemo(
    () => clueTagsFromVisualClues(gateResult.visualClues),
    [gateResult.visualClues],
  );

  useEffect(() => {
    if (phase === 'walk') {
      setWalkDone(false);
      setGateGlow(false);
      setCatEntered(false);
      setShowJudgmentResult(false);
      setShowDetails(false);
      setShowComparison(false);
      setClosestResult(null);
      setRankedResults([]);
    }
  }, [phase, userCatImage]);

  const gateState = gateResultToGateState(gateResult);
  const gateOpens = gateState === 'open';

  useEffect(() => {
    if (phase === 'guess' && walkDone) {
      const glowTimer = setTimeout(() => {
        setGateGlow(true);
        if (gateOpens) {
          setTimeout(() => setCatEntered(true), 800);
        }
      }, 600);

      return () => clearTimeout(glowTimer);
    }
  }, [phase, walkDone, gateOpens]);

  useEffect(() => {
    if (!gateGlow) {
      setShowJudgmentResult(false);
      return;
    }

    const resultTimer = setTimeout(() => {
      setShowJudgmentResult(true);
    }, RESULT_REVEAL_DELAY_MS);

    return () => clearTimeout(resultTimer);
  }, [gateGlow]);

  useEffect(() => {
    if (!showComparison) return;

    let cancelled = false;
    setComparisonLoading(true);

    (async () => {
      const [closest, ranked] = await Promise.all([
        findClosestMemoryCat(userCatImage, memoryExamples),
        rankMemoryExamples(userCatImage, memoryExamples, 3),
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
  }, [showComparison, userCatImage, memoryExamples]);

  const catX = catEntered ? '72%' : walkDone ? '52%' : '8%';

  const noteText =
    phase === 'walk' ? 'The Meow Gate is looking for clues…' : 'Hmm… let me look again.';

  const showJudgmentNote = phase === 'guess' && walkDone;

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="judgment-scene relative min-h-[380px] w-full overflow-hidden rounded-[28px] border-4 border-dashed border-stone-300/80 bg-paper md:min-h-[420px] md:rounded-[32px]">
        <div className="absolute inset-0 z-10">
          <svg className="absolute inset-x-0 bottom-10 h-14 w-full" preserveAspectRatio="none">
            <path
              d="M0 40 Q200 35 400 40 T800 40"
              stroke="#2a2a2a"
              strokeWidth="1.5"
              fill="none"
              opacity="0.28"
              strokeDasharray="6 8"
            />
          </svg>

          {[12, 28, 44].map((left, i) => (
            <motion.div
              key={left}
              className="absolute h-4 w-4 opacity-20"
              style={{ left: `${left}%`, bottom: '16%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: walkDone ? 0.3 : [0, 0.25, 0] }}
              transition={{ delay: i * 0.4, duration: 2, repeat: walkDone ? 0 : Infinity }}
              dangerouslySetInnerHTML={{ __html: catDoodles.pawPrint }}
            />
          ))}

          {phase === 'guess' && walkDone && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="pointer-events-none absolute rounded-full border-2 border-ink/30"
                  style={{
                    width: 40 + i * 14,
                    height: 40 + i * 14,
                    right: `${14 + i * 2}%`,
                    bottom: `${32 + i * 4}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ delay: 0.2 + i * 0.3, duration: 2, repeat: Infinity }}
                />
              ))}

              <div className="absolute left-[38%] top-[38%] z-20 hidden -translate-x-1/2 md:block">
                <FeatureLens
                  result={gateResult}
                  active={!showJudgmentResult}
                  compact
                />
              </div>
            </>
          )}

          <motion.div
            className="user-cat-wrapper absolute bottom-[14%] z-10 md:bottom-[16%]"
            initial={{ left: '8%' }}
            animate={{ left: catX }}
            transition={{
              duration: walkDone ? (catEntered ? 1.2 : 0) : 3,
              ease: 'easeInOut',
            }}
            onAnimationComplete={() => {
              if (!walkDone && phase === 'walk') {
                setWalkDone(true);
                onWalkComplete();
              }
            }}
          >
            <AnimatedCat imageSrc={userCatImage} size="md" walking={!catEntered} />
          </motion.div>
        </div>

        <div className="absolute right-8 bottom-8 z-10 md:right-12 md:bottom-12">
          <motion.div
            className="relative"
            animate={gateGlow && gateOpens ? { scale: 1.02 } : { y: [0, -2, 0] }}
            transition={
              gateGlow && gateOpens
                ? { duration: 0.5 }
                : { repeat: Infinity, duration: 4, ease: 'easeInOut' }
            }
          >
            {gateGlow && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full blur-xl"
                style={{
                  background:
                    gateState === 'open'
                      ? 'rgba(187, 247, 208, 0.35)'
                      : gateState === 'close'
                        ? 'rgba(254, 202, 202, 0.25)'
                        : 'rgba(254, 240, 138, 0.25)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: gateOpens ? 0.8 : 0.35 }}
              />
            )}
            <img
              src={GATE_IMAGE}
              alt="Meow Gate"
              className="gate-image w-[min(240px,36vw)] max-h-[50vh] object-contain bg-transparent pointer-events-none md:w-[min(320px,38vw)]"
            />
          </motion.div>
        </div>

        <div className="absolute left-5 top-5 z-20 md:left-8 md:top-8">
          {showJudgmentNote ? (
            <>
              <div className="mb-3 md:hidden">
                <FeatureLens
                  result={gateResult}
                  active={!showJudgmentResult}
                  compact
                />
              </div>
              <JudgmentNoteBubble
              text={noteText}
              result={gateResult}
              showResult={showJudgmentResult}
              showDetails={showDetails}
              onToggleDetails={visitorMode ? undefined : () => setShowDetails(true)}
            />
            </>
          ) : (
            <motion.div
              className="judgment-note-bubble z-20 w-[min(280px,78vw)] px-4 py-3"
              initial={{ opacity: 0, scale: 0.92, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 18 }}
            >
              <p className="font-display text-sm leading-snug text-ink/85 md:text-[15px]">
                {noteText}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {showComparison && (
        <SimilarityExplanationPanel
          targetImage={userCatImage}
          targetLabel="This cat"
          closestResult={closestResult}
          rankedResults={rankedResults}
          nearestExamples={gateResult.nearestExamples}
          knnNearestIsNotCat={gateResult.knnNearestIsNotCat}
          clueTags={clueTags}
          gateOpens={gateOpens}
          hasStudentExamples={memoryState.studentExamples.length > 0}
          loading={comparisonLoading}
          onClose={() => setShowComparison(false)}
        />
      )}

      {phase === 'guess' && walkDone && showJudgmentResult && (
        <div className="flex flex-col items-center gap-3">
          {!showComparison && !visitorMode && (
            <div className="flex flex-wrap justify-center gap-3">
              <SketchButton variant="secondary" size="sm" onClick={() => setShowComparison(true)}>
                Why?
              </SketchButton>
            </div>
          )}
          {visitorMode ? (
            !showComparison && (
              <div className="flex w-full max-w-lg flex-col items-stretch gap-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {onVisitorWhy && (
                    <SketchButton variant="secondary" size="sm" onClick={onVisitorWhy}>
                      Why?
                    </SketchButton>
                  )}
                  {onVisitorTryAnother && (
                    <SketchButton variant="ghost" size="sm" onClick={onVisitorTryAnother}>
                      Try Another Cat
                    </SketchButton>
                  )}
                </div>
                {onVisitorBuildOwn && (
                  <SketchButton variant="primary" onClick={onVisitorBuildOwn}>
                    Build Your Own Cat City
                  </SketchButton>
                )}
                <p className="text-center text-xs text-ink/55">
                  Make your own Memory Book and teach your own Meow Gate.
                </p>
              </div>
            )
          ) : (
            <SketchButton variant="primary" onClick={onContinue}>
              Continue the story
            </SketchButton>
          )}
        </div>
      )}
    </section>
  );
}
