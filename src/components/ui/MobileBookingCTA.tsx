/**
 * MobileBookingCTA.tsx
 * Fixed bottom bar on mobile that appears after scrolling past the hero.
 * - Never shows on /admin routes
 * - Respects safe-area-inset-bottom
 * - pointer-events: none on wrapper (only button is interactive)
 * - Disappears when booking page or near a CTA element
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from 'lucide-react';

export function MobileBookingCTA() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Don't show on admin or booking pages
  const isHidden =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/agendar');

  useEffect(() => {
    if (isHidden) {
      setVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 80% of the viewport height (past hero)
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHidden, location.pathname]);

  if (isHidden) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mobile-cta"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="false"
          className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pointer-events-none"
          style={{
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(10,10,10,0.98) 60%, transparent 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          />

          <div className="relative px-4 pt-3 pointer-events-auto">
            <Link
              to="/agendar"
              className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-colors"
              style={{ minHeight: 48, fontSize: 16 }}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              Agendar horário
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
