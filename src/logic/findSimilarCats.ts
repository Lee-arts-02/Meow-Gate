import type { ClosestMemoryResult } from './findClosestMemoryCat';
import type { NearestExampleInfo } from '../types';

export type SimilarityGalleryExample = {
  id: string;
  image: string;
  score: number;
  similarityLabel: ClosestMemoryResult['label'];
  sourceType?: 'initial' | 'learner';
};

export function formatSimilarityPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function formatSimilarityLabel(
  label: ClosestMemoryResult['label'],
): string {
  if (label === 'not very similar') return 'Not Very Similar';
  return label
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getWhySimilarityMessage(score: number): string {
  if (score >= 0.72) return 'This cat looks close to an example in the Memory Book.';
  if (score >= 0.52) return 'Some similar shapes.';
  return 'Not very similar.';
}

export function scoreToSimilarityLabel(score: number): ClosestMemoryResult['label'] {
  if (score >= 0.72) return 'very similar';
  if (score >= 0.52) return 'similar';
  if (score >= 0.32) return 'a little similar';
  return 'not very similar';
}

export function clueTagsFromVisualClues(clues: string[]): string[] {
  const tags = new Set<string>();

  for (const clue of clues) {
    const lower = clue.toLowerCase();
    if (lower.includes('ear')) tags.add('ears');
    if (lower.includes('eye') || lower.includes('face')) tags.add('face shape');
    if (lower.includes('whisker')) tags.add('whiskers');
    if (lower.includes('body') || lower.includes('shape') || lower.includes('leg')) {
      tags.add('body shape');
    }
    if (lower.includes('tail')) tags.add('tail');
  }

  if (tags.size === 0) {
    return ['similar shapes', 'ears', 'face shape'];
  }

  return Array.from(tags).slice(0, 4);
}

export function buildGalleryExamples(
  rankedResults: ClosestMemoryResult[],
  nearestExamples: NearestExampleInfo[] = [],
  limit = 3,
): SimilarityGalleryExample[] {
  const gallery: SimilarityGalleryExample[] = rankedResults.map((item) => ({
    id: item.example.id,
    image: item.example.image,
    score: item.score,
    similarityLabel: item.label,
    sourceType: item.example.source === 'learner-memory' ? 'learner' : 'initial',
  }));

  const seen = new Set(gallery.map((item) => item.id));

  for (const item of nearestExamples) {
    if (gallery.length >= limit) break;
    if (item.source === 'negative' || seen.has(item.id)) continue;

    gallery.push({
      id: item.id,
      image: item.image,
      score: item.similarity,
      similarityLabel:
        item.similarity >= 0.72
          ? 'very similar'
          : item.similarity >= 0.52
            ? 'similar'
            : item.similarity >= 0.32
              ? 'a little similar'
              : 'not very similar',
      sourceType: item.source === 'learner-memory' ? 'learner' : 'initial',
    });
    seen.add(item.id);
  }

  return gallery.slice(0, limit);
}
