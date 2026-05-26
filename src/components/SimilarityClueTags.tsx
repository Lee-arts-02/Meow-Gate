type SimilarityClueTagsProps = {
  tags: string[];
};

export function SimilarityClueTags({ tags }: SimilarityClueTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="font-display mb-2 text-sm text-ink/70">Meow Gate noticed</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="similarity-clue-tag text-xs md:text-sm">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
