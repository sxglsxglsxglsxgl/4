(function () {
  const root = document.documentElement;
  const supportsCSS = typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
  const supportsEnv = supportsCSS && CSS.supports('padding-top: env(safe-area-inset-top)');
  const supportsConstant = supportsCSS && CSS.supports('padding-top: constant(safe-area-inset-top)');

  const readExpressionPx = (expression) => {
    root.style.setProperty('--safe-area-probe', expression);
    const raw = getComputedStyle(root).getPropertyValue('--safe-area-probe').trim();
    root.style.removeProperty('--safe-area-probe');
    const px = parseFloat(raw);
    return Number.isFinite(px) ? px : 0;
  };

  const readEnvPx = (name) => {
    let value = 0;
    if (supportsEnv) {
      value = Math.max(value, readExpressionPx(`env(${name})`));
    }
    if (supportsConstant) {
      value = Math.max(value, readExpressionPx(`constant(${name})`));
    }
    return value;
  };

  const stick = (prev, next, env) => {
    if (next > 0) {
      return next;
    }
    // Когда visualViewport сообщает нули (UI браузера схлопнут),
    // удерживаем максимум из предыдущего значения и системных env()/constant().
    return Math.max(prev, env);
  };

  const vv = window.visualViewport;

  let lastTop = readEnvPx('safe-area-inset-top');
  let lastBottom = readEnvPx('safe-area-inset-bottom');
  let lastLeft = readEnvPx('safe-area-inset-left');
  let lastRight = readEnvPx('safe-area-inset-right');

  const setInset = (name, value) => {
    root.style.setProperty(name, `${value}px`);
  };

  const applyInsets = () => {
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

    // Никогда не обнуляем safe-зоны: JS, env() и гистерезис дают устойчивый максимум.
    setInset('--safe-area-top', lastTop);
    setInset('--safe-area-bottom', lastBottom);
    setInset('--safe-area-left', lastLeft);
    setInset('--safe-area-right', lastRight);
    // Поддерживаем старые переменные для совместимости существующих стилей.
    setInset('--safe-top', lastTop);
    setInset('--safe-bottom', lastBottom);
    setInset('--safe-left', lastLeft);
    setInset('--safe-right', lastRight);
  };

  let raf = null;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      applyInsets();
    });
  };

  applyInsets();

  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule);

  if (vv) {
    vv.addEventListener('resize', schedule, { passive: true });
    vv.addEventListener('scroll', schedule, { passive: true });
  }
})();
