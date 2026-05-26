import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCatModel } from '../context/CatModelContext';
import { initialMemoryBookCats } from '../data/memoryBookCats';
import type { CatMemoryState, StudentExample } from '../types';
import { CatCard } from './CatCard';
import { DrawingCanvas, type DrawingResult } from './DrawingCanvas';
import { SketchButton } from './SketchButton';

/** Memory Book originals only — not evaluation-only test cats. */
const INSPIRATION_FROM_MEMORY = initialMemoryBookCats.filter((c) => c.id !== 'standardcat').slice(0, 4);

const IDEA_CHIPS = [
  'different ears',
  'a different body shape',
  'dark fur',
  'long whiskers',
  'an accessory',
  'a side view',
  'your own idea',
] as const;

type TeachByDrawingProps = {
  memoryState: CatMemoryState;
  onSave: (state: CatMemoryState) => void;
  onContinue: () => void;
};

function newLearnerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `learner-${crypto.randomUUID()}`;
  }
  return `learner-${Date.now()}`;
}

export function TeachByDrawing({ memoryState, onSave, onContinue }: TeachByDrawingProps) {
  const {
    trainModel,
    markNeedsTraining,
    trainingStatus,
    trainingProgress,
    modelStatus,
    canTest,
    statusMessage,
  } = useCatModel();
  const [drawingOpen, setDrawingOpen] = useState(true);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [savedMessage, setSavedMessage] = useState('');

  const showTrainAgain =
    modelStatus === 'needs-training' &&
    memoryState.studentExamples.length > 0 &&
    trainingStatus === 'complete';

  const toggleIdea = (label: string) => {
    setSelectedIdeas((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleSave = (result: DrawingResult) => {
    const example: StudentExample = {
      id: newLearnerId(),
      label: 'cat',
      imageData: result.imageDataUrl,
      createdAt: Date.now(),
      source: 'learner',
    };
    const updatedExamples = [...memoryState.studentExamples, example];
    onSave({
      ...memoryState,
      studentExamples: updatedExamples,
    });
    markNeedsTraining();
    setSavedMessage('Your drawing was added to the Memory Book.');
    setDrawingOpen(false);
    setSelectedIdeas(new Set());

    if (import.meta.env.DEV) {
      console.log('[Meow Gate] Add drawing:', {
        learnerExamplesCount: updatedExamples.length,
        modelStatus: 'needs-training',
      });
    }
  };

  if (drawingOpen) {
    const hintParts =
      selectedIdeas.size > 0
        ? `Optional ideas: ${[...selectedIdeas].join(' · ')}.`
        : 'Draw any kind of cat you like.';

    return (
      <section className="flex flex-1 flex-col gap-6">
        <div className="text-center">
          <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Cats can look different.</h2>
          <p className="story-text mx-auto max-w-2xl text-ink/75">
            Meow Gate learns from the Memory Book. You can add your own drawings so it can compare new
            cats with more kinds of examples.
          </p>
        </div>

        <div>
          <p className="mb-2 text-center font-display text-sm text-ink/70">Different possibilities</p>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {INSPIRATION_FROM_MEMORY.map((cat) => (
              <div
                key={cat.id}
                className="sketch-card flex flex-col items-center gap-2 p-3 text-center"
              >
                <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-ink/15 bg-white/80 p-2">
                  <img
                    src={cat.image}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    draggable={false}
                  />
                </div>
                <p className="text-xs leading-snug text-ink/80">Another style from the Memory Book</p>
              </div>
            ))}
          </div>
          <p className="note-panel mx-auto mt-3 max-w-2xl p-3 text-center text-xs text-ink/70">
            These pictures are from the original Memory Book. Your own drawing will be saved as a new
            example there too.
          </p>
        </div>

        <div>
          <p className="mb-2 text-center font-display text-sm text-ink/80">Maybe your cat has…</p>
          <div className="flex flex-wrap justify-center gap-2">
            {IDEA_CHIPS.map((label) => (
              <button
                key={label}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs ${
                  selectedIdeas.has(label) ? 'border-ink/50 bg-pastel-blue/30' : 'border-ink/20'
                }`}
                onClick={() => toggleIdea(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <DrawingCanvas
          instruction="Draw your new Memory Book cat"
          hint={hintParts}
          compact
          doneLabel="Add this example"
          successMessage="Your drawing was added to the Memory Book."
          onDone={handleSave}
          onBack={memoryState.studentExamples.length > 0 ? () => setDrawingOpen(false) : undefined}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="text-center">
        <h2 className="font-display mb-2 text-2xl text-ink md:text-3xl">Cats can look different.</h2>
        <p className="story-text mx-auto max-w-xl text-ink/75">
          Meow Gate learns from the Memory Book. Now Meow Gate can compare new cats with your examples
          after you train it.
        </p>
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

        <div>
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
        </div>
      </div>

      {savedMessage && (
        <div className="note-panel mx-auto max-w-lg space-y-2 p-4 text-center text-sm">
          <p>{savedMessage}</p>
          <p className="text-ink/80">
            Train Meow Gate so it can compare new cats with your examples.
          </p>
        </div>
      )}

      {modelStatus === 'needs-training' && trainingStatus === 'complete' && (
        <p className="note-panel mx-auto max-w-lg p-4 text-center text-sm text-ink/80">
          Meow Gate needs to read the updated Memory Book.
        </p>
      )}

      {(trainingStatus === 'training' || trainingStatus === 'complete') && (
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-2 text-center text-sm text-ink/70">{statusMessage}</p>
          <div className="h-2 overflow-hidden rounded-full border border-ink/20 bg-paper-light">
            <motion.div className="h-full bg-pastel-blue/70" animate={{ width: `${trainingProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <SketchButton variant="secondary" onClick={() => setDrawingOpen(true)}>
          Draw another cat
        </SketchButton>
        <SketchButton
          variant="secondary"
          onClick={() => trainModel(memoryState)}
          disabled={memoryState.studentExamples.length === 0 || trainingStatus === 'training'}
        >
          {trainingStatus === 'training'
            ? 'Training…'
            : showTrainAgain
              ? 'Train Again'
              : 'Train Meow Gate'}
        </SketchButton>
        <SketchButton variant="primary" onClick={onContinue} disabled={!canTest}>
          Test the Gate
        </SketchButton>
        {!canTest && memoryState.studentExamples.length > 0 && (
          <p className="max-w-md text-center text-xs text-ink/65">Train Meow Gate before testing.</p>
        )}
      </div>
    </section>
  );
}
