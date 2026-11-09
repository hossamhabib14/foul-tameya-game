'use strict';
(async function boot() {
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  Input.init(canvas);
  await loadAssets((p) => { const f = document.getElementById('lfill'); if (f) f.style.width = Math.round(p * 100) + '%'; });
  const offline = loadGame();
  applySettings();
  pushOut(P, 26);
  cam.x = P.x; cam.y = P.y;
  UI.init();
  document.getElementById('loading').classList.add('done');
  if (offline) { addMoney(offline); G.shown = G.money; UI.openOffline(offline); }
  else if (G.playT < 5) setTimeout(() => UI.toast('حرّك الأسطى بالجويستيك — الأكل بيتجمع لوحده'), 800);

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
