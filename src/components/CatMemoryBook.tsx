import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { standardMemoryCats } from '../data/standardMemoryCats';
import { initialMemoryBookCats } from '../data/memoryBookCats';
import {
  buildMemoryExamples,
  findClosestMemoryCat,
  rankMemoryExamples,
  type ClosestMemoryResult,
} from '../logic/findClosestMemoryCat';
import { buildGalleryExamples } from '../logic/findSimilarCats';
import type { CatMemoryState } from '../types';
import { CatCard } from './CatCard';
import { FeatureSummaryIcons } from './FeatureLens';
import { SimilarityExamplesGallery } from './SimilarityExamplesGallery';
import { SketchButton } from './SketchButton';
import { UserMemoryOverlay } from './UserMemoryOverlay';

type CatMemoryBookProps = {
  memoryState: CatMemoryState;
  onContinue: () => void;
};

export function CatMemoryBook({ memoryState, onContinue }: CatMemoryBookProps) {
  const [closestDemo, setClosestDemo] = useState<ClosestMemoryResult | null>(null);
  const [rankedDemo, setRankedDemo] = useState<ClosestMemoryResult[]>([]);
  const hasStudentExamples = memoryState.studentExamples.length > 0;

  const memoryExamples = useMemo(
    () => buildMemoryExamples(memoryState),
    [memoryState],
  );

  const demoTargetImage = initialMemoryBookCats[0]!.image;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [closest, ranked] = await Promise.all([
        findClosestMemoryCat(demoTargetImage, memoryExamples),
        rankMemoryExamples(demoTargetImage, memoryExamples, 3),
      ]);

      if (!cancelled) {
        setClosestDemo(closest);
        setRankedDemo(ranked);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [demoTargetImage, memoryExamples]);

  const demoGalleryExamples = buildGalleryExamples(rankedDemo, [], 3);

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Cat Memory Book</h2>
        <p className="story-text text-ink/75">
          These are examples Meow Gate has learned from.
        </p>
      </div>

      <div className="book-page mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {standardMemoryCats.map((cat, i) => (
            <CatCard
              key={cat.id}
              memoryCat={cat}
              hideLabel
              rotation={[-2, 2, -1, 3, -2, 1, -1, 2, -2][i] ?? 0}
            />
          ))}
        </div>

        <motion.div
          className="note-panel mt-4 space-y-3 p-4 text-sm text-ink/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="font-display text-ink/80">What do many of these cats have in common?</p>
          <FeatureSummaryIcons />
          <p className="text-center text-ink/70">
            Meow Gate may look for familiar clues like ears, eyes, whiskers, and face shape.
          </p>
        </motion.div>
      </div>

      <div className="book-page mx-auto w-full max-w-3xl p-5 md:p-6">
        <h3 className="font-display mb-2 text-lg text-ink md:text-xl">
          How Meow Gate compares cats
        </h3>
        <p className="story-text text-sm text-ink/75 md:text-base">
          This helps us see what Meow Gate may be comparing — not exactly how all AI works.
        </p>

        {closestDemo && (
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <p className="font-display text-xs uppercase tracking-wide text-ink/50">Sample cat</p>
              <div className="similarity-frame flex h-[200px] w-[200px] items-center justify-center p-3">
                <img
                  src={demoTargetImage}
                  alt="Sample cat"
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
            </div>

            <UserMemoryOverlay
              userImage={demoTargetImage}
              memoryImage={closestDemo.example.image}
              similarityScore={closestDemo.score}
              similarityLabel={closestDemo.label}
            />

            <div className="flex flex-col items-center gap-2">
              <p className="font-display text-xs uppercase tracking-wide text-ink/50">
                Closest example
              </p>
              <div className="similarity-frame flex h-[200px] w-[200px] items-center justify-center p-3">
                <img
                  src={closestDemo.example.image}
                  alt="Memory Book example"
                  className="max-h-full max-w-full object-contain opacity-80 grayscale"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        )}

        {demoGalleryExamples.length > 0 && (
          <div className="mt-6">
            <h4 className="font-display mb-1 text-base text-ink md:text-lg">
              Closest cats in the Memory Book
            </h4>
            <SimilarityExamplesGallery
              examples={demoGalleryExamples}
              caption="Meow Gate thought these looked most similar."
            />
          </div>
        )}
      </div>

      {hasStudentExamples && (
        <div className="book-page mx-auto w-full max-w-3xl">
          <h3 className="font-display mb-3 text-sm uppercase tracking-wide text-ink/60">
            Your new examples
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {memoryState.studentExamples.map((ex, i) => (
              <CatCard
                key={ex.id}
                studentExample={ex}
                hideLabel
                rotation={[2, -2, 1][i % 3] ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <SketchButton variant="primary" onClick={onContinue}>
          Draw Another Cat
        </SketchButton>
      </div>
    </section>
  );
}
