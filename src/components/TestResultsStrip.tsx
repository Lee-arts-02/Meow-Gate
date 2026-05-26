import type { GatePrediction } from '../ml/modelTypes';
import type { GateResult } from '../types';
import { TestResultCard } from './TestResultCard';

export type StripResultItem = {
  evaluationCat: { id: string; image: string };
  result: GateResult;
  prediction: GatePrediction;
};

type TestResultsStripProps = {
  results: StripResultItem[];
};

export function TestResultsStrip({ results }: TestResultsStripProps) {
  return (
    <div className="mt-6 w-full">
      <h3 className="font-display mb-2 text-center text-lg text-ink md:text-xl">Testing so far</h3>
      {results.length === 0 ? (
        <p className="text-center text-sm text-ink/65">Cats will appear here after Meow Gate checks them.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {results.map((item) => (
            <TestResultCard
              key={item.evaluationCat.id}
              evaluationCat={item.evaluationCat}
              result={item.result}
              prediction={item.prediction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
