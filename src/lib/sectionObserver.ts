/**
 * sectionObserver.ts
 * Automatically reveals <section> elements as they scroll into view.
 * Imported once in main.tsx — zero changes to any component code.
 */

const observe = () => {
  const sections = document.querySelectorAll('section');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section--visible');
          io.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach((s) => io.observe(s));
};

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observe);
} else {
  observe();
}

// Also re-observe on route changes (React SPA)
export const initSectionObserver = () => {
  // Small delay to let React render the new route's sections
  setTimeout(observe, 100);
};
