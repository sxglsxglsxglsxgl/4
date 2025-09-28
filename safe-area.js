(function () {
  const root = document.documentElement;
  if (!root) return;

  const visual = window.visualViewport;
  const THRESHOLD = 0.5;

  const hysteresis = {
    top: null,
    right: null,
    bottom: null,
    left: null
  };

  const lastApplied = {
    top: null,
    right: null,
    bottom: null,
    left: null
  };

  function readNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getCSSMetrics() {
    const styles = getComputedStyle(root);
    return {
      envTop: readNumber(styles.getPropertyValue('--env-top')),
      envRight: readNumber(styles.getPropertyValue('--env-right')),
      envBottom: readNumber(styles.getPropertyValue('--env-bot')),
      envLeft: readNumber(styles.getPropertyValue('--env-left')),
      constTop: readNumber(styles.getPropertyValue('--const-top')),
      constRight: readNumber(styles.getPropertyValue('--const-right')),
      constBottom: readNumber(styles.getPropertyValue('--const-bot')),
      constLeft: readNumber(styles.getPropertyValue('--const-left'))
    };
  }

  function computeVisualInsets() {
    if (!visual) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const bottom = Math.max(0, window.innerHeight - (visual.height + visual.offsetTop));
    const right = Math.max(0, window.innerWidth - (visual.width + visual.offsetLeft));

    return {
      top: Math.max(0, visual.offsetTop),
      right,
      bottom,
      left: Math.max(0, visual.offsetLeft)
    };
  }

  function stabilizeValue(side, measured, floor) {
    const previous = hysteresis[side];
    let candidate = Math.max(measured, floor, 0);

    if (previous == null) {
      hysteresis[side] = candidate;
      return candidate;
    }

    if (candidate < previous && previous - candidate > THRESHOLD) {
      const guard = Math.max(floor, 0);
      if (previous > guard) {
        candidate = previous;
      }
    }

    if (Math.abs(candidate - previous) <= THRESHOLD) {
      candidate = previous;
    } else {
      hysteresis[side] = candidate;
    }

    return candidate;
  }

  function apply() {
    const cssMetrics = getCSSMetrics();
    const vvInsets = computeVisualInsets();

    const floors = {
      top: Math.max(cssMetrics.envTop, cssMetrics.constTop),
      right: Math.max(cssMetrics.envRight, cssMetrics.constRight),
      bottom: Math.max(cssMetrics.envBottom, cssMetrics.constBottom),
      left: Math.max(cssMetrics.envLeft, cssMetrics.constLeft)
    };

    const targetValues = {
      top: stabilizeValue('top', Math.max(vvInsets.top, floors.top), floors.top),
      right: stabilizeValue('right', Math.max(vvInsets.right, floors.right), floors.right),
      bottom: stabilizeValue('bottom', Math.max(vvInsets.bottom, floors.bottom), floors.bottom),
      left: stabilizeValue('left', Math.max(vvInsets.left, floors.left), floors.left)
    };

    Object.entries(targetValues).forEach(([side, value]) => {
      const previous = lastApplied[side];
      if (previous != null && Math.abs(previous - value) <= THRESHOLD) {
        return;
      }
      lastApplied[side] = value;
      root.style.setProperty(`--safe-area-${side}`, `${value}px`);
    });
  }

  let frame = null;
  function schedule() {
    if (frame != null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      apply();
    });
  }

  apply();

  if (visual) {
    visual.addEventListener('resize', schedule);
    visual.addEventListener('scroll', schedule);
  }

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('pageshow', (event) => {
    if (event && event.persisted) {
      hysteresis.top = hysteresis.right = hysteresis.bottom = hysteresis.left = null;
      lastApplied.top = lastApplied.right = lastApplied.bottom = lastApplied.left = null;
    }
    schedule();
  });
})();
