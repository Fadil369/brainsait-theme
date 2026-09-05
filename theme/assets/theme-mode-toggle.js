(function () {
  var STORAGE_KEY = 'bs-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* localStorage unavailable (private mode); toggle still works for this page view */
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      button.dataset.currentTheme = theme;
    });
    document.dispatchEvent(new CustomEvent('bs:theme-change', { detail: { theme: theme } }));
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
  }

  var SUN_ICON =
    '<svg class="bs-theme-toggle__icon bs-theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"></path></svg>';
  var MOON_ICON =
    '<svg class="bs-theme-toggle__icon bs-theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"></path></svg>';

  function buildToggleButton() {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'bs-theme-toggle';
    button.setAttribute('data-theme-toggle', '');
    button.setAttribute('aria-pressed', currentTheme() === 'light' ? 'true' : 'false');
    button.setAttribute('aria-label', 'Toggle light and dark mode');
    button.innerHTML = SUN_ICON + MOON_ICON;
    button.addEventListener('click', toggleTheme);
    return button;
  }

  function mountToggleButton() {
    if (document.querySelector('[data-theme-toggle]')) return;

    var anchor =
      document.querySelector('.dropdown-localization') || document.querySelector('.header-actions, header-actions');

    if (!anchor || !anchor.parentNode) return;

    var button = buildToggleButton();
    anchor.parentNode.insertBefore(button, anchor);
  }

  function init() {
    mountToggleButton();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', currentTheme() === 'light' ? 'true' : 'false');
      button.dataset.currentTheme = currentTheme();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
