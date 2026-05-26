import type { Scene } from '../types';

const SCENES: Scene[] = [
  'opening',
  'draw',
  'gate',
  'surprise',
  'memoryBook',
  'teach',
  'test',
];

type ProgressDotsProps = {
  scene: Scene;
};

export function ProgressDots({ scene }: ProgressDotsProps) {
  const index = SCENES.indexOf(scene);

  return (
    <div className="flex items-center gap-1.5" aria-label={`Story step ${index + 1} of ${SCENES.length}`}>
      {SCENES.map((s, i) => (
        <span
          key={s}
          className={`h-2 w-2 rounded-full border border-ink/30 transition-all ${
            i === index ? 'scale-125 bg-ink/70' : i < index ? 'bg-ink/35' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}
