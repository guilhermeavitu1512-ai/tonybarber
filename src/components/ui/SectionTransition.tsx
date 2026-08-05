/**
 * SectionTransition.tsx
 * Visual divider between sections.
 * Uses pointer-events: none so it never blocks clicks.
 *
 * Variants:
 *  - "orangeGlow" : subtle orange radial glow + gradient
 *  - "subtle"     : pure dark gradient, no color
 */

interface SectionTransitionProps {
  variant?: 'orangeGlow' | 'subtle';
  className?: string;
}

export function SectionTransition({ variant = 'orangeGlow', className = '' }: SectionTransitionProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full pointer-events-none select-none ${className}`}
      style={{ height: 80, marginTop: -40, marginBottom: -40, zIndex: 1 }}
    >
      {/* Top fade out */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        }}
      />

      {variant === 'orangeGlow' && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            maxWidth: 600,
            height: 1,
            background:
              'radial-gradient(ellipse at center, rgba(249,115,22,0.18) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
      )}
    </div>
  );
}
