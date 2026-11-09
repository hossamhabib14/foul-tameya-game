'use strict';
/* ===================== الرسم ===================== */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, K = 1, DPR = 1;
const cam = { x: CFG.start.x, y: CFG.start.y };

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  const cw = window.innerWidth, ch = window.innerHeight;
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  W = canvas.width = Math.round(cw * DPR); H = canvas.height = Math.round(ch * DPR);
  let nk = CFG.ZOOM * Math.min(cw / 390, ch / 844) * DPR;
  nk = Math.max(nk, W / CFG.WORLD.w, H / CFG.WORLD.h);   // لا نُظهر خارج الخريطة
  if (Math.abs(nk - K) > 1e-4) { K = nk; clearCache(); }
}

const FONT = 'Cairo,Tajawal,"Segoe UI",Tahoma,sans-serif';
function txt(s, x, y, size, fill, stroke, align) {
  ctx.font = '800 ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  try { ctx.direction = 'rtl'; } catch (_) {}
  ctx.lineJoin = 'round';
  if (stroke !== null) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = stroke || 'rgba(30,15,0,.85)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill || '#fff'; ctx.fillText(s, x, y);
}
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function shadow(x, y, w, a) {
  ctx.fillStyle = 'rgba(40,20,0,' + (a || 0.25) + ')';
  ctx.beginPath(); ctx.ellipse(x, y - 2, w * 0.5, w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
}
function imgH(cat, name, w) { const im = IMG[cat][name]; return im && im.naturalWidth ? im.naturalHeight * w / im.naturalWidth : 0; }
// صورة ثابتة، ثبات القدمين أسفل المنتصف
function drawStatic(cat, name, x, y, w, alpha) {
  const im = IMG[cat] && IMG[cat][name];
  if (!im || !im.naturalWidth) return 0;
  const h = im.naturalHeight * w / im.naturalWidth, s = (w / im.naturalWidth) * K;
  const src = s < 0.98 ? scaledCanvas(im, s) : im;
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(src, x - w / 2, y - h, w, h);
  if (alpha !== undefined && alpha < 1) ctx.globalAlpha = 1;
  return h;
}
function drawItem(name, x, y, w, alpha) { return drawStatic('food', name, x, y, w, alpha); }
function drawFx(name, cx, cy, w, alpha) {
  const im = IMG.fx[name]; if (!im || !im.naturalWidth) return;
  const h = im.naturalHeight * w / im.naturalWidth, s = (w / im.naturalWidth) * K;
  const src = s < 0.98 ? scaledCanvas(im, s) : im;
  ctx.globalAlpha = alpha === undefined ? 1 : Math.max(0, Math.min(1, alpha));
  ctx.drawImage(src, cx - w / 2, cy - h / 2, w, h); ctx.globalAlpha = 1;
}

const ROWS = {};
function rowIdx(sheet, rowName) {
  const key = sheet + ':' + rowName;
  if (ROWS[key] === undefined) ROWS[key] = ASSETS.anim[sheet].rowNames.indexOf(rowName);
  return ROWS[key];
}
function moveRow(sheet, vx, vy) {
  const a = ASSETS.anim[sheet];
  if (Math.abs(vx) > Math.abs(vy) * 0.9) { const l = vx < 0 ? a.lateral.left : a.lateral.right; return { row: l[0], flip: !!l[1] }; }
  return { row: vy > 0 ? 1 : 2, flip: false };
}
// ارسم إطارًا من شيت متحرك
function drawAnim(sheet, row, col, x, y, Ht, flip, mul) {
  const a = ASSETS.anim[sheet], im = IMG.anim[sheet];
  if (!im || !im.naturalWidth) return;
  const s = (Ht / a.standH) * (mul || 1), sc = s * K;
  const src = sc < 0.98 ? scaledCanvas(im, sc) : im;
  const kx = src.width / im.naturalWidth, ky = src.height / im.naturalHeight;
  const fw = a.fw * kx, fh = a.fh * ky, dw = a.fw * s, dh = a.fh * s;
  const dy = y - a.rowBottom[row] * s;
  const sx = Math.round(col * fw), sy = Math.round(row * fh);
  if (flip) {
    ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1);
    ctx.drawImage(src, sx, sy, Math.round(fw), Math.round(fh), -dw / 2, dy, dw, dh); ctx.restore();
  } else ctx.drawImage(src, sx, sy, Math.round(fw), Math.round(fh), x - dw / 2, dy, dw, dh);
}
// شخصية كاملة: e.sheet, e.rowName / e.moving, e.vx, e.vy, e.anim
function drawChar(e, Ht, mulOverride) {
  const sh = e.sheet, a = ASSETS.anim[sh];
  let row, flip = false, fps, mul = mulOverride || 1;
  if (e.moving) { const m = moveRow(sh, e.vx || 0, e.vy || 0); row = m.row; flip = m.flip; fps = 12; }
  else { row = rowIdx(sh, e.rowName || 'idle'); fps = e.rowName === 'work' ? 10 : 5; if (e.rowName === 'work' && CFG.WORK_SCALE[sh]) mul = CFG.WORK_SCALE[sh]; if (e.flipIdle) flip = true; }
  if (row < 0) row = 0;
  const n = Math.max(1, a.frames[row] || 1);
  const col = Math.floor((e.anim || 0) * fps) % n;
  shadow(e.x, e.y, Ht * 0.42);
  drawAnim(sh, row, col, e.x, e.y, Ht, flip, mul);
}

