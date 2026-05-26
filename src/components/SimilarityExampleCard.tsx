import { formatSimilarityLabel, formatSimilarityPercent } from '../logic/findSimilarCats';
import type { SimilarityGalleryExample } from '../logic/findSimilarCats';

type SimilarityExampleCardProps = {
  image: string;
  similarityLabel: SimilarityGalleryExample['similarityLabel'];
  score: number;
  sourceType?: 'initial' | 'learner';
};

function sourceCaption(sourceType?: 'initial' | 'learner'): string | null {
  if (sourceType === 'learner') return 'Your example';
  return null;
}

export function SimilarityExampleCard({
  image,
  similarityLabel,
  score,
  sourceType,
}: SimilarityExampleCardProps) {
  const caption = sourceCaption(sourceType);

  return (
    <div className="similarity-sticker-card rounded-[24px] border-2 border-stone-300 bg-[#fffdf5] p-4 shadow-sm">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[18px] bg-transparent">
        <img
          src={image}
          alt=""
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>
      <div className="mt-3 text-center">
        <div className="font-display text-base text-ink/85 md:text-lg">
          {formatSimilarityLabel(similarityLabel)}
        </div>
        <div className="text-sm text-ink/60">{formatSimilarityPercent(score)}</div>
        {caption && (
          <div className="mt-1 text-[11px] uppercase tracking-wide text-ink/45">{caption}</div>
        )}
      </div>
    </div>
  );
}

export type { SimilarityExampleCardProps };
