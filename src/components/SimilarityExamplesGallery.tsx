import type { SimilarityGalleryExample } from '../logic/findSimilarCats';
import { SimilarityExampleCard } from './SimilarityExampleCard';

type SimilarityExamplesGalleryProps = {
  examples: SimilarityGalleryExample[];
  caption?: string;
};

export function SimilarityExamplesGallery({
  examples,
  caption = 'Meow Gate thought these looked most similar.',
}: SimilarityExamplesGalleryProps) {
  if (examples.length === 0) return null;

  return (
    <div className="mt-2">
      {caption && (
        <p className="mb-3 text-center text-sm text-ink/60">{caption}</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {examples.map((example) => (
          <SimilarityExampleCard
            key={example.id}
            image={example.image}
            similarityLabel={example.similarityLabel}
            score={example.score}
            sourceType={example.sourceType}
          />
        ))}
      </div>
    </div>
  );
}
