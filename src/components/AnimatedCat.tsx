import { motion } from 'framer-motion';

type AnimatedCatProps = {
  imageSrc?: string;
  presetImage?: string;
  svgHtml?: string;
  size?: 'sm' | 'md' | 'lg';
  walking?: boolean;
  className?: string;
  /** Walk in from left to right; calls onWalkComplete when horizontal move finishes */
  shouldWalkIn?: boolean;
  onWalkComplete?: () => void;
};

export function AnimatedCat({
  imageSrc,
  presetImage,
  svgHtml,
  size = 'md',
  walking = false,
  className = '',
  shouldWalkIn = false,
  onWalkComplete,
}: AnimatedCatProps) {
  const svgSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 md:w-28 md:h-28',
    lg: 'w-32 h-32 md:w-40 md:h-40',
  };

  const presetSizes = {
    sm: 'preset-cat-sprite-sm',
    md: 'preset-cat-sprite',
    lg: 'preset-cat-sprite-lg',
  };

  const src = imageSrc ?? presetImage;

  if (src && shouldWalkIn) {
    const sizeClass = imageSrc
      ? size === 'sm'
        ? 'user-cat-sprite-sm'
        : size === 'lg'
          ? 'user-cat-sprite-lg'
          : 'user-cat-sprite'
      : presetSizes[size];

    return (
      <motion.div
        className={`user-cat-wrapper ${className}`}
        initial={{ x: -220 }}
        animate={{ x: 0 }}
        transition={{ duration: 2.6, ease: 'easeInOut' }}
        onAnimationComplete={onWalkComplete}
      >
        <motion.img
          src={src}
          alt="Cat"
          className={sizeClass}
          animate={{ y: [0, -6, 0, -4, 0] }}
          transition={{ y: { duration: 0.45, repeat: 6, ease: 'easeInOut' } }}
          draggable={false}
        />
      </motion.div>
    );
  }

  const walkAnimation = walking
    ? { y: [0, -6, 0, -4, 0], rotate: [0, -1.5, 0, 1.5, 0] }
    : { y: [0, -3, 0] };

  const walkTransition = walking
    ? {
        y: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' as const },
        rotate: { repeat: Infinity, duration: 0.8, ease: 'easeInOut' as const },
      }
    : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' as const };

  if (src) {
    const sizeClass = imageSrc
      ? size === 'sm'
        ? 'user-cat-sprite-sm'
        : size === 'lg'
          ? 'user-cat-sprite-lg'
          : 'user-cat-sprite'
      : presetSizes[size];

    return (
      <div className={`user-cat-wrapper ${className}`}>
        <motion.img
          src={src}
          alt="Cat"
          className={sizeClass}
          animate={walkAnimation}
          transition={walkTransition}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <motion.div
      className={`cat-sprite ${svgSizes[size]} ${className}`}
      animate={walkAnimation}
      transition={walkTransition}
    >
      {svgHtml ? (
        <div
          className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : null}
    </motion.div>
  );
}
