import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  buildMemoryExamples,
  findClosestMemoryCat,
  rankMemoryExamples,
  type ClosestMemoryResult,
} from '../logic/findClosestMemoryCat';
import type { CatMemoryState, GateResult } from '../types';
import { SketchButton } from './SketchButton';

type VisitorWhyPanelProps = {
  visitorCatImage: string;
  memoryState: CatMemoryState;
  gateResult: GateResult;
  onBack: () => void;
  onBuildOwn: () => void;
};

function VisitorOverlap({ userImage, memoryImage }: { userImage: string; memoryImage: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-display text-xs uppercase tracking-wide text-ink/50">Overlap</p>
      <div className="similarity-overlay-frame relative flex h-[200px] w-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-paper-light p-3 md:h-[220px] md:w-[220px]">
        <img
          src={memoryImage}
          alt=""
          className="similarity-overlay-layer absolute max-h-[70%] max-w-[70%] object-contain opacity-40 grayscale"
          draggable={false}
        />
        <img
          src={userImage}
          alt=""
          className="similarity-overlay-layer relative z-10 max-h-[70%] max-w-[70%] object-contain"
          draggable={false}
        />
      </div>
      <p className="max-w-[14rem] text-center text-xs text-ink/60">
        Meow Gate lines up shapes from your drawing with a Memory Book cat.
      </p>
    </div>
  );
}

export function VisitorWhyPanel({
  visitorCatImage,
  memoryState,
  gateResult,
  onBack,
  onBuildOwn,
}: VisitorWhyPanelProps) {
  const memoryExamples = useMemo(() => buildMemoryExamples(memoryState), [memoryState]);
  const [closest, setClosest] = useState<ClosestMemoryResult | null>(null);
  const [ranked, setRanked] = useState<ClosestMemoryResult[]>([]);
  const [loading, setLoading] = useState(true);

  const nearestImages = useMemo(() => {
    const fromModel = (gateResult.nearestExamples ?? [])
      .filter((n) => n.source === 'initial-memory' || n.source === 'learner-memory')
      .slice(0, 4)
      .map((n) => n.image);
    return fromModel;
  }, [gateResult.nearestExamples]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([
          findClosestMemoryCat(visitorCatImage, memoryExamples),
          rankMemoryExamples(visitorCatImage, memoryExamples, 4),
        ]);
        if (!cancelled) {
          setClosest(c);
          setRanked(r);
        }
      } catch {
        if (!cancelled) {
          setClosest(null);
          setRanked([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorCatImage, memoryExamples]);

  const gallery = ranked.length > 0 ? ranked : closest ? [closest] : [];

  return (
    <motion.section
      className="book-page mx-auto flex w-full max-w-4xl flex-col gap-6 p-5 md:p-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink md:text-3xl">Why?</h2>
          <p className="story-text mt-1 max-w-xl text-ink/70">
            Here is your cat next to the Memory Book example Meow Gate noticed most.
          </p>
        </div>
        <SketchButton variant="ghost" size="sm" onClick={onBack}>
          Back
        </SketchButton>
      </div>

      {loading && (
        <p className="story-text text-center text-ink/65">Gathering Memory Book pictures…</p>
      )}

      {!loading && closest && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col items-center gap-2">
            <p className="font-display text-xs uppercase tracking-wide text-ink/50">Your cat</p>
            <div className="similarity-frame flex h-[200px] w-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 bg-white/80 p-3 md:h-[220px] md:w-[220px]">
              <img
                src={visitorCatImage}
                alt=""
                className="max-h-[78%] max-w-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          <VisitorOverlap userImage={visitorCatImage} memoryImage={closest.example.image} />

          <div className="flex flex-col items-center gap-2">
            <p className="font-display text-xs uppercase tracking-wide text-ink/50">
              Closest Memory Book cat
            </p>
            <div className="similarity-frame flex h-[200px] w-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 bg-white/80 p-3 md:h-[220px] md:w-[220px]">
              <img
                src={closest.example.image}
                alt=""
                className="max-h-[78%] max-w-full object-contain opacity-90"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {gallery.length > 0 && (
        <div>
          <h3 className="font-display mb-3 text-lg text-ink md:text-xl">Other nearby Memory Book cats</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((item) => (
              <div
                key={item.example.id}
                className="sketch-card flex aspect-square items-center justify-center p-2"
              >
                <img
                  src={item.example.image}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {nearestImages.length > 0 && gallery.length === 0 && (
        <div>
          <h3 className="font-display mb-3 text-lg text-ink">Memory Book clues</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {nearestImages.map((src, i) => (
              <div key={i} className="sketch-card flex aspect-square items-center justify-center p-2">
                <img src={src} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center gap-2 border-t border-dashed border-ink/15 pt-6">
        <SketchButton variant="primary" onClick={onBuildOwn}>
          Build Your Own Cat City
        </SketchButton>
        <p className="text-center text-xs text-ink/55">
          Make your own Memory Book and teach your own Meow Gate.
        </p>
      </div>
    </motion.section>
  );
}
