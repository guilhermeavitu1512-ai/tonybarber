/**
 * SkeletonCard.tsx
 * Reusable skeleton loading cards for barbers, services, time slots.
 */
import { motion } from 'motion/react';

// Pulse shimmer base
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-neutral-800 rounded-lg overflow-hidden relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{ translateX: ['−100%', '200%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', repeatDelay: 0.3 }}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

// Barber card skeleton (matches LandingPage card layout)
export function BarberCardSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
      {/* Photo */}
      <Shimmer className="aspect-[4/3] w-full rounded-none" />
      {/* Content */}
      <div className="p-6 space-y-3">
        <Shimmer className="h-5 w-2/3" />
        <Shimmer className="h-3.5 w-full" />
        <Shimmer className="h-3.5 w-4/5" />
        <Shimmer className="h-4 w-1/2 mt-4" />
      </div>
    </div>
  );
}

// Booking step barber card skeleton
export function BarberRowSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
      <Shimmer className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-1/2" />
        <Shimmer className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Service row skeleton
export function ServiceRowSkeleton() {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex justify-between items-center">
      <div className="flex-1 space-y-2 mr-4">
        <Shimmer className="h-4 w-2/3" />
        <Shimmer className="h-3 w-1/2" />
      </div>
      <Shimmer className="h-5 w-16 shrink-0" />
    </div>
  );
}

// Time slot grid skeleton
export function TimeSlotsSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <Shimmer key={i} className="h-11 rounded-xl" />
      ))}
    </div>
  );
}

// Calendar skeleton
export function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex justify-between items-center">
        <Shimmer className="w-11 h-11 rounded-xl" />
        <Shimmer className="h-5 w-32" />
        <Shimmer className="w-11 h-11 rounded-xl" />
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Shimmer key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
