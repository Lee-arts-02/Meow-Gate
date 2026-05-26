import { motion } from 'framer-motion';
import { GATE_IMAGE } from '../data/catImageDataset';
import { getStandardCatImage } from '../data/standardMemoryCats';
import { catDoodles } from '../data/catDoodles';
import { SketchButton } from './SketchButton';

type OpeningSceneProps = {
  onStart: () => void;
};

export function OpeningScene({ onStart }: OpeningSceneProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        className="relative mb-8 w-full max-w-lg"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <img
          src={GATE_IMAGE}
          alt="Meow Gate"
          className="gate-image mx-auto w-[min(320px,70vw)] object-contain bg-transparent"
        />

        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-6 w-6 opacity-40"
            style={{ left: `${15 + i * 30}%`, bottom: `${10 + i * 5}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3, delay: i * 0.8 }}
            dangerouslySetInnerHTML={{ __html: catDoodles.pawPrint }}
          />
        ))}

        <motion.img
          src={getStandardCatImage()}
          alt="Standard cat"
          className="absolute -left-2 top-8 w-14 object-contain bg-transparent md:w-16"
          animate={{ rotate: [-8, -4, -8] }}
          transition={{ repeat: Infinity, duration: 3 }}
        />
      </motion.div>

      <motion.h1
        className="font-display mb-2 text-4xl text-ink md:text-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Meow Gate
      </motion.h1>
      <p className="mb-6 text-lg text-ink/75 md:text-xl">
        Teach AI to Recognize More Kinds of Cats
      </p>

      <motion.p
        className="story-text mb-10 max-w-lg text-ink/85"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Every cat wants to visit Cat City.
        <br />
        But Meow Gate is still learning what different cats can look like.
        <br />
        Can you help it learn?
      </motion.p>

      <SketchButton onClick={onStart} variant="primary" size="lg">
        Draw a Cat
      </SketchButton>
    </section>
  );
}
