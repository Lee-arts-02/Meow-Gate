import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCatModel } from '../context/CatModelContext';
import { evaluationCats } from '../data/evaluationCats';
import type { CatImageType, CatMemoryState, StudentExample } from '../types';
import { updateCoverageWithStudentExample } from '../logic/coverage';
import { CatCard } from './CatCard';
import { DrawingCanvas, type DrawingResult } from './DrawingCanvas';
import { SketchButton } from './SketchButton';

const INSPIRATION_CATS = evaluationCats;

const INSPIRATION_LABEL: Record<'midnight' | 'oneEar' | 'pirate' | 'round', string> = {
  midnight: 'A dark cat',
  oneEar: 'A cat with one visible ear',
  pirate: 'A cat with something surprising',
  round: 'A cat with a round body',
};

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
  evaluationCatType: Exclude<CatImageType, 'standard'>;
  onSave: (state: CatMemoryState) => void;
  onContinue: () => void;
};

export function TeachByDrawing({
  memoryState,
  evaluationCatType,
  onSave,
  onContinue,
}: TeachByDrawingProps) {
  const { trainModel, markNeedsTraining, trainingStatus, trainingProgress, canTest, statusMessage } =
    useCatModel();
  const [drawingOpen, setDrawingOpen] = useState(true);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [savedMessage, setSavedMessage] = useState('');

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
      id: `student-${Date.now()}`,
      label: 'Your cat',
      imageData: result.imageDataUrl,
      createdAt: Date.now(),
    };
    const updatedExamples = [...memoryState.studentExamples, example];
    onSave({
      studentExamples: updatedExamples,
      coverage: updateCoverageWithStudentExample(
        memoryState.coverage,
        evaluationCatType,
        updatedExamples.length,
      ),
    });
    markNeedsTraining();
    setSavedMessage('Your drawing was added to the Memory Book.');
    setDrawingOpen(false);
    setSelectedIdeas(new Set());
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
            Meow Gate has learned from the cats in its Memory Book. But cats in the world can look many
            different ways. Can you help by drawing new examples?
          </p>
        </div>

        <div>
          <p className="mb-2 text-center font-display text-sm text-ink/70">Different possibilities</p>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {INSPIRATION_CATS.map((cat) => (
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
                <p className="text-xs leading-snug text-ink/80">{INSPIRATION_LABEL[cat.type]}</p>
              </div>
            ))}
          </div>
          <p className="note-panel mx-auto mt-3 max-w-2xl p-3 text-center text-xs text-ink/70">
            These cats show different possibilities. Your own drawing will become the new Memory Book
            example.
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
      </div>
      {memoryState.studentExamples.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {memoryState.studentExamples.map((ex, i) => (
            <CatCard key={ex.id} studentExample={ex} hideLabel rotation={[2, -2, 1][i % 3] ?? 0} />
          ))}
        </div>
      )}
      {savedMessage && <p className="note-panel mx-auto max-w-lg p-4 text-center text-sm">{savedMessage}</p>}
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
          {trainingStatus === 'training' ? 'Training…' : 'Finish and train Meow Gate'}
        </SketchButton>
        <SketchButton variant="primary" onClick={onContinue} disabled={!canTest}>
          Test the Gate
        </SketchButton>
      </div>
    </section>
  );
}
