import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { Scene } from '../types';
import { ProgressDots } from './ProgressDots';

type AppShellProps = {
  children: ReactNode;
  scene: Scene;
  /** When false, hides story step dots (visitor / share pages). */
  showStoryProgress?: boolean;
};

export function AppShell({ children, scene, showStoryProgress = true }: AppShellProps) {
  return (
    <div className="paper-bg min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 md:px-8">
        <header className="mb-4 flex items-center justify-between">
          <motion.div
            className="font-display text-lg tracking-tight text-ink md:text-xl"
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            Meow Gate
          </motion.div>
          {showStoryProgress ? <ProgressDots scene={scene} /> : <span className="h-2 w-2" aria-hidden />}
        </header>

        <motion.main
          key={scene}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
