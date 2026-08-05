/**
 * ScrollIndicator.tsx
 * Animated scroll chevron for the Hero section bottom.
 * Pulses gently to invite the user to scroll.
 * pointer-events: none — never blocks interaction.
 */
import { motion } from 'motion/react';

export function ScrollIndicator() {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none select-none flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.8 }}
    >
      <span className="text-neutral-600 text-xs tracking-widest uppercase">scroll</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-0.5"
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderBottom: '2px solid',
            borderRight: '2px solid',
            borderColor: 'rgba(249,115,22,0.5)',
            transform: 'rotate(45deg)',
            borderRadius: 2,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
