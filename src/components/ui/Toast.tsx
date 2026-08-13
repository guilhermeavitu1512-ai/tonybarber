/**
 * Toast.tsx
 * Lightweight toast notification system.
 * Usage: import { useToast, Toaster } from './Toast'
 * - Add <Toaster /> once in PublicLayout or App
 * - Call toast.success('msg') / toast.error('msg') / toast.info('msg') anywhere
 */
import { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// Global state — singleton pattern (no context needed)
type Listener = (toasts: Toast[]) => void;
let _toasts: Toast[] = [];
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach(l => l([..._toasts]));
}

export const toast = {
  success(message: string) { add('success', message); },
  error(message: string)   { add('error',   message); },
  info(message: string)    { add('info',    message); },
};

function add(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, type, message }];
  notify();
  setTimeout(() => remove(id), 3500);
}

function remove(id: string) {
  _toasts = _toasts.filter(t => t.id !== id);
  notify();
}

// Icon map
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
  error:   <XCircle    className="w-4 h-4 text-red-400 shrink-0" />,
  info:    <Info       className="w-4 h-4 text-orange-400 shrink-0" />,
};

const bars: Record<ToastType, string> = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-orange-500',
};

// ToastItem component
function ToastItem({ toast: t }: { toast: Toast }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 shadow-xl min-w-[240px] max-w-[340px] overflow-hidden"
      role="alert"
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${bars[t.type]}`} />

      {icons[t.type]}

      <span className="text-sm text-white leading-snug flex-1">{t.message}</span>

      <button
        onClick={() => remove(t.id)}
        className="text-neutral-500 hover:text-white transition-colors ml-1 shrink-0"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${bars[t.type]} opacity-40`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.5, ease: 'linear' }}
      />
    </motion.div>
  );
}

// Toaster — render this once in the app
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => setToasts(t);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notificações"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
