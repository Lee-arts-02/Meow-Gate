import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { GATE_IMAGE } from '../data/catImageDataset';
import { catDoodles } from '../data/catDoodles';
import type { GateState } from '../types';

const WALK_DURATION = 2.6;
const ARRIVAL_DELAY_MS = 400;

export type JudgmentStageProps = {
  catImage: string;
  catAlt: string;
  variant?: 'user' | 'preset';
  gateOpen?: boolean;
  gateState?: GateState;
  speechBubble?: string;
  onArrival?: () => void;
  children?: React.ReactNode;
  resetKey?: string | number;
};

export function JudgmentStage({
  catImage,
  catAlt,
  variant = 'preset',
  gateOpen = false,
  gateState,
  speechBubble,
  onArrival,
  children,
  resetKey = 0,
}: JudgmentStageProps) {
  const [isWalking, setIsWalking] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [gateGlow, setGateGlow] = useState(false);
  const walkDoneRef = useRef(false);

  useEffect(() => {
    setIsWalking(true);
    setHasArrived(false);
    setGateGlow(false);
    walkDoneRef.current = false;
  }, [resetKey, catImage]);

  const handleWalkComplete = () => {
    if (walkDoneRef.current) return;
    walkDoneRef.current = true;
    setIsWalking(false);
    setTimeout(() => {
      setHasArrived(true);
      setGateGlow(true);
      onArrival?.();
    }, ARRIVAL_DELAY_MS);
  };

  const spriteClass =
    variant === 'user' ? 'user-cat-sprite' : 'preset-cat-sprite-lg';

  const resolvedGateState: GateState =
    gateState ?? (gateOpen ? 'open' : 'pause');
  const gateLabel =
    resolvedGateState === 'open'
      ? 'Gate Opens'
      : resolvedGateState === 'close'
        ? 'Gate Closes'
        : 'Gate Pauses';

  return (
    <div className="flex flex-col gap-4">
      <div className="judgment-stage relative mx-auto h-[280px] w-full max-w-4xl overflow-hidden md:h-[340px]">
        <svg className="absolute inset-x-0 bottom-8 h-12 w-full" preserveAspectRatio="none">
          <path
            d="M0 40 Q200 35 400 40 T800 40"
            stroke="#2a2a2a"
            strokeWidth="1.5"
            fill="none"
            opacity="0.25"
            strokeDasharray="6 8"
          />
        </svg>

        {[12, 28, 44].map((left, i) => (
          <motion.div
            key={left}
            className="absolute h-4 w-4"
            style={{ left: `${left}%`, bottom: '14%' }}
            animate={
              isWalking
                ? { opacity: [0, 0.35, 0], scale: [0.8, 1, 0.8] }
                : { opacity: 0.22 }
            }
            transition={{
              delay: 0.4 + i * 0.55,
              duration: 1.1,
              repeat: isWalking ? Infinity : 0,
            }}
            dangerouslySetInnerHTML={{ __html: catDoodles.pawPrint }}
          />
        ))}

        {hasArrived && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute rounded-full border-2 border-ink/25"
                style={{
                  width: 36 + i * 12,
                  height: 36 + i * 12,
                  right: `${18 + i * 2}%`,
                  bottom: `${28 + i * 4}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.65, 0.35] }}
                transition={{ delay: 0.2 + i * 0.25, duration: 2, repeat: Infinity }}
              />
            ))}
          </>
        )}

        <div className="absolute bottom-6 right-[4%] md:right-[8%]">
          <motion.div className="relative">
            {gateGlow && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full blur-xl"
                style={{
                  background:
                    resolvedGateState === 'open'
                      ? 'rgba(187, 247, 208, 0.35)'
                      : resolvedGateState === 'close'
                        ? 'rgba(254, 202, 202, 0.25)'
                        : 'rgba(254, 240, 138, 0.25)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: resolvedGateState === 'open' ? 0.85 : 0.35 }}
              />
            )}
            <img
              src={GATE_IMAGE}
              alt="Meow Gate"
              className="gate-image w-[min(280px,38vw)] max-h-[55vh] object-contain bg-transparent pointer-events-none md:w-[min(340px,42vw)]"
            />
            {hasArrived && (
              <motion.p
                className="absolute bottom-[6%] left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-ink/60 md:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {gateLabel}
              </motion.p>
            )}
          </motion.div>
        </div>

        <motion.div
          key={`walk-${resetKey}`}
          className="user-cat-wrapper absolute bottom-12 md:bottom-14"
          initial={{ left: '-20%' }}
          animate={{ left: '40%' }}
          transition={{ duration: WALK_DURATION, ease: 'easeInOut' }}
          onAnimationComplete={handleWalkComplete}
        >
          <motion.img
            src={catImage}
            alt={catAlt}
            className={spriteClass}
            animate={{ y: isWalking ? [0, -6, 0, -4, 0] : [0, -2, 0] }}
            transition={
              isWalking
                ? {
                    y: {
                      duration: 0.45,
                      repeat: Math.ceil(WALK_DURATION / 0.45),
                      ease: 'easeInOut',
                    },
                  }
                : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
            }
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="thought-bubble absolute left-[4%] top-[8%] max-w-[180px] px-3 py-2 text-sm md:max-w-[220px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {hasArrived && speechBubble
            ? speechBubble
            : isWalking
              ? 'The Meow Gate is looking for clues…'
              : speechBubble ?? 'Hmm… let me look again.'}
        </motion.div>
      </div>

      {hasArrived && children}
    </div>
  );
}

export { WALK_DURATION, ARRIVAL_DELAY_MS };
