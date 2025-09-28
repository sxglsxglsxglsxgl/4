(function () {
  const root = document.documentElement;
  const vv = window.visualViewport;

  function update() {
    const top = vv ? Math.max(0, vv.offsetTop) : null;
    const bottom = vv
      ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      : null;
    const left = vv ? Math.max(0, vv.offsetLeft) : null;
    const right = vv
      ? Math.max(0, window.innerWidth - (vv.width + vv.offsetLeft))
      : null;

    const computed = window.getComputedStyle(root);
    const baseTop = parseFloat(computed.getPropertyValue('--safe-top-base')) || 0;
    const baseBottom =
      parseFloat(computed.getPropertyValue('--safe-bottom-base')) || 0;
    const baseLeft = parseFloat(computed.getPropertyValue('--safe-left-base')) || 0;
    const baseRight =
      parseFloat(computed.getPropertyValue('--safe-right-base')) || 0;

    function setVar(name, val) {
      if (val == null) return;
      const current = parseFloat(computed.getPropertyValue(name)) || 0;
      if (Math.abs(current - val) > 0.5) {
        root.style.setProperty(name, val + 'px');
      }
    }

    const resolvedTop = top == null ? baseTop : Math.max(baseTop, top);
    const resolvedBottom = bottom == null ? baseBottom : Math.max(baseBottom, bottom);
    const resolvedLeft = left == null ? baseLeft : Math.max(baseLeft, left);
    const resolvedRight = right == null ? baseRight : Math.max(baseRight, right);

    setVar('--safe-top', resolvedTop);
    setVar('--safe-bottom', resolvedBottom);
    setVar('--safe-left', resolvedLeft);
    setVar('--safe-right', resolvedRight);
  }

  update();
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
  window.addEventListener('orientationchange', update);
})();
