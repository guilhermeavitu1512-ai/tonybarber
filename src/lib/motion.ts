/**
 * src/lib/motion.ts
 * Centralized Framer Motion variants for the Barbearia Tony site.
 * Import from here — never repeat animation config inline.
 */

import type { Variants, Transition } from 'motion/react';

// ── Shared easing ──────────────────────────────────────────────────────────
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Viewport settings ──────────────────────────────────────────────────────
export const viewportOnce = { once: true, amount: 0.15 } as const;
export const viewportCard  = { once: true, amount: 0.1  } as const;

// ── Base transition ────────────────────────────────────────────────────────
export const smoothTransition: Transition = { duration: 0.6, ease };
export const fastTransition:   Transition = { duration: 0.45, ease };

// ── Fade + slide up ────────────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

// ── Fade in (no movement) ──────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease } },
};

// ── Scale + fade (for images and cards) ───────────────────────────────────
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: smoothTransition },
};

// ── Slide from left (for testimonials) ────────────────────────────────────
export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

// ── Stagger container — wraps AnimatedItem children ───────────────────────
export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ── Barber card: image scale + content fade ────────────────────────────────
export const barberCard: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

// ── CTA glow (orange shadow pulse on enter) ───────────────────────────────
export const ctaGlow: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

// ── Footer fade ───────────────────────────────────────────────────────────
export const footerFade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
