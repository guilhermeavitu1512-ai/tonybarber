/**
 * AnimatedContainer.tsx
 * Wrapper div with staggerChildren — children (AnimatedItem) animate in sequence.
 */
import { motion } from 'motion/react';
import { staggerContainer, viewportCard } from '../../lib/motion';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedContainer({ children, className = '' }: AnimatedContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportCard}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
