import type { GateResult } from '../types';

type JudgmentDetailsProps = {
  result: GateResult;
};

export function JudgmentDetails({ result }: JudgmentDetailsProps) {
  return (
    <div className="mt-3 space-y-2 border-t border-dashed border-ink/15 pt-3 text-xs text-ink/70">
      {result.visualClues.length > 0 && <p>Noticed: {result.visualClues.join(' · ')}</p>}
      {result.uncertainParts.length > 0 && <p>Unsure about: {result.uncertainParts.join(' · ')}</p>}
      <p className="italic">{result.friendlyReason}</p>
    </div>
  );
}
