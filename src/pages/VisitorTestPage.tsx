import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CatGateScene } from '../components/CatGateScene';
import { DrawingCanvas, type DrawingResult } from '../components/DrawingCanvas';
import { SketchButton } from '../components/SketchButton';
import { VisitorWhyPanel } from '../components/VisitorWhyPanel';
import { predictUserDrawingGate } from '../logic/predictGate';
import {
  loadSharedCity,
  shareStateToMemoryState,
} from '../logic/shareState';
import type { ShareState } from '../logic/shareState';
import type { CatMemoryState, GateResult, Scene } from '../types';

type VisitorStep = 'invite' | 'draw' | 'gate' | 'why';

/** Visitor flow uses a single shell scene for layout; story dots are hidden. */
const VISITOR_SHELL_SCENE: Scene = 'opening';

export function VisitorTestPage() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const [share, setShare] = useState<ShareState | null | undefined>(undefined);
  const [memoryState, setMemoryState] = useState<CatMemoryState | null>(null);
  const [step, setStep] = useState<VisitorStep>('invite');
  const [visitorImage, setVisitorImage] = useState('');
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [gatePhase, setGatePhase] = useState<'walk' | 'guess'>('walk');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cityId) {
        setShare(null);
        setMemoryState(null);
        return;
      }
      const loaded = await loadSharedCity(cityId);
      if (cancelled) return;
      if (!loaded) {
        setShare(null);
        setMemoryState(null);
        return;
      }
      setShare(loaded);
      setMemoryState(shareStateToMemoryState(loaded));
    })();
    return () => {
      cancelled = true;
    };
  }, [cityId]);

  const goBuild = useCallback(() => {
    navigate('/new');
  }, [navigate]);

  const handleDrawingDone = useCallback(
    async (result: DrawingResult) => {
      if (!memoryState) return;
      setVisitorImage(result.imageDataUrl);
      setGateResult(null);
      setGatePhase('walk');
      setStep('gate');

      const res = await predictUserDrawingGate(
        result.imageDataUrl,
        memoryState,
        {
          imageDataUrl: result.imageDataUrl,
          strokeCount: result.strokeCount,
          boundingBox: result.boundingBox,
        },
        { includeLearnerExamples: true },
      );
      setGateResult(res);
    },
    [memoryState],
  );

  const tryAnother = useCallback(() => {
    setVisitorImage('');
    setGateResult(null);
    setGatePhase('walk');
    setStep('draw');
  }, []);

  if (share === undefined) {
    return (
      <div className="paper-bg flex min-h-screen items-center justify-center">
        <p className="font-display text-ink/70">Opening the gate…</p>
      </div>
    );
  }

  if (share === null || !memoryState) {
    return (
      <div className="paper-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-2xl text-ink">This visit link did not work</h1>
        <p className="story-text max-w-md text-ink/75">
          We could not find this Cat City. Ask your friend to share the link again.
        </p>
        <SketchButton variant="primary" onClick={goBuild}>
          Build Your Own Cat City
        </SketchButton>
      </div>
    );
  }

  return (
    <AppShell scene={VISITOR_SHELL_SCENE} showStoryProgress={false}>
      <AnimatePresence mode="wait">
        {step === 'invite' && (
          <motion.section
            key="invite"
            className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div>
              <h2 className="font-display mb-3 text-3xl text-ink md:text-4xl">Test This Cat Gate</h2>
              <p className="story-text mx-auto max-w-lg text-ink/75">
                Draw a cat and see how this Cat Gate responds.
              </p>
            </div>
            <SketchButton variant="primary" onClick={() => setStep('draw')}>
              Draw Your Cat
            </SketchButton>
          </motion.section>
        )}

        {step === 'draw' && (
          <motion.div
            key="draw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <DrawingCanvas
              instruction="Draw a cat to visit this Cat City."
              hint="Your drawing is only a test. It will not be added to the Memory Book."
              doneLabel="Done"
              onDone={handleDrawingDone}
              onBack={() => setStep('invite')}
            />
          </motion.div>
        )}

        {step === 'gate' && (
          <motion.div
            key="gate"
            className="flex flex-1 flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {gateResult ? (
              <CatGateScene
                userCatImage={visitorImage}
                gateResult={gateResult}
                memoryState={memoryState}
                phase={gatePhase}
                onWalkComplete={() => setGatePhase('guess')}
                onContinue={() => {}}
                visitorMode
                onVisitorWhy={() => setStep('why')}
                onVisitorTryAnother={tryAnother}
                onVisitorBuildOwn={goBuild}
              />
            ) : (
              <p className="story-text text-center text-ink/70">Meow Gate is thinking…</p>
            )}
          </motion.div>
        )}

        {step === 'why' && gateResult && (
          <motion.div
            key="why"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VisitorWhyPanel
              visitorCatImage={visitorImage}
              memoryState={memoryState}
              gateResult={gateResult}
              onBack={() => setStep('gate')}
              onBuildOwn={goBuild}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
