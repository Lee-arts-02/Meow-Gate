import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CatGateScene } from '../components/CatGateScene';
import { CatMemoryBook } from '../components/CatMemoryBook';
import { DrawingCanvas, type DrawingResult } from '../components/DrawingCanvas';
import { ModelStatusBanner } from '../components/ModelStatusBanner';
import { OpeningScene } from '../components/OpeningScene';
import { SequentialEvaluation } from '../components/SequentialEvaluation';
import { SurpriseCatScene } from '../components/SurpriseCatScene';
import { TeachByDrawing } from '../components/TeachByDrawing';
import { CatModelProvider, useCatModel } from '../context/CatModelContext';
import { evaluationCats } from '../data/evaluationCats';
import { getRandomEvaluationCat, type EvaluationCat } from '../data/evaluationCats';
import { getInitialMemoryState } from '../logic/coverage';
import {
  createShareState,
  saveSharedCity,
} from '../logic/shareState';
import type { CatMemoryState, GateResult, Scene } from '../types';

const RESUME_SCENE_KEY = 'cat-builder-resume-scene';

const VALID_SCENES: Scene[] = [
  'opening',
  'draw',
  'gate',
  'surprise',
  'memoryBook',
  'teach',
  'test',
];

function BuilderFlow({
  memoryState,
  setMemoryState,
}: {
  memoryState: CatMemoryState;
  setMemoryState: Dispatch<SetStateAction<CatMemoryState>>;
}) {
  const navigate = useNavigate();
  const { predictUserDrawing } = useCatModel();
  const [scene, setScene] = useState<Scene>('opening');
  const [gatePhase, setGatePhase] = useState<'walk' | 'guess'>('walk');
  const [userCatImage, setUserCatImage] = useState('');
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [userGateOpen, setUserGateOpen] = useState(false);
  const [evaluationCat] = useState<EvaluationCat>(() => getRandomEvaluationCat());

  useEffect(() => {
    const raw = sessionStorage.getItem(RESUME_SCENE_KEY);
    if (!raw || !VALID_SCENES.includes(raw as Scene)) return;
    sessionStorage.removeItem(RESUME_SCENE_KEY);
    queueMicrotask(() => {
      setScene(raw as Scene);
    });
  }, []);

  const handleDrawingDone = useCallback(
    async (result: DrawingResult) => {
      setUserCatImage(result.imageDataUrl);
      setGateResult(null);
      setScene('gate');
      setGatePhase('walk');

      const result_ = await predictUserDrawing(result.imageDataUrl, memoryState, {
        imageDataUrl: result.imageDataUrl,
        strokeCount: result.strokeCount,
        boundingBox: result.boundingBox,
      });

      setGateResult(result_);
      setUserGateOpen(result_.gateOpen);
    },
    [memoryState, predictUserDrawing],
  );

  const handleMemorySave = useCallback(
    (state: CatMemoryState) => {
      setMemoryState(state);
    },
    [setMemoryState],
  );

  const handleTestComplete = useCallback(async () => {
    const share = createShareState(memoryState);
    const cityId = await saveSharedCity(share);
    navigate(`/share/${cityId}`);
  }, [memoryState, navigate]);

  const renderScene = () => {
    switch (scene) {
      case 'opening':
        return <OpeningScene onStart={() => setScene('draw')} />;

      case 'draw':
        return (
          <DrawingCanvas
            instruction="Draw a cat who wants to enter Cat City."
            hint="Your drawing does not need to be perfect. Meow Gate will only make a guess."
            successMessage="Your cat is walking to the gate."
            onDone={handleDrawingDone}
          />
        );

      case 'gate':
        return gateResult ? (
          <CatGateScene
            userCatImage={userCatImage}
            gateResult={gateResult}
            memoryState={memoryState}
            phase={gatePhase}
            onWalkComplete={() => setGatePhase('guess')}
            onContinue={() => setScene('surprise')}
          />
        ) : (
          <p className="story-text text-center text-ink/70">
            Comparing with Memory Book examples…
          </p>
        );

      case 'surprise':
        return (
          <SurpriseCatScene
            userGateOpen={userGateOpen}
            evaluationCat={evaluationCat}
            memoryState={memoryState}
            onContinue={() => setScene('memoryBook')}
          />
        );

      case 'memoryBook':
        return (
          <CatMemoryBook memoryState={memoryState} onContinue={() => setScene('teach')} />
        );

      case 'teach':
        return (
          <TeachByDrawing
            memoryState={memoryState}
            evaluationCatType={evaluationCat.type}
            onSave={handleMemorySave}
            onContinue={() => setScene('test')}
          />
        );

      case 'test':
        return (
          <SequentialEvaluation
            evaluationCats={evaluationCats}
            memoryState={memoryState}
            onComplete={handleTestComplete}
            onAddMoreExamples={() => setScene('teach')}
            onBuildAgain={() => navigate('/new')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AppShell scene={scene} showStoryProgress>
      <ModelStatusBanner />
      <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>
    </AppShell>
  );
}

export function BuilderPage() {
  /** Session-only: learner examples are not restored after refresh (see `sessionReset.ts`). */
  const [memoryState, setMemoryState] = useState<CatMemoryState>(() => getInitialMemoryState());

  return (
    <CatModelProvider memoryState={memoryState}>
      <BuilderFlow memoryState={memoryState} setMemoryState={setMemoryState} />
    </CatModelProvider>
  );
}