/* ---------- فقاعة الطلب ---------- */
function drawBubble(x, y, list, frac, mood) {
  // list: [[type,count],...]
  const iw = 46, gap = 8, w = Math.max(70, list.length * (iw + gap) + 18), h = 66;
  const bx = x - w / 2, by = y - h - 16;
  ctx.fillStyle = mood === 'angry' ? '#ff6a4d' : '#fff8ea';
  ctx.strokeStyle = '#3d2a14'; ctx.lineWidth = 4;
  rrect(bx, by, w, h, 18); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 9, by + h - 1); ctx.lineTo(x, by + h + 15); ctx.lineTo(x + 9, by + h - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 7, by + h); ctx.lineTo(x + 7, by + h); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 5; ctx.stroke();
  if (mood === 'angry') { txt('!', x, by + h / 2 + 2, 44, '#fff', '#5a1500'); }
  else {
    let cx = bx + 9 + iw / 2 + (w - 18 - list.length * (iw + gap) + gap) / 2;
    list.forEach(([t, n]) => {
      drawItem(t, cx, by + h / 2 + 18, iw);
      if (n > 1) txt('×' + String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]), cx + 16, by + h - 14, 24, '#fff', '#3d2a14');
      cx += iw + gap;
    });
  }
  if (frac !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(bx + 6, by + h + 4 - 0, w - 12, 0.1, 1);
    const bw = w - 14; ctx.fillStyle = 'rgba(40,20,0,.45)'; rrect(bx + 7, by - 11, bw, 9, 4); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7bd44f' : frac > 0.25 ? '#ffc43a' : '#ff5a3a';
    if (frac > 0.02) { rrect(bx + 7, by - 11, bw * frac, 9, 4); ctx.fill(); }
  }
}

function drawRing(z, active, itemName, scale) {
  const rx = z.r * 1.15 * (scale || 1), ry = z.r * 0.65 * (scale || 1);
  ctx.fillStyle = active ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.16)';
  ctx.strokeStyle = active ? 'rgba(255,240,170,.95)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = active ? 5 : 3;
  ctx.beginPath(); ctx.ellipse(z.x, z.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (itemName) drawItem(itemName, z.x, z.y + 12, 40, 0.75);
}

function drawProgress(x, y, frac, r) {
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(40,20,0,.55)';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffd24a';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(frac, 0, 1)); ctx.stroke();
}

function drawArrow(x, y) {
  const b = Math.sin(G.t * 5) * 10;
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#4a2a00'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 70 + b); ctx.lineTo(x + 20, y - 70 + b); ctx.lineTo(x + 20, y - 40 + b);
  ctx.lineTo(x + 38, y - 40 + b); ctx.lineTo(x, y - 6 + b); ctx.lineTo(x - 38, y - 40 + b); ctx.lineTo(x - 20, y - 40 + b);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

/* ---------- لافتة الفتح ---------- */
function drawPad(p) {
  const rx = CFG.padRx, ry = CFG.padRy;
  const pulse = 1 + Math.sin(G.t * 4) * 0.025;
  ctx.fillStyle = p.inside ? 'rgba(255,222,90,.5)' : 'rgba(255,214,70,.3)';
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * pulse, ry * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,0,.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * pulse - 10, ry * pulse - 6, 0, 0, Math.PI * 2); ctx.stroke();
  // أيقونة
  const [cat, nm] = p.def.icon;
  if (cat === 'anim') drawAnim(nm, 0, 0, p.x, p.y + 6, nm === 'helper' ? 110 : 125, false, 1);
  else {
    const iw = cat === 'vehicles' ? 130 : cat === 'props' ? 110 : 95;
    drawStatic(cat, nm, p.x, p.y + 12, iw);
  }
  // الاسم + السعر
  const words = p.def.name.split(' ');
  let l1 = p.def.name, l2 = '';
  if (words.length > 1 && p.def.name.length > 11) { const m = Math.ceil(words.length / 2); l1 = words.slice(0, m).join(' '); l2 = words.slice(m).join(' '); }
  const topY = p.y - 150;
  if (l2) { txt(l1, p.x, topY - 22, 31, '#fff'); txt(l2, p.x, topY + 12, 31, '#fff'); } else txt(l1, p.x, topY, 33, '#fff');
  const rem = Math.ceil(p.rem);
  txt(fmt(rem) + ' ج', p.x, p.y + ry * 0.55, 38, '#ffe27a');
}

/* ---------- الرسم الرئيسي ---------- */
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#d9b88b'; ctx.fillRect(0, 0, W, H);
  const tx = Math.round(W / 2 - cam.x * K), ty = Math.round(H / 2 - cam.y * K);
  ctx.setTransform(K, 0, 0, K, tx, ty);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

  // الخلفية
  const scn = IMG.scene && IMG.scene.street;
  if (scn && scn.naturalWidth) {
    const src = K < 0.98 ? scaledCanvas(scn, K) : scn;
    ctx.drawImage(src, 0, 0, CFG.WORLD.w, CFG.WORLD.h);
  }

  // طبقة الأرض
  if (G.flags.decor) drawStatic('props', 'carpet', 1290, 1000, 270);
  drawGround();

  // الكائنات المرتبة بالعمق
  const list = [];
  collectEntities(list);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.fn();

  // طبقات علوية
  drawOverlay();
  if (CFG.DEBUG) drawDebug();

  // ظل الانقطاع
  if (G.ev && G.ev.pause) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(10,10,30,.42)'; ctx.fillRect(0, 0, W, H); }
  else if (G.ev && G.ev.id === 'dust') { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(190,140,70,.2)'; ctx.fillRect(0, 0, W, H); }

  // الجويستيك (بكسل الشاشة)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (Input.active) {
    const f = DPR;
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3 * f;
    ctx.beginPath(); ctx.arc(Input.ox * f, Input.oy * f, 46 * f, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(Input.px * f, Input.py * f, 20 * f, 0, Math.PI * 2); ctx.fill();
  }
}
