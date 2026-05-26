/**
 * Builder session lifecycle: each full page load starts a fresh Cat Gate session.
 * Learner-added examples are not persisted across refreshes (React state only in builder).
 * Shared Cat City blobs (`catgate_shared_city_*` and legacy `cat-shared-city:*`) are not cleared here.
 */

import { initialMemoryBookCats } from '../data/memoryBookCats';
import { clearSessionModelSingleton } from '../ml/catKnnModel';

/** Legacy or deprecated keys that may have held learner or builder state. */
const LEGACY_BUILDER_STORAGE_KEYS = [
  'catgate_learner_examples',
  'learnerExamples',
  'catMemoryBook',
  'catGateModelState',
  'catgate_training_state',
  /** Previous builder snapshot (included learner drawings); removed on each load */
  'cat-gate-memory',
];

/**
 * Clear persisted builder artifacts and in-memory model vectors from any prior tab/HMR state.
 * Does not remove shared-city entries used by `/visit/:cityId`.
 */
export function resetSessionState(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_BUILDER_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  clearSessionModelSingleton();
}

/** Run once at app bootstrap (before React mount). */
export function runBuilderSessionStartup(): void {
  resetSessionState();
  console.log('[Cat Gate] Fresh session started. Learner examples reset.');
  console.log('[Cat Gate] initialMemoryBookCats count:', initialMemoryBookCats.length);
  console.log('[Cat Gate] learnerExamples count (builder):', 0);
  console.log('[Cat Gate] evaluationCats are not used as training data.');
}
