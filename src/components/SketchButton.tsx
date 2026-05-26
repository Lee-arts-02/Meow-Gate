import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type SketchButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export function SketchButton({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}: SketchButtonProps) {
  const variants = {
    primary: 'bg-pastel-yellow/80 border-ink/80 hover:bg-pastel-yellow',
    secondary: 'bg-paper-light border-ink/60 hover:bg-pastel-blue/30',
    ghost: 'bg-transparent border-ink/30 hover:bg-ink/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`sketch-btn font-display ${variants[variant]} ${sizes[size]} ${className}`}
      whileTap={disabled ? undefined : { scale: 0.96, rotate: -0.5 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
    >
      {children}
    </motion.button>
  );
}
