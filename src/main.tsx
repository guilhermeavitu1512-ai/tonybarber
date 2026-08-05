import React, { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function ThemeManager({ children }: { children: React.ReactNode }) {
  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  // ── Section scroll reveal ──────────────────────────────────────────────────
  // Runs after every render so it always catches newly mounted sections.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.filter = 'blur(0)';
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll<HTMLElement>('section');
    sections.forEach((section, index) => {
      // Hero section (index 0) stays visible
      if (index === 0) return;
      // Skip if already revealed
      if (section.dataset.revealed) return;

      section.dataset.revealed = 'pending';
      // Apply initial hidden state via inline style
      section.style.opacity = '0';
      section.style.transform = 'translateY(36px)';
      section.style.filter = 'blur(4px)';
      section.style.transition = 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s cubic-bezier(0.22,1,0.36,1)';
      io.observe(section);
    });

    return () => io.disconnect();
  });

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeManager>
      <App />
    </ThemeManager>
  </StrictMode>,
);
