import { useCatModel } from '../context/CatModelContext';
import { evaluationCats } from '../data/evaluationCats';

export function ModelStatusBanner() {
  const { debugMode, debugInfo, modelStatus } = useCatModel();
  if (!debugMode) return null;

  const leakCount = debugInfo.evaluationCatsInTraining ?? 0;
  const hasLeak = leakCount > 0;

  return (
    <div
      className={`mb-3 rounded-lg border px-3 py-3 text-xs ${
        hasLeak
          ? 'border-red-400/60 bg-red-50 text-red-900'
          : 'border-ink/20 bg-paper-light text-ink/70'
      }`}
    >
      <p className="font-display mb-2 text-sm">ML debug panel</p>

      <div className="grid gap-1 sm:grid-cols-2">
        <div>
          <p className="font-display text-[11px] uppercase tracking-wide opacity-70">
            Training examples
          </p>
          <p>Initial memory cats: {debugInfo.initialMemoryCats ?? 0}</p>
          <p>Learner-added cats: {debugInfo.learnerMemoryCats ?? 0}</p>
          <p>Negative examples: {debugInfo.negativeExamples ?? 0}</p>
          <p className={hasLeak ? 'font-display text-red-800' : ''}>
            Evaluation cats in training: {leakCount} (should be 0)
          </p>
          <p>Builder dataset status: {modelStatus}</p>
        </div>

        <div>
          <p className="font-display text-[11px] uppercase tracking-wide opacity-70">
            Evaluation-only cats
          </p>
          <ul className="list-inside list-disc">
            {evaluationCats.map((cat) => (
              <li key={cat.id}>{cat.id}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-2 opacity-80">
        Model: {debugInfo.modelStatus} · total stored {debugInfo.trainingExamples}
      </p>

      {hasLeak && (
        <p className="mt-2 font-display text-red-800">
          Warning: evaluation cats leaked into training data.
        </p>
      )}
    </div>
  );
}
