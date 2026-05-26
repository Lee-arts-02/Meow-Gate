import type { ReactNode } from 'react';
import type { ClosestMemoryResult } from '../logic/findClosestMemoryCat';
import {
  buildGalleryExamples,
  formatSimilarityLabel,
  formatSimilarityPercent,
  getWhySimilarityMessage,
  type SimilarityGalleryExample,
} from '../logic/findSimilarCats';
import type { NearestExampleInfo } from '../types';
import { formatNearestExampleLabel } from '../logic/predictGate';
import { SimilarityClueTags } from './SimilarityClueTags';
import { SimilarityExamplesGallery } from './SimilarityExamplesGallery';
import { UserMemoryOverlay } from './UserMemoryOverlay';

type WhyComparisonPanelProps = {
  targetImage: string;
  targetLabel?: string;
  closestResult: ClosestMemoryResult | null;
  rankedResults?: ClosestMemoryResult[];
  nearestExamples?: NearestExampleInfo[];
  clueTags?: string[];
  loading?: boolean;
};

function ComparisonImagePanel({
  label,
  image,
  faded = false,
  footer,
}: {
  label: string;
  image: string;
  faded?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-display text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <div className="similarity-frame flex h-[220px] w-[220px] flex-col items-center justify-center p-3">
        <img
          src={image}
          alt=""
          className={`max-h-[78%] max-w-full object-contain ${
            faded ? 'opacity-80 grayscale' : ''
          }`}
          draggable={false}
        />
        {footer && <div className="mt-2 text-center">{footer}</div>}
      </div>
    </div>
  );
}

export function WhyComparisonPanel({
  targetImage,
  targetLabel = 'Your Cat',
  closestResult,
  rankedResults = [],
  nearestExamples = [],
  clueTags = [],
  loading = false,
}: WhyComparisonPanelProps) {
  if (loading) {
    return <p className="story-text text-ink/70">Comparing with Memory Book examples…</p>;
  }

  if (!closestResult) {
    return <p className="story-text text-ink/70">Meow Gate is still preparing the comparison.</p>;
  }

  const galleryExamples: SimilarityGalleryExample[] = buildGalleryExamples(
    rankedResults.length > 0 ? rankedResults : [closestResult],
    nearestExamples,
    3,
  );

  return (
    <>
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ComparisonImagePanel label={targetLabel} image={targetImage} />

        <UserMemoryOverlay
          userImage={targetImage}
          memoryImage={closestResult.example.image}
          similarityScore={closestResult.score}
          similarityLabel={closestResult.label}
        />

        <ComparisonImagePanel
          label="Closest Memory Book example"
          image={closestResult.example.image}
          faded
          footer={
            <>
              <p className="font-display text-sm text-ink/80">
                {formatSimilarityLabel(closestResult.label)}
              </p>
              <p className="text-xs text-ink/55">{formatSimilarityPercent(closestResult.score)}</p>
              <p className="mt-1 text-[10px] text-ink/50">
                {formatNearestExampleLabel(closestResult.example)}
              </p>
            </>
          }
        />
      </div>

      <div className="mt-8">
        <h4 className="font-display mb-1 text-lg text-ink md:text-xl">
          Closest cats in the Memory Book
        </h4>
        <p className="mb-3 text-center text-sm text-ink/65">
          {getWhySimilarityMessage(closestResult.score)}
        </p>
        <SimilarityExamplesGallery examples={galleryExamples} />
      </div>

      <SimilarityClueTags tags={clueTags} />
    </>
  );
}
