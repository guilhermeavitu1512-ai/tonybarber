/**
 * AnimatedSection.tsx
 * Wraps a <section> with a fade+slide-up entrance on scroll.
 * Uses prefers-reduced-motion via Framer Motion's useReducedMotion.
 */
import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, viewportOnce } from '../../lib/motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Override variant for different entrance styles */
  delay?: number;
  id?: string;
}

export function AnimatedSection({ children, className = '', delay = 0, id }: AnimatedSectionProps) {
  const shouldReduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const variants = shouldReduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden:  { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay } },
      };

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants}
    >
      {children}
    </motion.section>
  );
}
