(function () {
  const root = document.documentElement;
  if (!root) return;

  const supportsEnv =
    typeof CSS !== 'undefined' &&
    CSS.supports('padding-bottom: env(safe-area-inset-bottom)');
  const supportsConstant =
    typeof CSS !== 'undefined' &&
    CSS.supports('padding-bottom: constant(safe-area-inset-bottom)');

  const readComputedPx = (prop) => {
    const raw = window.getComputedStyle(root).getPropertyValue(prop).trim();
    const numeric = parseFloat(raw);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const probeName = '--_safe-area-probe';

  const readEnvPx = (token) => {
    if (!supportsEnv) return 0;
    root.style.setProperty(probeName, `env(${token})`);
    const value = readComputedPx(probeName);
    root.style.removeProperty(probeName);
    return value;
  };

  const readConstantPx = (token) => {
    if (!supportsConstant) return 0;
    root.style.setProperty(probeName, `constant(${token})`);
    const value = readComputedPx(probeName);
    root.style.removeProperty(probeName);
    return value;
  };

  let lastTop = 0;
  let lastBottom = 0;
  let lastLeft = 0;
  let lastRight = 0;

  const stick = (previous, next, floor) => {
    if (next > 0) return next;
    // When visualViewport collapses browser chrome it can momentarily report
    // zero insets; keep the larger of the last real value and the system
    // fallback instead of wiping padding to 0 and exposing unsafe areas.
    return Math.max(previous, floor);
  };

  const calc = () => {
    const vv = window.visualViewport;

    const topFromVV = vv ? Math.max(0, vv.offsetTop) : 0;
    const leftFromVV = vv ? Math.max(0, vv.offsetLeft) : 0;
    const chromeGapY = vv
      ? Math.max(0, window.innerHeight - vv.height - topFromVV)
      : 0;
    const chromeGapX = vv
      ? Math.max(0, window.innerWidth - vv.width - leftFromVV)
      : 0;

    const envTop = readEnvPx('safe-area-inset-top');
    const envBottom = readEnvPx('safe-area-inset-bottom');
    const envLeft = readEnvPx('safe-area-inset-left');
    const envRight = readEnvPx('safe-area-inset-right');

    const constantTop = readConstantPx('safe-area-inset-top');
    const constantBottom = readConstantPx('safe-area-inset-bottom');
    const constantLeft = readConstantPx('safe-area-inset-left');
    const constantRight = readConstantPx('safe-area-inset-right');

    const floorTop = Math.max(envTop, constantTop);
    const floorBottom = Math.max(envBottom, constantBottom);
    const floorLeft = Math.max(envLeft, constantLeft);
    const floorRight = Math.max(envRight, constantRight);

    const nextTop = Math.max(topFromVV, floorTop);
    const nextBottom = Math.max(chromeGapY, floorBottom);
    const nextLeft = Math.max(leftFromVV, floorLeft);
    const nextRight = Math.max(chromeGapX, floorRight);

    lastTop = stick(lastTop, nextTop, floorTop);
    lastBottom = stick(lastBottom, nextBottom, floorBottom);
    lastLeft = stick(lastLeft, nextLeft, floorLeft);
    lastRight = stick(lastRight, nextRight, floorRight);

    root.style.setProperty('--safe-area-top', `${lastTop}px`);
    root.style.setProperty('--safe-area-bottom', `${lastBottom}px`);
    root.style.setProperty('--safe-area-left', `${lastLeft}px`);
    root.style.setProperty('--safe-area-right', `${lastRight}px`);
  };

  let raf = null;
  const schedule = () => {
    if (raf != null) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      calc();
    });
  };

  calc();

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });

  if (window.visualViewport) {
    visualViewport.addEventListener('resize', schedule, { passive: true });
    visualViewport.addEventListener('scroll', schedule, { passive: true });
  }
})();
