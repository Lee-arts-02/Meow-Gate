import type { GateResult } from '../types';

export type FeatureId = 'ears' | 'eyes' | 'whiskers' | 'face' | 'body' | 'tail';
export type FeatureState = 'found' | 'unsure' | 'not-found';

export function deriveFeatureStates(result: GateResult): Record<FeatureId, FeatureState> {
  const gateState = result.gateState ?? (result.gateOpen ? 'open' : 'pause');
  if (gateState === 'open') {
    return {
      ears: 'found',
      eyes: 'found',
      whiskers: 'found',
      face: 'found',
      body: 'found',
      tail: 'unsure',
    };
  }
  if (gateState === 'close') {
    return {
      ears: 'not-found',
      eyes: 'unsure',
      whiskers: 'not-found',
      face: 'unsure',
      body: 'not-found',
      tail: 'not-found',
    };
  }
  return {
    ears: 'found',
    eyes: 'found',
    whiskers: 'unsure',
    face: 'unsure',
    body: 'unsure',
    tail: 'not-found',
  };
}

export const FEATURE_DEFINITIONS = [
  { id: 'ears' as const, icon: '△', foundText: 'I see ears', unsureText: 'I am not sure about the ears', notFoundText: 'I do not see clear ears' },
  { id: 'eyes' as const, icon: '●', foundText: 'I see eyes', unsureText: 'I am not sure about the eyes', notFoundText: 'I do not see clear eyes' },
  { id: 'whiskers' as const, icon: '〰', foundText: 'I see whiskers', unsureText: 'I am not sure about whiskers', notFoundText: 'I do not see whiskers' },
  { id: 'face' as const, icon: '○', foundText: 'I see a face shape', unsureText: 'I am not sure about the face', notFoundText: 'I do not see a clear face' },
  { id: 'body' as const, icon: '▭', foundText: 'I see a body shape', unsureText: 'I am not sure about the body', notFoundText: 'I do not see a clear body' },
  { id: 'tail' as const, icon: '~', foundText: 'I see a tail', unsureText: 'I am not sure about the tail', notFoundText: 'I do not see a clear tail' },
];

export function featureStateText(
  feature: (typeof FEATURE_DEFINITIONS)[number],
  state: FeatureState,
): string {
  if (state === 'found') return feature.foundText;
  if (state === 'unsure') return feature.unsureText;
  return feature.notFoundText;
}
