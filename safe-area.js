(function () {
  const root = document.documentElement;

  const supportsEnv =
    typeof CSS !== 'undefined' && CSS.supports('padding-bottom: env(safe-area-inset-bottom)');
  const supportsConstant =
    typeof CSS !== 'undefined' &&
    CSS.supports('padding-bottom: constant(safe-area-inset-bottom)');
  const probeVar = '--safe-area-probe';

  const readEnvPx = (name) => {
    const read = (syntax) => {
      root.style.setProperty(probeVar, `${syntax}(${name})`);
      const raw = getComputedStyle(root).getPropertyValue(probeVar).trim();
      root.style.removeProperty(probeVar);
      const px = parseFloat(raw);
      return Number.isFinite(px) ? px : 0;
    };

    if (supportsEnv) {
      const value = read('env');
      if (value > 0) return value;
    }
    if (supportsConstant) {
      const value = read('constant');
      if (value > 0) return value;
    }
    return 0;
  };

  const setIfChanged = (name, value) => {
    const current = parseFloat(root.style.getPropertyValue(name)) || 0;
    if (Math.abs(current - value) > 0.5) {
      root.style.setProperty(name, `${value}px`);
    }
  };

  let lastTop = 0;
  let lastBottom = 0;
  let lastLeft = 0;
  let lastRight = 0;

  const stick = (prev, next, env) => {
    if (next > 0 || env <= 0) return next;
    // Нельзя мгновенно обнулять safe-inset: держим максимум между предыдущим значением и системным env().
    return Math.max(prev, env);
  };

  const calc = () => {
    const vv = window.visualViewport;

    const topFromVV = vv ? Math.max(0, vv.offsetTop) : 0;
    const leftFromVV = vv ? Math.max(0, vv.offsetLeft) : 0;
    const bottomFromVV = vv
      ? Math.max(0, window.innerHeight - vv.height - topFromVV)
      : 0;
    const rightFromVV = vv
      ? Math.max(0, window.innerWidth - vv.width - leftFromVV)
      : 0;

    const envTop = readEnvPx('safe-area-inset-top');
    const envBottom = readEnvPx('safe-area-inset-bottom');
    const envLeft = readEnvPx('safe-area-inset-left');
    const envRight = readEnvPx('safe-area-inset-right');

    const nextTop = Math.max(topFromVV, envTop);
    const nextBottom = Math.max(bottomFromVV, envBottom);
    const nextLeft = Math.max(leftFromVV, envLeft);
    const nextRight = Math.max(rightFromVV, envRight);

    lastTop = stick(lastTop, nextTop, envTop);
    lastBottom = stick(lastBottom, nextBottom, envBottom);
    lastLeft = stick(lastLeft, nextLeft, envLeft);
    lastRight = stick(lastRight, nextRight, envRight);

    setIfChanged('--safe-top', lastTop);
    setIfChanged('--safe-bottom', lastBottom);
    setIfChanged('--safe-left', lastLeft);
    setIfChanged('--safe-right', lastRight);
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
    window.visualViewport.addEventListener('resize', schedule, { passive: true });
    window.visualViewport.addEventListener('scroll', schedule, { passive: true });
  }
})();
