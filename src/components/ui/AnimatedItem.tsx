/**
 * AnimatedItem.tsx
 * Individual animated child — must be inside an AnimatedContainer.
 * Inherits timing from the parent's staggerChildren.
 */
import { motion } from 'motion/react';
import { fadeUp } from '../../lib/motion';

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedItem({ children, className = '' }: AnimatedItemProps) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
