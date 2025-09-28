(function () {
  const root = document.documentElement;
  const vv = window.visualViewport;

  const baseMap = {
    '--safe-top': '--safe-top-env',
    '--safe-bottom': '--safe-bottom-env',
    '--safe-left': '--safe-left-env',
    '--safe-right': '--safe-right-env'
  };

  function update() {
    const top = vv ? Math.max(0, vv.offsetTop) : null;
    const bottom = vv ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) : null;
    const left = vv ? Math.max(0, vv.offsetLeft) : null;
    const right = vv ? Math.max(0, window.innerWidth - (vv.width + vv.offsetLeft)) : null;
    const styles = getComputedStyle(root);

    function setVar(name, val) {
      if (val == null) return;
      const baseName = baseMap[name];
      const base = baseName ? parseFloat(styles.getPropertyValue(baseName)) || 0 : 0;
      const target = Math.max(base, val);
      const current = parseFloat(styles.getPropertyValue(name)) || base;
      if (Math.abs(current - target) > 0.5) {
        root.style.setProperty(name, target + 'px');
      }
    }

    setVar('--safe-top', top);
    setVar('--safe-bottom', bottom);
    setVar('--safe-left', left);
    setVar('--safe-right', right);
  }

  update();
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
  window.addEventListener('orientationchange', update);
})();
