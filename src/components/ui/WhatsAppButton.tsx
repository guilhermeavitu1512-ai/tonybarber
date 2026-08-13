/**
 * WhatsAppButton.tsx
 * Floating WhatsApp CTA button for all public pages.
 * - Only visible on public pages (not /admin)
 * - Positioned above the MobileBookingCTA bar on mobile
 * - Uses phone from settings
 */
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../lib/useSettings';

export function WhatsAppButton() {
  const location = useLocation();
  const { location: loc } = useSettings();

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  const phone = loc.whatsapp?.replace(/\D/g, '') || '';
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os serviços da Barbearia Tony.');
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-40 right-4 hidden sm:flex items-center justify-center"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: '#25D366',
        boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
      }}
    >
      {/* WhatsApp SVG Icon */}
      <svg viewBox="0 0 24 24" width="26" height="26" fill="white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </motion.a>
  );
}

// Mobile version — shown between MobileBookingCTA and bottom
export function WhatsAppButtonMobile() {
  const location = useLocation();
  const { location: loc } = useSettings();

  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname.startsWith('/agendar')) return null;

  const phone = loc.whatsapp?.replace(/\D/g, '') || '';
  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os serviços da Barbearia Tony.');
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.95 }}
      className="fixed z-40 right-4 sm:hidden flex items-center justify-center"
      style={{
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: '#25D366',
        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </motion.a>
  );
}
