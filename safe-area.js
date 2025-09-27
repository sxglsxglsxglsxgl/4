(function () {
  const root = document.documentElement;
  const vv = window.visualViewport;

  function update() {
    const top = vv ? Math.max(0, vv.offsetTop) : null;
    const bottom = vv ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) : null;
    const left = vv ? Math.max(0, vv.offsetLeft) : null;
    const right = vv ? Math.max(0, window.innerWidth - (vv.width + vv.offsetLeft)) : null;

    function setVar(name, val) {
      if (val == null) return;
      const current = parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
      if (Math.abs(current - val) > 0.5) {
        root.style.setProperty(name, val + 'px');
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
