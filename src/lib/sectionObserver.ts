/**
 * sectionObserver.ts
 * Reveals <section> elements as they scroll into view using IntersectionObserver.
 * Uses data attributes (not CSS classes) so sections remain visible if JS hasn't run.
 * Imported once in main.tsx — zero changes to any component code.
 */

const observe = () => {
  const sections = document.querySelectorAll('section');
  if (!sections.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-reveal', 'visible');
          io.unobserve(entry.target); // animate once only
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
  );

  sections.forEach((section, index) => {
    // First section (hero) is always visible — skip it
    if (index === 0) return;
    // Mark as "pending reveal" — CSS will now hide it
    section.setAttribute('data-reveal', 'pending');
    io.observe(section);
  });
};

// MutationObserver to re-run when React renders new sections (SPA route changes)
const watchForSections = () => {
  let debounce: ReturnType<typeof setTimeout>;

  const mo = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(observe, 150);
  });

  mo.observe(document.body, { childList: true, subtree: true });
};

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observe();
    watchForSections();
  });
} else {
  observe();
  watchForSections();
}

export {};
