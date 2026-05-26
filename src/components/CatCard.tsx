import { motion } from 'framer-motion';
import type { MemoryBookCat } from '../data/memoryBookCats';
import type { StandardMemoryCat } from '../data/standardMemoryCats';
import type { StudentExample } from '../types';

type CatCardProps = {
  memoryCat?: StandardMemoryCat | MemoryBookCat;
  studentExample?: StudentExample;
  label?: string;
  hideLabel?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  rotation?: number;
};

function getObservationPrompt(memoryCat?: StandardMemoryCat | MemoryBookCat): string | null {
  if (!memoryCat || !('observationPrompt' in memoryCat)) return null;
  return memoryCat.observationPrompt;
}

function CatCardContent({
  memoryCat,
  studentExample,
  label,
  hideLabel,
  selected,
  note,
}: {
  memoryCat?: StandardMemoryCat | MemoryBookCat;
  studentExample?: StudentExample;
  label?: string;
  hideLabel?: boolean;
  selected?: boolean;
  note?: string | null;
}) {
  const displayLabel = label ?? ('name' in (memoryCat ?? {}) ? (memoryCat as { name?: string }).name : undefined) ?? memoryCat?.id ?? studentExample?.label ?? 'Your drawing';

  return (
    <>
      <div className="mb-2 flex h-20 items-center justify-center overflow-hidden md:h-24">
        {studentExample ? (
          <img
            src={studentExample.imageData}
            alt="Cat drawing"
            className="max-h-full max-w-full object-contain bg-transparent [filter:drop-shadow(1px_2px_0_rgba(0,0,0,0.1))]"
          />
        ) : memoryCat ? (
          <img
            src={memoryCat.image}
            alt="Cat example"
            className="max-h-full max-w-full object-contain bg-transparent"
          />
        ) : null}
      </div>
      {!hideLabel && (
        <p className="font-display text-xs text-ink/80 md:text-sm">{displayLabel}</p>
      )}
      {selected && note && (
        <motion.p
          className="mt-2 text-xs text-ink/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {note}
        </motion.p>
      )}
    </>
  );
}

export function CatCard({
  memoryCat,
  studentExample,
  label,
  hideLabel = false,
  selected = false,
  highlighted = false,
  onClick,
  rotation = 0,
}: CatCardProps) {
  const note = selected ? getObservationPrompt(memoryCat) : null;
  const className = `cat-card group text-left ${selected ? 'cat-card-selected' : ''} ${highlighted ? 'cat-card-highlight' : ''}`;

  if (onClick) {
    return (
      <motion.button
        type="button"
        className={className}
        style={{ rotate: `${rotation}deg` }}
        whileHover={{ scale: 1.04, rotate: rotation + 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <CatCardContent
          memoryCat={memoryCat}
          studentExample={studentExample}
          label={label}
          hideLabel={hideLabel}
          selected={selected}
          note={note}
        />
      </motion.button>
    );
  }

  return (
    <motion.div className={className} style={{ rotate: `${rotation}deg` }}>
      <CatCardContent
        memoryCat={memoryCat}
        studentExample={studentExample}
        label={label}
        hideLabel={hideLabel}
        selected={selected}
        note={note}
      />
    </motion.div>
  );
}
