import { formatSimilarityLabel, formatSimilarityPercent } from '../logic/findSimilarCats';
import type { ClosestMemoryResult } from '../logic/findClosestMemoryCat';

type UserMemoryOverlayProps = {
  userImage: string;
  memoryImage: string;
  similarityScore: number;
  similarityLabel: ClosestMemoryResult['label'];
  title?: string;
};

export function UserMemoryOverlay({
  userImage,
  memoryImage,
  similarityScore,
  similarityLabel,
  title = 'Overlap',
}: UserMemoryOverlayProps) {
  return (
    <div className="user-memory-overlay flex flex-col items-center gap-2">
      <p className="font-display text-xs uppercase tracking-wide text-ink/50">{title}</p>
      <div className="similarity-overlay-frame relative flex h-[220px] w-[220px] items-center justify-center p-4">
        <img
          src={memoryImage}
          alt=""
          className="similarity-overlay-layer absolute max-h-[72%] max-w-[72%] object-contain opacity-45 grayscale"
          draggable={false}
        />
        <img
          src={userImage}
          alt=""
          className="similarity-overlay-layer relative z-10 max-h-[72%] max-w-[72%] object-contain"
          draggable={false}
        />
      </div>
      <p className="text-center text-xs text-ink/65">
        {formatSimilarityLabel(similarityLabel)}
        <br />
        {formatSimilarityPercent(similarityScore)}
      </p>
    </div>
  );
}
