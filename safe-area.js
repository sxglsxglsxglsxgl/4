(function () {
  const root = document.documentElement;
  if (!root) return;

  const visual = window.visualViewport || null;
  const state = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ready: false
  };

  const cssProps = {
    top: ['--safe-area-top', '--safe-top'],
    right: ['--safe-area-right', '--safe-right'],
    bottom: ['--safe-area-bottom', '--safe-bottom'],
    left: ['--safe-area-left', '--safe-left']
  };

  let frame = null;

  function toNumber(value) {
    if (typeof value !== 'string') return 0;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  }

  function readFallbackInsets() {
    const styles = getComputedStyle(root);
    return {
      top: Math.max(
        toNumber(styles.getPropertyValue('--env-top')),
        toNumber(styles.getPropertyValue('--const-top'))
      ),
      right: Math.max(
        toNumber(styles.getPropertyValue('--env-right')),
        toNumber(styles.getPropertyValue('--const-right'))
      ),
      bottom: Math.max(
        toNumber(styles.getPropertyValue('--env-bot')),
        toNumber(styles.getPropertyValue('--const-bot'))
      ),
      left: Math.max(
        toNumber(styles.getPropertyValue('--env-left')),
        toNumber(styles.getPropertyValue('--const-left'))
      )
    };
  }

  function readVisualInsets() {
    if (!visual) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const viewportWidth = window.innerWidth || root.clientWidth || 0;
    const viewportHeight = window.innerHeight || root.clientHeight || 0;

    const top = Math.max(0, visual.offsetTop);
    const left = Math.max(0, visual.offsetLeft);

    const heightSource = viewportHeight > 0 ? viewportHeight : visual.height + visual.offsetTop;
    const widthSource = viewportWidth > 0 ? viewportWidth : visual.width + visual.offsetLeft;

    const bottom = Math.max(0, heightSource - (visual.height + visual.offsetTop));
    const right = Math.max(0, widthSource - (visual.width + visual.offsetLeft));

    return { top, right, bottom, left };
  }

  function resolve(side, fallback, candidate) {
    const previous = state[side];
    let next = Math.max(fallback, candidate);

    if (next === 0 && previous > 0) {
      next = Math.max(previous, fallback);
    }

    const threshold = 0.5;
    if (state.ready && Math.abs(next - previous) <= threshold) {
      return previous;
    }

    return next;
  }

  function applyInsets() {
    const fallback = readFallbackInsets();
    const visualInsets = readVisualInsets();

    const next = {
      top: resolve('top', fallback.top, visualInsets.top),
      right: resolve('right', fallback.right, visualInsets.right),
      bottom: resolve('bottom', fallback.bottom, visualInsets.bottom),
      left: resolve('left', fallback.left, visualInsets.left)
    };

    Object.keys(next).forEach((side) => {
      const value = next[side];
      if (!Number.isFinite(value)) return;

      const rounded = Math.max(0, Math.round(value * 100) / 100);
      if (!state.ready || Math.abs(rounded - state[side]) > 0.25) {
        cssProps[side].forEach((prop) => {
          root.style.setProperty(prop, `${rounded}px`);
        });
        state[side] = rounded;
      }
    });

    state.ready = true;
  }

  function scheduleUpdate() {
    if (frame != null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      applyInsets();
    });
  }

  applyInsets();

  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('orientationchange', () => {
    scheduleUpdate();
    setTimeout(scheduleUpdate, 250);
  });
  window.addEventListener('pageshow', () => {
    scheduleUpdate();
    setTimeout(scheduleUpdate, 150);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleUpdate();
    }
  });

  if (visual) {
    visual.addEventListener('resize', scheduleUpdate);
    visual.addEventListener('scroll', scheduleUpdate);
  }
})();
