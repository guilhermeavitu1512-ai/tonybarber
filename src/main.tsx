import React, { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/sectionObserver';

function ThemeManager({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add dark mode by default if they want to test it (or listen to system)
    // To ensure "preto e laranja no dark mode" is visible, let's enable it if system prefers or just leave it auto.
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

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeManager>
      <App />
    </ThemeManager>
  </StrictMode>,
);
