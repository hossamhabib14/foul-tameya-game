'use strict';
(async function boot() {
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  Input.init(canvas);
  await loadAssets((p) => { const f = document.getElementById('lfill'); if (f) f.style.width = Math.round(p * 100) + '%'; });
  const hasSave = !!Store.load();
  const offline = loadGame();
  let pendingOffline = offline || 0;
  applySettings();
  pushOut(P, 26);
  cam.x = P.x; cam.y = P.y;
  UI.init();
  document.getElementById('loading').classList.add('done');
  G.paused = true; UI.menuActive = true; UI.showMainMenu(hasSave);
  UI.pendingOffline = pendingOffline;

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!G.paused) update(dt);
    UI.update();
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('pagehide', saveGame);
  window.G = G; // للتجربة
})();
