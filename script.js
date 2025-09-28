(function () {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('site-menu');
  if (!toggle || !menu) return;

  const menuPanel = menu.querySelector('[data-menu-focus]') || menu;
  const closeTargets = menu.querySelectorAll('[data-menu-close]');
  const menuLinks = menu.querySelectorAll('[data-menu-link]');

  const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([type="hidden"]):not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  let lastFocusedElement = null;

  function getFocusableElements() {
    return Array.from(menu.querySelectorAll(FOCUSABLE_SELECTORS.join(','))).filter((element) => {
      if (element.hasAttribute('disabled')) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      if (element.hasAttribute('hidden')) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function setExpandedState(isExpanded) {
    toggle.setAttribute('aria-expanded', String(isExpanded));
    toggle.setAttribute('aria-label', isExpanded ? 'Close menu' : 'Open menu');
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || !menu.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    trapFocus(event);
  }

  function focusInitialElement() {
    const candidates = [];
    if (menuPanel instanceof HTMLElement) {
      candidates.push(menuPanel);
    }
    candidates.push(...getFocusableElements());

    const target = candidates.find((element) => typeof element.focus === 'function');
    if (!target) return;

    requestAnimationFrame(() => {
      target.focus();
    });
  }

  function openMenu() {
    if (!menu.hidden) return;

    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    menu.hidden = false;
    menu.removeAttribute('hidden');
    menu.setAttribute('aria-hidden', 'false');

    document.body.classList.add('menu-open');
    setExpandedState(true);

    focusInitialElement();
    document.addEventListener('keydown', handleKeydown);
  }

  function closeMenu({ focusToggle = true } = {}) {
    if (menu.hidden) return;

    menu.setAttribute('aria-hidden', 'true');
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    setExpandedState(false);
    document.removeEventListener('keydown', handleKeydown);

    if (focusToggle) {
      const focusTarget =
        (lastFocusedElement && document.body.contains(lastFocusedElement)) ? lastFocusedElement : toggle;

      if (focusTarget && typeof focusTarget.focus === 'function') {
        requestAnimationFrame(() => focusTarget.focus());
      }
    }
  }

  toggle.addEventListener('click', () => {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  closeTargets.forEach((element) => {
    element.addEventListener('click', () => closeMenu());
  });

  menuLinks.forEach((link) => {
    link.addEventListener('click', () => closeMenu({ focusToggle: false }));
  });
})();
