/**
 * Shared Cat City persistence (MVP: localStorage).
 *
 * DEV NOTE: Learner drawings are stored as image data URLs and can be very large.
 * URL-encoded sharing can exceed browser limits if many drawings are included.
 * For production, upload images to Supabase/Firebase Storage and share only `cityId`.
 *
 * MVP: `saveSharedCity` / `loadSharedCity` store JSON under `catgate_shared_city_${cityId}`
 * (legacy reads also try `cat-shared-city:${cityId}`). Visitor links still only resolve on the
 * same browser until these are backed by a server.
 * Keep call sites stable when adding Supabase/Firebase.
 */

import { getInitialMemoryState } from './coverage';
import type { CatMemoryState, SharedCatCity } from '../types';

/** Primary key for saved share blobs (visitor `/visit/:cityId`). */
const SHARED_CITY_PREFIX = 'catgate_shared_city_';
/** Legacy share key — still read in `loadSharedCity` for older links. */
const LEGACY_SHARED_CITY_PREFIX = 'cat-shared-city:';

export type ShareState = SharedCatCity;

function sharedCityStorageKey(cityId: string): string {
  return `${SHARED_CITY_PREFIX}${cityId}`;
}

function legacySharedCityStorageKey(cityId: string): string {
  return `${LEGACY_SHARED_CITY_PREFIX}${cityId}`;
}

function generateCityId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `city_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function createShareState(memoryBookState: CatMemoryState): ShareState {
  return {
    cityId: '',
    createdAt: Date.now(),
    cityName: undefined,
    learnerExamples: memoryBookState.studentExamples.map((s) => ({
      id: s.id,
      image: s.imageData,
      createdAt: s.createdAt,
    })),
    version: 1,
  };
}

/** Serialize for optional URL embedding or debugging (not used for primary share in MVP). */
export function encodeShareState(shareState: ShareState): string {
  const json = JSON.stringify(shareState);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeShareState(encoded: string): ShareState {
  const json = decodeURIComponent(escape(atob(encoded)));
  return JSON.parse(json) as ShareState;
}

export async function saveSharedCity(shareState: ShareState): Promise<string> {
  const cityId = shareState.cityId || generateCityId();
  const full: ShareState = { ...shareState, cityId };
  try {
    localStorage.setItem(sharedCityStorageKey(cityId), JSON.stringify(full));
  } catch {
    // Quota or private mode — caller may still show a link; load can fail.
  }
  return cityId;
}

export async function loadSharedCity(cityId: string): Promise<ShareState | null> {
  try {
    const primary = localStorage.getItem(sharedCityStorageKey(cityId));
    if (primary) return JSON.parse(primary) as ShareState;
    const legacy = localStorage.getItem(legacySharedCityStorageKey(cityId));
    if (legacy) return JSON.parse(legacy) as ShareState;
    return null;
  } catch {
    return null;
  }
}

/** Rebuild builder Memory Book state from a share snapshot (training only, no eval cats). */
export function shareStateToMemoryState(share: ShareState): CatMemoryState {
  const base = getInitialMemoryState();
  return {
    studentExamples: share.learnerExamples.map((ex) => ({
      id: ex.id,
      label: 'Shared example',
      imageData: ex.image,
      createdAt: ex.createdAt,
    })),
    coverage: base.coverage,
  };
}

export function buildVisitUrl(cityId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/visit/${cityId}`;
}
