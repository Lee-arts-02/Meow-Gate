import { motion } from 'framer-motion';
import { initialMemoryBookCats } from '../data/memoryBookCats';
import type { CatMemoryState } from '../types';
import { CatCard } from './CatCard';
import { SketchButton } from './SketchButton';

type CatMemoryBookProps = {
  memoryState: CatMemoryState;
  onContinue: () => void;
};

export function CatMemoryBook({ memoryState, onContinue }: CatMemoryBookProps) {
  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Cat Memory Book</h2>
        <p className="story-text text-ink/75">Meow Gate learns from the Memory Book.</p>
      </div>

      <div className="book-page mx-auto w-full max-w-4xl space-y-8 p-5 md:p-6">
        <div>
          <h3 className="font-display mb-3 text-lg text-ink md:text-xl">Original examples</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {initialMemoryBookCats.map((cat, i) => (
              <CatCard
                key={cat.id}
                memoryCat={cat}
                hideLabel
                rotation={[-2, 2, -1, 3, -2, 1, -1, 2, -2][i] ?? 0}
              />
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <h3 className="font-display mb-3 text-lg text-ink md:text-xl">Your new examples</h3>
          {memoryState.studentExamples.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink/20 bg-white/60 p-6 text-center text-sm text-ink/70">
              Your drawings will appear here.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {memoryState.studentExamples.map((ex, i) => (
                <CatCard key={ex.id} studentExample={ex} hideLabel rotation={[2, -2, 1][i % 3] ?? 0} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex justify-center pt-2">
        <SketchButton variant="primary" onClick={onContinue}>
          Add new examples
        </SketchButton>
      </div>
    </section>
  );
}
