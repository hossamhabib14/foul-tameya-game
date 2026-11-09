'use strict';
/* ===================== الأصول والكاش ===================== */
const IMG = {};          // IMG[cat][name] = HTMLImageElement
const Cache = { map: new Map(), k: 0 };

function loadAssets(onProgress) {
  return new Promise((resolve) => {
    const jobs = [];
    for (const cat in ASSETS) {
      IMG[cat] = {};
      for (const n in ASSETS[cat]) jobs.push([cat, n, ASSETS[cat][n].src]);
    }
    let done = 0;
    const total = jobs.length;
    if (!total) return resolve();
    jobs.forEach(([cat, n, src]) => {
      const im = new Image();
      const fin = () => { done++; onProgress && onProgress(done / total); if (done === total) resolve(); };
      im.onload = fin; im.onerror = fin;
      im.src = src;
      IMG[cat][n] = im;
    });
  });
}

// تصغير بالنصف تدريجيًا لحدة أعلى
function scaledCanvas(img, s) {
  const key = (img.src || '') + '|' + Math.round(s * 1000);
  let c = Cache.map.get(key);
  if (c) return c;
  const tw = Math.max(1, Math.round(img.naturalWidth * s));
  const th = Math.max(1, Math.round(img.naturalHeight * s));
  let src = img, w = img.naturalWidth, h = img.naturalHeight;
  while (w * 0.5 > tw && h * 0.5 > th) {
    w = Math.ceil(w / 2); h = Math.ceil(h / 2);
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const g = t.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h); src = t;
  }
  c = document.createElement('canvas'); c.width = tw; c.height = th;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, tw, th);
  Cache.map.set(key, c);
  return c;
}
function clearCache() { Cache.map.clear(); }

/* ===================== مدخلات ===================== */
const Input = {
  jx: 0, jy: 0, active: false, id: null, ox: 0, oy: 0, px: 0, py: 0, keys: {},
  init(canvas) {
    const rel = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', (e) => {
      if (this.active) return;
      Snd.init(); Snd.startMusic();
      this.active = true; this.id = e.pointerId;
      [this.ox, this.oy] = rel(e); this.px = this.ox; this.py = this.oy; this.jx = 0; this.jy = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.active || e.pointerId !== this.id) return;
      [this.px, this.py] = rel(e);
      const R = 46, dx = this.px - this.ox, dy = this.py - this.oy, d = Math.hypot(dx, dy);
      if (d > R) { this.ox += dx / d * (d - R); this.oy += dy / d * (d - R); } // مقبض عائم يتبع
      const ndx = this.px - this.ox, ndy = this.py - this.oy, nd = Math.hypot(ndx, ndy);
      const m = Math.min(1, nd / R);
      if (nd < 6) { this.jx = 0; this.jy = 0; } else { this.jx = ndx / nd * m; this.jy = ndy / nd * m; }
      e.preventDefault();
    });
    const up = (e) => { if (e.pointerId === this.id) { this.active = false; this.jx = 0; this.jy = 0; this.id = null; } };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; Snd.init(); Snd.startMusic(); if (e.key.toLowerCase() === 'm' && CFG.DEBUG) G.money += 10000; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    ['contextmenu', 'gesturestart', 'dblclick'].forEach(t => document.addEventListener(t, e => e.preventDefault()));
  },
  vec() {
    let x = this.jx, y = this.jy;
    const k = this.keys;
    const kx = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
    const ky = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);
    if (kx || ky) { const d = Math.hypot(kx, ky); x = kx / d; y = ky / d; }
    return [x, y];
  },
};

/* ===================== صوت ===================== */
const Snd = {
  ctx: null, on: true, music: true, vib: true, last: {}, mTimer: null, step: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(f, d, type, v, slide, delay) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + 0.03);
  },
  gate(name, ms) { const n = performance.now(); if (this.last[name] && n - this.last[name] < ms) return false; this.last[name] = n; return true; },
  pop() { if (this.gate('pop', 55)) this.tone(520, 0.07, 'sine', 0.1, 320); },
  thud() { if (this.gate('thud', 55)) this.tone(170, 0.09, 'triangle', 0.14, -70); },
  coin() { if (this.gate('coin', 70)) { this.tone(880, 0.07, 'square', 0.05, 400); this.tone(1320, 0.09, 'square', 0.04, 300, 0.05); } },
  ding() { this.tone(660, 0.12, 'triangle', 0.14); this.tone(990, 0.2, 'triangle', 0.14, 0, 0.1); this.tone(1320, 0.3, 'triangle', 0.12, 0, 0.2); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, 0, i * 0.12)); },
  click() { this.tone(400, 0.05, 'square', 0.06); },
  horn() { if (this.gate('horn', 3000)) { this.tone(330, 0.18, 'square', 0.04); this.tone(392, 0.18, 'square', 0.04, 0, 0.2); } },
  buzz() { this.tone(120, 0.25, 'sawtooth', 0.08, -40); },
  vibrate(ms) { if (this.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (_) {} } },
  startMusic() {
    if (this.mTimer || !this.ctx) return;
    const scale = [293.7, 311.1, 370, 392, 440, 466.2, 554.4, 587.3]; // حجاز تقريبي
    const pattern = [0, 2, 3, 2, 1, 0, 1, 3, 4, 3, 2, 1, 0, 1, 0, 0];
    this.mTimer = setInterval(() => {
      if (!this.music || !this.on || !this.ctx) return;
      const n = pattern[this.step++ % pattern.length];
      this.tone(scale[n], 0.32, 'triangle', 0.025);
      if (this.step % 4 === 0) this.tone(scale[0] / 2, 0.5, 'sine', 0.03);
    }, 380);
  },
};

/* ===================== حفظ ===================== */
const Store = {
  key: 'foul_tameya_v2',
  load() { try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  save(obj) { try { localStorage.setItem(this.key, JSON.stringify(obj)); } catch (e) {} },
  reset() { try { localStorage.removeItem(this.key); } catch (e) {} },
};

/* ===================== أدوات ===================== */
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
function fmt(n) {
  n = Math.floor(n);
  let s;
  if (n >= 1e6) s = (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  else if (n >= 1e4) s = (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
  else s = String(n);
  return s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]).replace('K', ' ألف').replace('M', ' مليون');
}
function pickWeighted(arr) {
  let t = arr.reduce((a, b) => a + b.w, 0), r = Math.random() * t;
  for (const o of arr) { r -= o.w; if (r <= 0) return o; }
  return arr[0];
}
function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
