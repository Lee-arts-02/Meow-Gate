import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  deriveFeatureStates,
  FEATURE_DEFINITIONS,
  featureStateText,
  type FeatureId,
} from '../logic/featureLens';
import type { GateResult } from '../types';

type FeatureLensProps = {
  result?: GateResult | null;
  active?: boolean;
  compact?: boolean;
};

export function FeatureLens({ result, active = false, compact = false }: FeatureLensProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const featureStates = useMemo(
    () => (result ? deriveFeatureStates(result) : null),
    [result],
  );

  useEffect(() => {
    if (!active || !featureStates) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(0);
    const timers = FEATURE_DEFINITIONS.map((_, index) =>
      window.setTimeout(() => setRevealedCount(index + 1), 350 + index * 420),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, featureStates, result]);

  if (!active) return null;

  return (
    <motion.div className={`feature-lens ${compact ? 'feature-lens--compact' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="feature-lens__title font-display text-xs uppercase tracking-wide text-ink/50">
        What Meow Gate looks for
      </p>
      <div className="feature-lens__grid">
        {FEATURE_DEFINITIONS.map((feature, index) => {
          const state = featureStates?.[feature.id as FeatureId] ?? 'unsure';
          const visible = revealedCount > index;
          return (
            <div
              key={feature.id}
              className={`feature-lens__item feature-lens__item--${
                state === 'found' ? 'found' : state === 'unsure' ? 'unsure' : 'missing'
              }`}
            >
              <span className="feature-lens__icon">{feature.icon}</span>
              <span className="feature-lens__text">
                {visible && featureStates ? featureStateText(feature, state) : `Checking ${feature.id}…`}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function FeatureSummaryIcons() {
  return (
    <div className="feature-summary-icons flex flex-wrap justify-center gap-3 text-sm text-ink/70">
      <span>△ ears</span>
      <span>● eyes</span>
      <span>〰 whiskers</span>
      <span>○ face</span>
      <span>~ tail</span>
    </div>
  );
}
