(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (!document.body.classList.contains('brainsait-reveal-enabled') || reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  }
  const menuButton = document.querySelector('[data-bs-menu-toggle]');
  const menu = document.querySelector('[data-bs-menu]');
  if (!menuButton || !menu) return;
  const closeMenu = () => { menu.dataset.open = 'false'; menuButton.setAttribute('aria-expanded', 'false'); };
  menuButton.addEventListener('click', () => {
    const open = menu.dataset.open !== 'true';
    menu.dataset.open = String(open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeMenu(); menuButton.focus(); } });
})();
