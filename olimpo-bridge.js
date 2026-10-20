(() => {
  'use strict';
  if (window.parent === window) return;
  const OLIMPO = 'https://olimpo-kayque.godinhokayque.workers.dev';
  window.addEventListener('load', () => {
    window.parent.postMessage({ type: 'olimpo:ready', app: 'atlas' }, OLIMPO);
  }, { once: true });
})();
