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

  const TRANSITION_FALLBACK = 650;

  let lastFocusedElement = null;
  let isMenuOpen = false;
  let closingTimerId = null;
  let closingHandler = null;

  function cancelClosing() {
    if (closingHandler) {
      menu.removeEventListener('transitionend', closingHandler);
      closingHandler = null;
    }
    if (closingTimerId != null) {
      window.clearTimeout(closingTimerId);
      closingTimerId = null;
    }
  }

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
    if (isMenuOpen) return;

    cancelClosing();

    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    menu.hidden = false;
    menu.removeAttribute('hidden');
    menu.setAttribute('aria-hidden', 'false');
    menu.dataset.state = 'opening';

    document.body.classList.add('menu-open');
    setExpandedState(true);
    isMenuOpen = true;

    requestAnimationFrame(() => {
      if (menu.dataset.state === 'opening') {
        menu.dataset.state = 'open';
      }
    });

    focusInitialElement();
    document.addEventListener('keydown', handleKeydown);
  }

  function closeMenu({ focusToggle = true } = {}) {
    const state = menu.dataset.state;
    if (!isMenuOpen && state !== 'opening' && state !== 'open') {
      return;
    }
    if (state === 'closing') {
      return;
    }

    cancelClosing();

    const focusShouldReturn = focusToggle;

    isMenuOpen = false;
    setExpandedState(false);
    menu.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleKeydown);

    const finalize = () => {
      cancelClosing();
      menu.hidden = true;
      menu.removeAttribute('data-state');
      document.body.classList.remove('menu-open');

      if (focusShouldReturn) {
        const focusTarget =
          lastFocusedElement && document.body.contains(lastFocusedElement)
            ? lastFocusedElement
            : toggle;

        if (focusTarget && typeof focusTarget.focus === 'function') {
          requestAnimationFrame(() => focusTarget.focus());
        }
      }

      lastFocusedElement = null;
    };

    closingHandler = (event) => {
      if (event.target !== menu || event.propertyName !== 'opacity') {
        return;
      }
      finalize();
    };

    menu.dataset.state = 'closing';
    menu.addEventListener('transitionend', closingHandler);
    closingTimerId = window.setTimeout(finalize, TRANSITION_FALLBACK);
  }

  toggle.addEventListener('click', () => {
    if (!isMenuOpen) {
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
