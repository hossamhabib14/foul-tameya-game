'use strict';
/* ===================== حالة اللعبة ===================== */
const SW = new Set(['sandwich_foul', 'sandwich_tameya', 'sandwich_fries', 'sandwich_eggplant']);
const ING = new Set(['bread', 'bowl_foul', 'tameya_balls', 'fries', 'eggplant_plate']);
const F2S = CFG.fillToSandwich;

const G = {
  t: 0, playT: 0, money: 0, shown: 0, fame: 0, level: 1, padIdx: 0, paused: false,
  businessUnlocked: {}, businessProgress: {}, businessStock: {}, businessCustomers: [], businessSpawnT: 3, businessWorkerProgress:{}, businessWorkerUnlocked:{}, // STUDIO_V16_WORKERS
  up: { speed: 0, cap: 0, prep: 0, price: 0, pat: 0, ccap: 0, work: 0 },
  flags: { chain: false, tameya: false, fries: false, eggplant: false, carrier: false, cleaner: false, cook: false, cashier: false, decor: false, window: false, rack: false, branch: false, trash: false },
  tablesUnlocked: 0, boostUntil: 0, boostCd: 0, ev: null, nextEv: CFG.events.first, spawnT: 1,
  ipm: 0, earned: 0, earnT: 0, saveT: 0, settings: { sound: true, music: true, vib: true },
  bags: 0, toastDone: {}, servedTotal: 0, dailyDate: '', dailyDishes: 0, dailyHappy: 0,
};

const P = { x: CFG.start.x, y: CFG.start.y, vx: 0, vy: 0, moving: false, stack: [], pt: 0, workT: 0, anim: 0, sheet: 'vendor', rowName: 'idle', sway: 0, cleanT: 0, trashT: 0, catT: 0 };

// المحطات
const S = {};
for (const k in CFG.stations) S[k] = Object.assign({ key: k, unlocked: false, out: [], prog: 0 }, CFG.stations[k]);
S.foul.unlocked = true;
S.wrap.bread = 0; S.wrap.fill = {}; S.wrap.fillTotal = 0; S.wrap.crafting = null;

// الكاونتر
const C = { items: [], queue: [], pile: 0, collectT: 0 };
// الترابيزات
const T = CFG.tables.map((d, i) => ({
  id: i, def: d, x: d.x, y: d.y, w: d.w, unlocked: false, dirty: false, served: 0, clean: 0,
  seats: d.seats.map(s => ({ x: d.x + s[0], y: d.y + s[1], c: null })),
}));
const CUS = [];
const BAZ = { active: false, x: 0, y: 0, vx: 0, vy: 1, moving: false, sheet: 'police', rowName: 'idle', state: 'idle', nextAt: 105, anim: 0, shake: 0, reactionT: 0 };

const WK = { carrier: null, cleaner: null, cook: null, cashier: null };
const VEH = [];
const FLY = [], FLO = [], FXS = [];
let PAD = null;
let BLOCKS = [];
let custId = 1;

/* ===================== قيم مشتقة ===================== */
const playerSpeed = () => CFG.player.speed + G.up.speed * CFG.player.speedPerLvl;
const playerCap = () => CFG.player.cap + G.up.cap;
const prepMul = () => Math.max(0.35, 1 - 0.06 * G.up.prep);
const priceMul = () => 1 + 0.12 * G.up.price;
const patienceBase = () => CFG.customers.patience + 2.5 * G.up.pat;
const counterCap = () => CFG.counter.cap + CFG.counter.capPerLvl * G.up.ccap + (G.flags.rack ? 6 : 0);
const workerMul = () => (1 + CFG.workers.speedPerLvl * G.up.work) * (G.ev && G.ev.workers ? G.ev.workers : 1);
const boostMul = () => (G.t < G.boostUntil ? CFG.bonus.mult : 1);
const evMul = (k) => (G.ev && G.ev[k] !== undefined ? G.ev[k] : 1);
const levelFromFame = (f) => 1 + Math.floor(Math.sqrt(f / CFG.fameLevelDiv));
function upCost(u) { return Math.round(u.base * Math.pow(CFG.upgGrowth, G.up[u.k])); }
function allowedProducts() {
  const a = ['sandwich_foul'];
  if (S.tameya.unlocked) a.push('sandwich_tameya');
  if (S.fries.unlocked) a.push('sandwich_fries');
  if (S.eggplant.unlocked) a.push('sandwich_eggplant');
  return a;
}

/* ===================== إضافات: فلاير/عائمات/مؤثرات ===================== */
function flyItem(name, x0, y0, tgt, dur, kind, onEnd) {
  FLY.push({ name, x0, y0, tgt, t0: G.t, dur: dur || 0.2, kind: kind || 'item', onEnd });
}
function floater(x, y, text, color) { FLO.push({ x, y, text, color: color || '#fff', t0: G.t, dur: 1.1 }); if (FLO.length > 40) FLO.shift(); }
function fx(name, x, y, w, dur, rise) { FXS.push({ name, x, y, w, t0: G.t, dur: dur || 0.9, rise: rise || 0 }); if (FXS.length > 40) FXS.shift(); }
function banner(text) { if (typeof UI !== 'undefined') UI.banner(text); }
function toast(text) { if (typeof UI !== 'undefined') UI.toast(text); }

function addMoney(n) { G.money += n; G.earned += n; }

/* ===================== العالم والتصادم ===================== */
function addBlock(arr, x, y, w, h) { arr.push({ x0: x - w / 2, x1: x + w / 2, y0: y - h, y1: y }); }
function rebuildBlockers() {
  const b = [];
  const st = CFG.stations;
  for (const k in S) if (S[k].unlocked) addBlock(b, S[k].x, S[k].y, S[k].block[0], S[k].block[1]);
  addBlock(b, CFG.counter.x, CFG.counter.y, 170, 80);
  addBlock(b, CFG.desk.x, CFG.desk.y, 190, 70);
  // صندوق الزبالة موجود من بداية اللعبة؛ منع المرور يكون حول جسم الصندوق فقط.
  addBlock(b, CFG.trash.x, CFG.trash.y, 170, 60);
  for (const t of T) if (t.unlocked) addBlock(b, t.x, t.y, t.w * 0.7, 46);
  addBlock(b, 690, 1085, 110, 40); addBlock(b, 760, 1010, 90, 36); addBlock(b, 560, 1010, 100, 36); addBlock(b, 470, 1160, 90, 40);
  BLOCKS = b;
}
function blocked(x, y, r) {
  for (const b of BLOCKS) if (x > b.x0 - r && x < b.x1 + r && y > b.y0 - r * 0.4 && y < b.y1 + r * 0.4) return true;
  return false;
}
function okPos(x, y, r) { return inPoly(x, y, CFG.poly) && !blocked(x, y, r); }
function stepMove(e, dx, dy, r) {
  const nx = e.x + dx; if (okPos(nx, e.y, r)) e.x = nx;
  const ny = e.y + dy; if (okPos(e.x, ny, r)) e.y = ny;
}
function pushOut(e, r) {
  r = r || 26;
  if (okPos(e.x, e.y, r)) return;
  for (let d = 12; d < 500; d += 12) for (let a = 0; a < 24; a++) {
    const x = e.x + Math.cos(a / 24 * Math.PI * 2) * d, y = e.y + Math.sin(a / 24 * Math.PI * 2) * d;
    if (okPos(x, y, r)) { e.x = x; e.y = y; return; }
  }
}
function moveTo(e, tx, ty, speed, dt) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d <= speed * dt + 0.5) { e.x = tx; e.y = ty; e.moving = false; return true; }
  e.vx = dx / d; e.vy = dy / d; e.x += e.vx * speed * dt; e.y += e.vy * speed * dt; e.moving = true;
  return false;
}
const inZone = (e, z) => dist(e.x, e.y, z.x, z.y) < z.r;
function inEllipse(e, p, rx, ry) { const dx = (e.x - p.x) / rx, dy = (e.y - p.y) / ry; return dx * dx + dy * dy < 1; }

/* ===================== المحطات ===================== */
function prodType(st) {
  switch (st.key) {
    case 'foul': return G.flags.chain ? 'bowl_foul' : 'sandwich_foul';
    case 'bread': return 'bread';
    case 'tameya': return 'tameya_balls';
    case 'fries': return 'fries';
    case 'eggplant': return 'eggplant_plate';
  }
}
function updateStations(dt) {
  if (G.ev && G.ev.pause) return;
  const slow = G.ev && G.ev.slow ? G.ev.slow : 1;
  for (const k in S) {
    const st = S[k];
    if (!st.unlocked) continue;
    if (k === 'wrap') {
      if (st.out.length < st.cap) {
        if (!st.crafting && st.bread > 0 && st.fillTotal > 0) {
          for (const f in st.fill) if (st.fill[f] > 0) { st.crafting = f; st.fill[f]--; st.fillTotal--; st.bread--; st.prog = 0; break; }
        }
        if (st.crafting) {
          st.prog += dt * (WK.cook ? 1.8 : 1) / (st.cycle * prepMul() * slow);
          if (st.prog >= 1) { st.out.push(F2S[st.crafting]); st.crafting = null; st.prog = 0; }
        }
      }
      continue;
    }
    if (st.out.length < st.cap) {
      st.prog += dt / (st.cycle * prepMul() * slow);
      if (st.prog >= 1) { st.prog = 0; st.out.push(prodType(st)); }
    } else st.prog = 0;
  }
}

/* ===================== اللاعب ===================== */
function stackPos(i) { return { x: P.x + P.sway * (0.4 + i * 0.12), y: P.y - CFG.CHAR_H * 0.95 - i * 20 }; }
function playerTarget() { const p = stackPos(Math.max(0, P.stack.length)); return { x: p.x, y: p.y }; }
function takeToStack(type, fromX, fromY) {
  const dur = 0.2;
  P.stack.push({ type, born: G.t + dur });
  flyItem(type, fromX, fromY, playerTarget, dur);
  Snd.pop();
}
function counterSlot(i) {
  const c = CFG.counter, col = i % 4, row = Math.floor(i / 4);
  return { x: c.x + (col - 1.5) * 38 + (row % 2) * 10, y: c.y - 190 + (row % 2) * 16 - Math.floor(row / 2) * 22 + ((col % 2) ? 6 : 0) };
}

function updatePlayer(dt) {
  const [ix, iy] = Input.vec();
  const mag = Math.min(1, Math.hypot(ix, iy));
  const sp = playerSpeed() * mag;
  let vx = 0, vy = 0;
  if (mag > 0.01) { vx = ix / Math.hypot(ix, iy); vy = iy / Math.hypot(ix, iy); }
  const mx = vx * sp * dt, my = vy * sp * dt * CFG.YFACTOR;
  stepMove(P, mx, my, 26);
  P.moving = mag > 0.05;
  if (P.moving) { P.vx = vx; P.vy = vy; P.anim += dt * (0.6 + mag * 0.7); } else P.anim += dt * 0.6;
  P.sway += ((-vx * 26 * mag) - P.sway) * Math.min(1, dt * 8);
  P.workT = Math.max(0, P.workT - dt);
  P.rowName = P.workT > 0 && !P.moving ? 'work' : 'idle';
  P.sheet = 'vendor';
  // الكاميرا
  const vw = W / K, vh = H / K;
  const tx = clamp(P.x, vw / 2, CFG.WORLD.w - vw / 2), ty = clamp(P.y - vh * 0.04, vh / 2, CFG.WORLD.h - vh / 2);
  cam.x += (tx - cam.x) * Math.min(1, dt * 7); cam.y += (ty - cam.y) * Math.min(1, dt * 7);
}

function updatePlayerZones(dt) {
  P.pt -= dt;
  const cap = playerCap();
  if (P.pt <= 0) {
    let did = false;
    // STUDIO_V14_BUSINESS_HANDOFF
    if (P.stack.length < cap) {
      for (const b of (CFG.businesses || [])) {
        if (!(G.businessUnlocked && G.businessUnlocked[b.id])) continue;
        const cp=businessCounter(b), s=businessState(b);
        const zone={x:(Number(b.x)||0),y:(Number(b.y)||0)+Math.max(12,(Number(b.h)||160)*0.10),r:Math.max(58,(Number(b.w)||180)*0.30)};
        if (s.items.length && inEllipse(P,zone,zone.r,zone.r*0.62)) {
          const it=s.items.shift();
          P.stack.push({type:it.type,born:G.t,businessId:b.id});
          flyItem(it.type,cp.x,cp.y-55,()=>stackPos(P.stack.length-1),0.22);
          Snd.thud(); did=true; break;
        }
      }
    }
    if (!did && P.stack.length) {
      for (const c of (G.businessCustomers || [])) {
        if (c.state!=='wait' || dist(P.x,P.y,c.x,c.y)>115) continue;
        const b=(CFG.businesses||[]).find(x=>x.id===c.businessId); if (!b) continue;
        const idx=P.stack.findIndex(it=>it.businessId===b.id && G.t>=it.born);
        if (idx>=0) {
          const it=P.stack.splice(idx,1)[0], sp=stackPos(idx);
          flyItem(it.type,sp.x,sp.y,()=>({x:c.x,y:c.y-CFG.CUST_H*0.55}),0.24);
          serveBusinessCustomer(c,b,idx); Snd.pop(); did=true; break;
        }
      }
    }
    // التقاط من المحطات
    if (P.stack.length < cap) {
      for (const k in S) {
        const st = S[k];
        if (st.unlocked && st.out.length && inZone(P, st.pickup)) {
          const t = st.out.pop();
          takeToStack(t, st.x, st.y - 90); did = true; break;
        }
      }
    }
    // تسليم للكاونتر
    if (!did && inZone(P, CFG.counter.drop) && C.items.length < counterCap()) {
      for (let i = P.stack.length - 1; i >= 0; i--) if (SW.has(P.stack[i].type) && G.t >= P.stack[i].born) {
        const it = P.stack.splice(i, 1)[0];
        const slot = counterSlot(C.items.length);
        const obj = { type: it.type, ready: G.t + 0.22 };
        C.items.push(obj);
        const sp = stackPos(i);
        flyItem(it.type, sp.x, sp.y, () => counterSlot(C.items.indexOf(obj) < 0 ? 0 : C.items.indexOf(obj)), 0.22);
        Snd.thud(); did = true; break;
      }
    }
    // تسليم لمدخل التجهيز
    if (!did && S.wrap.unlocked && inZone(P, S.wrap.input)) {
      const w = S.wrap;
      for (let i = P.stack.length - 1; i >= 0; i--) {
        const t = P.stack[i].type; if (G.t < P.stack[i].born) continue;
        const okB = t === 'bread' && w.bread < w.inCap;
        const okF = F2S[t] && w.fillTotal < w.inCap;
        if (okB || okF) {
          P.stack.splice(i, 1);
          const sp = stackPos(i);
          flyItem(t, sp.x, sp.y, { x: w.x - 20, y: w.y - 100 }, 0.2);
          if (okB) w.bread++; else { w.fill[t] = (w.fill[t] || 0) + 1; w.fillTotal++; }
          Snd.thud(); did = true; break;
        }
      }
    }
    // شباك التوك توك
    if (!did && G.flags.window) {
      const v = VEH.find(v => v.win && v.stopped && v.need.length);
      if (v && inZone(P, CFG.traffic.window)) {
        for (let i = P.stack.length - 1; i >= 0; i--) {
          const t = P.stack[i].type; if (G.t < P.stack[i].born) continue;
          const ni = v.need.indexOf(t);
          if (ni >= 0) {
            P.stack.splice(i, 1); v.need.splice(ni, 1);
            const sp = stackPos(i);
            flyItem(t, sp.x, sp.y, () => ({ x: v.x, y: v.y - 110 }), 0.3);
            Snd.thud(); did = true; break;
          }
        }
      }
    }
    if (did) { P.pt = 0.12; P.workT = 0.4; }
  }
  // جمع الفلوس
  C.collectT -= dt;
  if (C.pile > 0 && inZone(P, CFG.desk.zone) && C.collectT <= 0) {
    const chunk = Math.max(1, Math.ceil(C.pile * 0.3));
    C.pile -= chunk; addMoney(chunk); C.collectT = 0.06;
    flyItem('', CFG.desk.pileX, CFG.desk.pileY - 30, () => ({ x: P.x, y: P.y - 120 }), 0.25, 'coin');
    floater(P.x, P.y - CFG.CHAR_H - 10, '+' + fmt(chunk), '#ffe27a');
    Snd.coin(); Snd.vibrate(6);
  }
  // تنظيف الترابيزات
  let cleaning = null;
  if (!(G.flags.trash && G.bags >= CFG.trash.full)) {
    for (const t of T) if (t.unlocked && t.dirty && dist(P.x, P.y, t.x, t.y + 40) < 130) { cleaning = t; break; }
  }
  if (cleaning) { cleaning.clean += dt; P.workT = 0.2; if (cleaning.clean >= 2.5) finishClean(cleaning); }
  else for (const t of T) if (!t.cleanBy) t.clean = Math.max(0, t.clean - dt);
  // المعلم الرئيسي وحده يتخلص من السندوتشات التي يحملها عند دخوله دائرة الصندوق.
  // تُزال قطعة واحدة في كل نبضة وتظهر وهي تطير إلى داخل الصندوق.
  if (inZone(P, CFG.trash.zone) && P.stack.length > 0) {
    P.trashT += dt; P.workT = 0.2;
    if (P.trashT >= 0.24) {
      P.trashT = 0;
      const i = P.stack.length - 1;
      const it = P.stack.splice(i, 1)[0];
      const from = stackPos(i);
      flyItem(it.type, from.x, from.y, { x: CFG.trash.x, y: CFG.trash.y - 65 }, 0.34);
      fx('dust_puff', CFG.trash.x, CFG.trash.y - 55, 65, 0.35, -8);
      Snd.thud();
      if (P.stack.length === 0) floater(CFG.trash.x, CFG.trash.y - 145, 'تم التخلص من الطعام', '#fff1d6');
    }
  } else if (G.flags.trash && G.bags > 0 && inZone(P, CFG.trash.zone)) {
    P.trashT += dt; P.workT = 0.2;
    if (P.trashT >= 2) { G.bags = 0; P.trashT = 0; addMoney(10); floater(CFG.trash.x, CFG.trash.y - 120, '+١٠', '#ffe27a'); Snd.coin(); }
  } else P.trashT = 0;
  // أنبوبة الغاز (حدث)
  if (G.ev && G.ev.gas && dist(P.x, P.y, 800, 1050) < 110) { G.ev = null; banner('ركّبت الأنبوبة 👍'); Snd.ding(); }
  // القطة (حدث)
  if (G.ev && G.ev.cat) {
    if (dist(P.x, P.y, 1860, 1250) < 150 && !P.moving) {
      P.catT += dt;
      if (P.catT > 1.5) { addMoney(25); floater(1860, 1150, '+٢٥', '#ffe27a'); fx('hearts', 1860, 1170, 150, 1.4, -40); G.ev = null; banner('القطة حبّتك! +٢٥ ج'); Snd.ding(); P.catT = 0; }
    } else P.catT = 0;
  }
}
function finishClean(t) {
  t.dirty = false; t.clean = 0; t.served = 0;
  fx('sparkles', t.x, t.y - 40, 130, 1.0, -30); Snd.coin();
  if (G.flags.trash) G.bags = Math.min(CFG.trash.full, G.bags + 1);
  addMoney(2);
}

/* ===================== الزبائن ===================== */
function qpoint(i) { const q = CFG.queue; return { x: q.x + q.dx * i, y: q.y + q.dy * i }; }
function makeOrder(maxN) {
  const al = allowedProducts();
  const n = 1 + Math.floor(Math.random() * Math.min(maxN, 1 + Math.floor((G.level + 1) / 2)));
  const o = [];
  for (let i = 0; i < n; i++) o.push(al[Math.min(al.length - 1, Math.floor(Math.random() * Math.random() * al.length * 1.2))]);
  return o;
}
function spawnCustomer(opts) {
  opts = opts || {};
  if (C.queue.length >= CFG.queue.max && !opts.force) return null;
  const ty = opts.type || pickWeighted(CFG.customers.types);
  let order = makeOrder(ty.maxOrder);
  if (opts.bday) { order = []; const al = allowedProducts(); for (let i = 0; i < 5; i++) order.push(al[Math.floor(Math.random() * al.length)]); }
  const c = {
    id: custId++, ty, sheet: ty.sheet, x: CFG.spawn.x + rand(-20, 20), y: CFG.spawn.y + rand(-30, 40),
    state: 'toQueue', stage: 0, order, need: order.slice(), speed: rand(CFG.customers.speed[0], CFG.customers.speed[1]),
    patMax: patienceBase() * ty.pat * evMul('pat') * (opts.bday ? 1.6 : 1), patT: 0, tip: ty.tip * (opts.bday ? 2 : 1),
    anim: Math.random() * 3, moving: true, vx: 1, vy: 0, rowName: 'idle', bday: !!opts.bday, say: null, takeT: 0, t0: 0, leaveIdx: 0, flip: Math.random() < 0.5,
  };
  C.queue.push(c); CUS.push(c);
  return c;
}
function freeSeat() {
  const opts = [];
  for (const t of T) if (t.unlocked && !t.dirty) for (const s of t.seats) if (!s.c) opts.push([t, s]);
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
}
function payCustomer(c) {
  G.servedTotal = (G.servedTotal || 0) + 1; G.dailyHappy = (G.dailyHappy || 0) + 1; G.dailyDishes = (G.dailyDishes || 0) + c.order.length;
  let amt = 0; for (const t of c.order) amt += CFG.products[t];
  amt = Math.round(amt * priceMul() * c.tip * evMul('income') * boostMul());
  C.pile += amt;
  for (let i = 0; i < 4; i++) flyItem('', c.x, c.y - 90, { x: CFG.desk.pileX + rand(-20, 20), y: CFG.desk.pileY - 20 }, 0.35 + i * 0.06, 'bill');
  floater(c.x, c.y - CFG.CUST_H - 20, '+' + fmt(amt), '#9dff7a');
  Snd.coin();
  G.fame += c.bday ? 3 : 1;
  const nl = levelFromFame(G.fame);
  if (nl > G.level) {
    G.level = nl; addMoney(50 * nl);
    banner('ما شاء الله، المحل ولّع! — مستوى ' + fmt(nl)); Snd.fanfare(); fx('success_check', P.x, P.y - 160, 200, 1.5, -40);
  }
  if (c.bday) fx('hearts', c.x, c.y - 120, 160, 1.5, -40);
}
function leaveQueue(c) { const i = C.queue.indexOf(c); if (i >= 0) C.queue.splice(i, 1); }
function startLeave(c) { c.state = 'leave'; c.leaveIdx = 0; }

function updCustomer(c, dt) {
  c.anim += dt;
  switch (c.state) {
    case 'toQueue': {
      c.rowName = 'idle';
      if (c.stage === 0) { if (moveTo(c, CFG.gate.x, CFG.gate.y, c.speed, dt)) c.stage = 1; }
      else { const q = qpoint(Math.max(0, C.queue.indexOf(c))); if (moveTo(c, q.x, q.y, c.speed, dt)) c.state = 'queue'; }
      break;
    }
    case 'queue': {
      const i = C.queue.indexOf(c), q = qpoint(i);
      if (dist(c.x, c.y, q.x, q.y) > 4) moveTo(c, q.x, q.y, c.speed, dt); else c.moving = false;
      c.rowName = 'idle';
      if (i === 0 && !c.moving) { c.state = 'order'; c.t0 = G.t; c.rowName = 'order'; c.anim = 0; }
      break;
    }
    case 'order':
      c.moving = false; c.rowName = 'order';
      if (G.t - c.t0 > 0.8) { c.state = 'wait'; c.rowName = 'wait'; c.say = Math.random() < 0.5 ? CFG.speech[Math.floor(Math.random() * CFG.speech.length)] : null; c.sayT = G.t; }
      break;
    case 'wait': {
      c.moving = false; c.rowName = 'wait'; c.patT += dt;
      c.takeT -= dt;
      if (c.takeT <= 0 && c.need.length) {
        let took = false;
        for (let i = 0; i < c.need.length && !took; i++) {
          const idx = C.items.findIndex(it => it.type === c.need[i] && it.ready <= G.t);
          if (idx >= 0) {
            const it = C.items.splice(idx, 1)[0]; c.need.splice(i, 1);
            const sl = counterSlot(idx);
            flyItem(it.type, sl.x, sl.y, () => ({ x: c.x, y: c.y - CFG.CUST_H * 0.6 }), 0.25);
            c.takeT = 0.22; Snd.pop(); took = true;
          }
        }
        // لو النوع المطلوب مش موجود ومستني كتير: يقبل أي ساندويتش (والسعر على اللي أخده)
        if (!took && c.patT > c.patMax * 0.35) {
          const idx = C.items.findIndex(it => it.ready <= G.t);
          if (idx >= 0) {
            const it = C.items.splice(idx, 1)[0];
            const old = c.need.shift(); const oi = c.order.indexOf(old); if (oi >= 0) c.order[oi] = it.type;
            const sl = counterSlot(idx);
            flyItem(it.type, sl.x, sl.y, () => ({ x: c.x, y: c.y - CFG.CUST_H * 0.6 }), 0.25);
            c.takeT = 0.22; Snd.pop();
          }
        }
      }
      if (!c.need.length) { c.state = 'pay'; c.t0 = G.t + 0.3; }
      else if (c.patT > c.patMax) {
        c.state = 'angry'; c.t0 = G.t; leaveQueue(c); G.fame = Math.max(0, G.fame - 1); Snd.buzz();
      }
      break;
    }
    case 'pay':
      if (G.t >= c.t0) { payCustomer(c); c.state = 'happy'; c.t0 = G.t; c.rowName = 'happy'; c.anim = 0; }
      break;
    case 'happy':
      c.moving = false;
      if (G.t - c.t0 > 0.9) {
        leaveQueue(c);
        const seat = Math.random() < CFG.customers.toTableChance ? freeSeat() : null;
        if (seat) { seat[1].c = c; c.table = seat[0]; c.seat = seat[1]; c.state = 'toTable'; } else startLeave(c);
      }
      break;
    case 'angry':
      c.moving = false; c.rowName = 'idle';
      if (G.t - c.t0 > 1.0) startLeave(c);
      break;
    case 'toTable':
      if (moveTo(c, c.seat.x, c.seat.y, c.speed, dt)) { c.state = 'eat'; c.t0 = G.t; c.eatT = rand(CFG.customers.eatTime[0], CFG.customers.eatTime[1]); c.rowName = 'eat'; c.anim = 0; }
      break;
    case 'eat':
      c.moving = false; c.rowName = 'eat';
      if (G.t - c.t0 > c.eatT) {
        c.seat.c = null; c.table.served++;
        if (!c.table.seats.some(s => s.c)) { c.table.dirty = true; c.table.clean = 0; }
        addMoney(1); startLeave(c);
      }
      break;
    case 'leave': {
      const path = CFG.leavePath.concat([[CFG.spawn.x, CFG.spawn.y]]);
      const p = path[c.leaveIdx];
      if (!p) { c.dead = true; break; }
      if (moveTo(c, p[0], p[1], c.speed, dt)) c.leaveIdx++;
      break;
    }
  }
}

// STUDIO_V14_MANUAL_BUSINESS
function businessCounter(b) { return { x:Number(b.x)||0, y:(Number(b.y)||0)-Math.max(12,(Number(b.h)||160)*0.12) }; }
function businessQueue(b, index=0) { const x=(Number(b.x)||0)+Math.max(55,(Number(b.w)||180)*0.48); const y=(Number(b.y)||0)+Math.max(78,(Number(b.h)||160)*0.55); const gap=Math.max(48,Number(b.queueGap)||62); return { x:x+Math.floor(index/5)*gap*0.72, y:y+(index%5)*gap }; }
function businessWorker(b) { return (CFG.customWorkers||[]).find(w=>w.id===b.workerId) || null; }
function businessProduct(b) { return b.productSprite || 'sandwich_foul'; }
function businessState(b) {
  G.businessStock = G.businessStock || {};
  if (!G.businessStock[b.id]) G.businessStock[b.id] = { items:[], timer:Math.max(0.5,Number(b.prepTime)||3) };
  return G.businessStock[b.id];
}
function buyOrInspectBusiness(b) {
  if (!b) return;
  if (!(G.businessUnlocked && G.businessUnlocked[b.id])) {
    toast('قف داخل دائرة المشروع وسيتم خصم المبلغ تدريجيًا من رصيدك لفتحه.');
  } else {
    const s=businessState(b);
    toast(b.name + ' مفتوح — منتجات جاهزة: ' + fmt(s.items.length));
  }
}
function updateBusinessPads(dt) {
  for (const b of (CFG.businesses || [])) {
    if (b.visible === false || (G.businessUnlocked && G.businessUnlocked[b.id])) continue;
    G.businessProgress = G.businessProgress || {};
    const z={x:Number(b.x)||0,y:(Number(b.y)||0)+Math.max(45,(Number(b.h)||160)*0.38),r:Math.max(75,(Number(b.w)||180)*0.48)};
    const inside=inEllipse(P,{x:z.x,y:z.y},z.r,Math.max(42,z.r*0.52));
    if (!inside || G.money <= 0) continue;
    const cost=Math.max(1,Number(b.unlockCost)||500);
    const rem=Math.max(0,cost-(Number(G.businessProgress[b.id])||0));
    const rate=Math.max(cost/1.5,60);
    const paid=Math.min(rem,G.money,rate*dt);
    if (paid>0) {
      G.money-=paid; G.businessProgress[b.id]=(G.businessProgress[b.id]||0)+paid;
      if (Math.random()<dt*10) flyItem('',P.x,P.y-100,{x:z.x,y:z.y},0.22,'coin');
      if (G.businessProgress[b.id]>=cost-0.01) {
        G.businessUnlocked[b.id]=true; G.businessProgress[b.id]=cost;
        businessState(b);
        banner('اتفتح ' + b.name + '! المنتج هيظهر على المشروع والزبائن هيقفوا صف قدامه');
        Snd.fanfare(); saveGame();
      }
    }
  }
}
function updateBusinessWorkerPads(dt) {
  for (const b of (CFG.businesses||[])) {
    if (!G.businessUnlocked?.[b.id] || !b.workerId || G.businessWorkerUnlocked?.[b.id]) continue;
    const worker=businessWorker(b); if (!worker) continue;
    const cost=Math.max(0,Number(b.workerUnlockCost)||0);
    if (cost<=0) { G.businessWorkerUnlocked[b.id]=true; continue; }
    const pos={x:(Number(b.x)||0)-Math.max(18,(Number(b.w)||180)*0.16),y:(Number(b.y)||0)+Math.max(28,(Number(b.h)||160)*0.24)};
    const zone={x:pos.x,y:pos.y,r:58};
    if (!inEllipse(P,zone,zone.r,zone.r*0.62) || G.money<=0) continue;
    G.businessWorkerProgress[b.id]=G.businessWorkerProgress[b.id]||0;
    const paid=Math.min(cost-G.businessWorkerProgress[b.id],G.money,Math.max(cost/1.5,30)*dt);
    if (paid>0) { G.money-=paid; G.businessWorkerProgress[b.id]+=paid; }
    if (G.businessWorkerProgress[b.id]>=cost-0.01) {
      G.businessWorkerUnlocked[b.id]=true; G.businessWorkerProgress[b.id]=cost;
      banner('تم تعيين العامل في '+b.name+'!');
      Snd.fanfare(); saveGame();
    }
  }
}
function updateBusinessSystems(dt) {
  const list=(CFG.businesses||[]).filter(b=>b.visible!==false);
  G.businessSpawnT=(G.businessSpawnT||0)-dt;
  for (const b of list) {
    if (!(G.businessUnlocked && G.businessUnlocked[b.id])) continue;
    const s=businessState(b), cap=Math.max(1,Number(b.stockCap)||5);
    s.timer-=dt;
    if (s.items.length<cap && s.timer<=0) {
      s.items.push({type:businessProduct(b),born:G.t});
      s.timer=Math.max(0.5,Number(b.prepTime)||3);
    }
  }
  const open=list.filter(b=>G.businessUnlocked && G.businessUnlocked[b.id]);
  if (G.businessSpawnT<=0 && open.length && G.businessCustomers.length<10) {
    G.businessSpawnT=5+Math.random()*3;
    const b=open[Math.floor(Math.random()*open.length)];
    const waiting=G.businessCustomers.filter(c=>c.businessId===b.id && c.state!=='leave').length;
    const q=businessQueue(b,waiting);
    const ty=CFG.customers.types[Math.floor(Math.random()*CFG.customers.types.length)] || {sheet:'cust_man'};
    const c={businessId:b.id,queueIndex:waiting,createdAt:G.t,x:CFG.spawn.x+rand(-20,20),y:CFG.spawn.y+rand(-20,20),vx:0,vy:1,
      moving:true,sheet:ty.sheet||'cust_man',rowName:'idle',anim:Math.random()*2,state:'walk',
      speed:Math.max(100,Number(CFG.customers.speed?.[0])||150),targetX:q.x,targetY:q.y,
      need:Math.max(1,Math.min(3,Number(b.orderQty)||1)),delivered:0,flip:false,wait:0};
    G.businessCustomers.push(c);
  }
  for (let i=G.businessCustomers.length-1;i>=0;i--) {
    const c=G.businessCustomers[i], b=list.find(x=>x.id===c.businessId);
    if (!b || !(G.businessUnlocked && G.businessUnlocked[b.id])) { G.businessCustomers.splice(i,1); continue; }
    c.anim+=dt;
    if (c.state==='walk') {
      if (moveTo(c,c.targetX,c.targetY,c.speed,dt)) { c.state='wait'; c.moving=false; c.rowName='wait'; c.wait=0; }
    } else if (c.state==='wait') {
      c.moving=false; c.rowName='wait'; c.wait+=dt;
      if (c.wait>45) { c.state='leave'; c.targetX=CFG.spawn.x; c.targetY=CFG.spawn.y; }
    } else if (c.state==='leave') {
      if (moveTo(c,c.targetX,c.targetY,c.speed,dt)) G.businessCustomers.splice(i,1);
    }
  }
  // صف مستقل لكل مشروع: إعادة توزيع أماكن الانتظار عند خروج أي زبون.
  for (const b of open) {
    const line=G.businessCustomers.filter(c=>c.businessId===b.id && c.state!=='leave').sort((a,b)=>a.createdAt-b.createdAt);
    line.forEach((c,i)=>{
      c.queueIndex=i;
      if (c.state==='wait' && i>0) {
        const q=businessQueue(b,i);
        if (Math.hypot(c.x-q.x,c.y-q.y)>4) { c.targetX=q.x; c.targetY=q.y; c.state='requeue'; c.moving=true; }
      }
      if (c.state==='requeue' && moveTo(c,c.targetX,c.targetY,c.speed,dt)) { c.state='wait'; c.moving=false; c.rowName='wait'; }
    });
  }
  // العامل له فتح مستقل عن المشروع، ويقف عند الواجهة ويخدم أول زبون في الصف.
  for (const b of open) {
    const worker=businessWorker(b);
    if (!worker) continue;
    if (!(G.businessWorkerUnlocked && G.businessWorkerUnlocked[b.id])) continue;
    const line=G.businessCustomers.filter(c=>c.businessId===b.id && c.state==='wait').sort((a,b)=>a.queueIndex-b.queueIndex);
    const first=line[0], stock=businessState(b);
    if (first && stock.items.length) {
      const item=stock.items.shift();
      serveBusinessCustomer(first,b,0);
      first.state='leave'; first.targetX=CFG.spawn.x; first.targetY=CFG.spawn.y;
      first.moving=true; first.rowName='walk';
      G.businessStock[b.id]=stock;
    }
  }
}
function serveBusinessCustomer(c,b,itemIndex) {
  const amount=Math.max(1,Number(b.profitPerOrder)||25);
  const s=businessState(b);
  const qty=Math.max(1,Number(b.orderQty)||1);
  c.delivered=(c.delivered||0)+1;
  if (c.delivered>=qty) {
    addMoney(amount); G.shown=G.money; G.servedTotal=(G.servedTotal||0)+1;
    floater(c.x,c.y-140,'+'+fmt(amount)+' ج','#9dff7a');
    fx('cash_burst',c.x,c.y-75,100,0.8,-20); Snd.coin();
    c.state='leave'; c.targetX=CFG.spawn.x; c.targetY=CFG.spawn.y;
  } else {
    floater(c.x,c.y-130,'ناقص '+fmt(qty-c.delivered),'#ffe27a');
  }
}

function updateCustomers(dt) {
  updateBusinessSystems(dt);
  if (!G.ev || !G.ev.pause) {
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      const base = Math.max(CFG.customers.spawnMin, CFG.customers.spawnBase - CFG.customers.spawnPerLevel * (G.level - 1));
      G.spawnT = base / evMul('spawn');
      spawnCustomer();
    }
  }
  for (const c of CUS) updCustomer(c, dt);
  for (let i = CUS.length - 1; i >= 0; i--) if (CUS[i].dead) { leaveQueue(CUS[i]); CUS.splice(i, 1); }
}

/* ===================== العمال ===================== */
function spawnWorker(kind) {
  const base = { kind, x: 1150, y: 1160, vx: 0, vy: 1, moving: false, anim: 0, rowName: 'idle', stack: [], path: [], timer: 0, state: 'idle', task: null };
  const wp = CFG.WORKER_POSITIONS || {};
  if (kind === 'carrier') { const p=wp.carrier||{x:1130,y:1120}; WK.carrier = Object.assign(base, { sheet: 'delivery', x:p.x, y:p.y }); }
  else if (kind === 'cleaner') { const p=wp.cleaner||{x:700,y:1330}; WK.cleaner = Object.assign(base, { sheet: 'helper', x:p.x, y:p.y }); }
  else if (kind === 'cook') { const p=wp.cook||{x:1255,y:1000}; WK.cook = Object.assign(base, { sheet: 'cook', x:p.x, y:p.y }); }
  else if (kind === 'cashier') { const p=wp.cashier||{x:1625,y:1040}; WK.cashier = Object.assign(base, { sheet: 'cashier', x:p.x, y:p.y }); }
}
function route(w, zx, zy) {
  const cy = CFG.corridorY, pts = [];
  if (Math.abs(w.y - cy) > 25 && Math.abs(zy - cy) > 25) pts.push([w.x, cy]);
  if (pts.length) pts.push([zx, cy]);
  pts.push([zx, zy]);
  return pts;
}
const cls = (t) => (SW.has(t) ? 'counter' : 'wrap');
function srcStations() { const a = []; for (const k in S) if (S[k].unlocked && S[k].out.length) a.push(S[k]); return a; }

function updCarrier(w, dt) {
  const sp = CFG.workers.speed * workerMul();
  if (w.path.length) { const t = w.path[0]; if (moveTo(w, t[0], t[1], sp, dt)) w.path.shift(); w.anim += dt; return; }
  w.moving = false; w.anim += dt * 0.6; w.timer -= dt;
  if (w.timer > 0) return;
  const cap = CFG.workers.cap;
  if (w.state === 'idle') {
    if (w.stack.length) {
      const k = cls(w.stack[w.stack.length - 1]);
      w.state = 'deliver'; w.dest = k;
      const z = k === 'counter' ? CFG.counter.drop : S.wrap.input; w.path = route(w, z.x, z.y); return;
    }
    // مهمة جديدة
    let best = null, bestScore = -1e9;
    const wr = S.wrap;
    const cntSw = (sw) => C.items.filter(i => i.type === sw).length + wr.out.filter(t => t === sw).length;
    for (const st of srcStations()) {
      const top = st.out[st.out.length - 1], k = cls(top);
      let score;
      if (k === 'counter') {
        if (C.items.length >= counterCap()) continue;
        score = 1000 - C.items.filter(i => i.type === top).length * 10 + st.out.length;      // نوّع الكاونتر
      } else {
        if (!wr.unlocked) continue;
        if (top === 'bread') { if (wr.bread >= 3) continue; score = 500 - wr.bread * 20; }
        else {
          if (wr.fillTotal >= 3) continue;
          const sw = F2S[top]; if (!sw) continue;
          score = 400 - ((wr.fill[top] || 0) * 40 + cntSw(sw) * 15);                          // وازن بين الأنواع
        }
      }
      if (score > bestScore) { bestScore = score; best = { st, k }; }
    }
    if (best) { w.state = 'pickup'; w.src = best.st; w.dest = best.k; w.path = route(w, best.st.pickup.x, best.st.pickup.y); }
    else { // عودة لمكان الانتظار
      if (dist(w.x, w.y, 1150, 1120) > 30) w.path = route(w, 1150, 1120);
    }
  } else if (w.state === 'pickup') {
    const st = w.src;
    const top = st.out[st.out.length - 1];
    if (w.stack.length < cap && top && cls(top) === w.dest && (w.stack.length === 0 || cls(w.stack[0]) === w.dest)) {
      w.stack.push(st.out.pop()); w.timer = 0.18; Snd.pop();
    } else { w.state = 'idle'; }
  } else if (w.state === 'deliver') {
    if (!w.stack.length) { w.state = 'idle'; return; }
    const t = w.stack[w.stack.length - 1];
    let ok = false;
    if (w.dest === 'counter') {
      if (C.items.length < counterCap()) { const obj = { type: t, ready: G.t + 0.2 }; C.items.push(obj); flyItem(t, w.x, w.y - 150, () => counterSlot(Math.max(0, C.items.indexOf(obj))), 0.2); ok = true; }
    } else {
      const wr = S.wrap;
      if (t === 'bread' && wr.bread < wr.inCap) { wr.bread++; ok = true; }
      else if (F2S[t] && wr.fillTotal < wr.inCap) { wr.fill[t] = (wr.fill[t] || 0) + 1; wr.fillTotal++; ok = true; }
      if (ok) flyItem(t, w.x, w.y - 150, { x: wr.x - 20, y: wr.y - 100 }, 0.2);
    }
    if (ok) { w.stack.pop(); w.timer = 0.18; Snd.thud(); }
    else { w.state = 'idle'; w.timer = 0.6; }
  }
}
function updCleaner(w, dt) {
  const sp = CFG.workers.speed * 0.9 * workerMul();
  if (w.path.length) { const t = w.path[0]; if (moveTo(w, t[0], t[1], sp, dt)) w.path.shift(); w.anim += dt; return; }
  w.moving = false; w.anim += dt * 0.6; w.rowName = 'idle';
  if (w.state === 'idle') {
    const full = G.bags >= CFG.trash.full;
    if (full || (G.bags >= 3 && !T.some(t => t.unlocked && t.dirty))) { w.state = 'trash'; w.path = [[CFG.trash.zone.x, CFG.trash.zone.y]]; w.timer = 0; w.work = 0; return; }
    const t = T.find(t => t.unlocked && t.dirty && !t.cleanBy);
    if (t && !full) { w.state = 'table'; w.tab = t; t.cleanBy = w; w.path = [[t.x, t.y + 48]]; w.work = 0; return; }
    if (dist(w.x, w.y, 880, 1260) > 40) w.path = [[880, 1260]];
  } else if (w.state === 'table') {
    w.work += dt; if (w.work >= 2.0) { finishClean(w.tab); w.tab.cleanBy = null; w.state = 'idle'; }
    if (!w.tab.dirty) { w.tab.cleanBy = null; w.state = 'idle'; }
  } else if (w.state === 'trash') {
    w.work += dt; if (w.work >= 2.0) { G.bags = 0; addMoney(10); w.state = 'idle'; }
  }
}
function updWorkers(dt) {
  if (WK.carrier) updCarrier(WK.carrier, dt);
  if (WK.cleaner) updCleaner(WK.cleaner, dt);
  if (WK.cook) { const c = WK.cook; c.anim += dt; c.rowName = S.wrap.crafting ? 'work' : 'idle'; c.moving = false; }
  if (WK.cashier) {
    const c = WK.cashier; c.anim += dt; c.moving = false; c.rowName = C.pile > 0 ? 'work' : 'idle'; c.takeT = (c.takeT || 0) - dt;
    if (C.pile > 0 && c.takeT <= 0) {
      const ch = Math.max(1, Math.ceil(C.pile * 0.4)); C.pile -= ch; addMoney(ch); c.takeT = 0.3;
      flyItem('', CFG.desk.pileX, CFG.desk.pileY - 30, () => ({ x: CFG.desk.pileX, y: -200 }), 0.5, 'coin'); Snd.coin();
    }
  }
}

/* ===================== حركة المرور ===================== */
const LANE = CFG.traffic.lanes.map(l => { const dx = l.x1 - l.x0, dy = l.y1 - l.y0, len = Math.hypot(dx, dy); return { l, dx: dx / len, dy: dy / len, len }; });
let trafficT = [1, 2.5], windowT = 20;
function spawnVehicle(lane, kind, win) {
  const L = LANE[lane];
  const v = { lane, t: 0, speed: rand(CFG.traffic.speed[0], CFG.traffic.speed[1]), kind, w: CFG.traffic.widths[kind], x: L.l.x0, y: L.l.y0, win: !!win, stopped: false, need: [], patT: 0, done: false };
  if (win) { const al = allowedProducts(); v.need = [al[Math.floor(Math.random() * al.length)]]; if (Math.random() < 0.5) v.need.push(al[Math.floor(Math.random() * al.length)]); v.order = v.need.slice(); v.speed = 150; }
  VEH.push(v);
}
function updateTraffic(dt) {
  for (let i = 0; i < 2; i++) {
    trafficT[i] -= dt;
    if (trafficT[i] <= 0) {
      trafficT[i] = rand(CFG.traffic.spawn[0], CFG.traffic.spawn[1]);
      const last = VEH.filter(v => v.lane === i).reduce((m, v) => Math.min(m, v.t), 1e9);
      if (last > CFG.traffic.gap) { const kinds = ['tuktuk', 'microbus', 'pickup_truck', 'motorbike', 'scooter_delivery']; spawnVehicle(i, kinds[Math.floor(Math.random() * kinds.length)], false); }
    }
  }
  if (G.flags.window) {
    windowT -= dt;
    if (windowT <= 0 && !VEH.some(v => v.win)) { windowT = 25; const last = VEH.filter(v => v.lane === 0).reduce((m, v) => Math.min(m, v.t), 1e9); if (last > CFG.traffic.gap) spawnVehicle(0, ['tuktuk', 'microbus', 'pickup_truck'][Math.floor(Math.random() * 3)], true); }
  }
  const tStop = (LANE[0].l.x0 - CFG.traffic.stop.x) / -LANE[0].dx;
  for (const v of VEH) {
    const L = LANE[v.lane];
    // أقرب سيارة أمامي
    let ahead = null;
    for (const o of VEH) if (o !== v && o.lane === v.lane && o.t > v.t && o.t - v.t < CFG.traffic.gap * 0.9) { if (!ahead || o.t < ahead.t) ahead = o; }
    let sp = v.speed;
    if (ahead) sp = Math.min(sp, ahead.stopped ? 0 : ahead.speed);
    if (v.win) {
      if (!v.stopped && v.t >= tStop) { v.stopped = true; v.patT = 0; }
      if (v.stopped) {
        sp = 0; v.patT += dt;
        if (!v.need.length && !v.paid) {
          v.paid = true; let amt = 0; for (const t of v.order) amt += CFG.products[t];
          amt = Math.round(amt * 1.5 * priceMul() * evMul('income') * boostMul()); C.pile += amt;
          for (let i = 0; i < 4; i++) flyItem('', v.x, v.y - 90, { x: CFG.desk.pileX, y: CFG.desk.pileY - 20 }, 0.5 + i * 0.07, 'bill');
          floater(v.x, v.y - 200, '+' + fmt(amt), '#9dff7a'); Snd.coin(); Snd.horn(); G.fame += 2; v.stopped = false; v.win = false;
        } else if (v.patT > 16 && v.need.length) { v.stopped = false; v.win = false; Snd.buzz(); }
      }
    }
    v.t += sp * dt;
    v.x = L.l.x0 + L.dx * v.t; v.y = L.l.y0 + L.dy * v.t;
    if (v.t > L.len + 200) v.dead = true;
  }
  for (let i = VEH.length - 1; i >= 0; i--) if (VEH[i].dead) VEH.splice(i, 1);
}

/* ===================== الفتح (دوائر) ===================== */
function padPos(def) {
  if (Array.isArray(def.spot)) return def.spot;
  return CFG.padSpots[def.spot];
}
function makePad(idx) {
  const def = CFG.pads[idx]; if (!def) { PAD = null; return; }
  const pos = padPos(def);
  PAD = { idx, def, x: pos[0], y: pos[1], rem: def.price, armed: false, inside: false };
}
function applyPad(def, silent) {
  switch (def.id) {
    case 'bread_wrap': G.flags.chain = true; S.bread.unlocked = true; S.wrap.unlocked = true; break;
    case 'tameya': G.flags.tameya = true; S.tameya.unlocked = true; break;
    case 'table': { const t = T[G.tablesUnlocked++]; if (t) t.unlocked = true; break; }
    case 'carrier': G.flags.carrier = true; spawnWorker('carrier'); break;
    case 'trash': G.flags.trash = true; G.flags.cleaner = true; spawnWorker('cleaner'); break;
    case 'cook': G.flags.cook = true; spawnWorker('cook'); break;
    case 'rack': G.flags.rack = true; break;
    case 'fries': G.flags.fries = true; S.fries.unlocked = true; break;
    case 'cashier': G.flags.cashier = true; spawnWorker('cashier'); break;
    case 'eggplant': G.flags.eggplant = true; S.eggplant.unlocked = true; break;
    case 'decor': G.flags.decor = true; break;
    case 'window': G.flags.window = true; break;
    case 'branch': G.flags.branch = true; break;
  }
  rebuildBlockers();
  if (!silent) {
    pushOut(P, 26);
    fx('cash_burst', PAD.x, PAD.y - 60, 260, 1.0, -20); Snd.ding(); Snd.vibrate(25);
    if (def.id === 'branch') { banner('مبروك! الفرع الثاني قريبًا 🎉'); Snd.fanfare(); }
    else toast('اتفتح: ' + def.name);
  }
}
function updatePad(dt) {
  if (!PAD) return;
  PAD.inside = inEllipse(P, PAD, CFG.padRx, CFG.padRy);
  if (!PAD.inside) PAD.armed = true;
  if (!PAD.inside || !PAD.armed || G.money <= 0) return;
  const rate = Math.max(PAD.def.price / 1.5, 60);
  const d = Math.min(PAD.rem, G.money, rate * dt);
  if (d <= 0) return;
  G.money -= d; PAD.rem -= d;
  if (Math.random() < dt * 14) flyItem('', P.x, P.y - 120, { x: PAD.x, y: PAD.y }, 0.25, 'coin');
  Snd.coin();
  if (PAD.rem <= 0.01) {
    const def = PAD.def, idx = PAD.idx;
    G.padIdx = idx + 1;
    applyPad(def, false);
    makePad(G.padIdx);
  }
}

/* ===================== الأحداث ===================== */
const EVENTS = [
  { id: 'ramadan', txt: 'طابور رمضان! زحمة وخير 🌙', dur: 35, spawn: 2, income: 1.3 },
  { id: 'iftar', txt: 'زحمة الفطار! الكل مستعجل', dur: 30, income: 1.5, pat: 0.7, spawn: 1.5 },
  { id: 'lunch', txt: 'زحمة الغدا! الطلبات بتزيد', dur: 35, income: 1.25, spawn: 1.7 },
  { id: 'rain', txt: 'مطر خفيف في الحارة.. الزباين أهدى', dur: 25, income: 1.1, spawn: 0.8 },
  { id: 'match', txt: 'ماتش الأهلي والزمالك! ⚽', dur: 35, spawn: 1.5, income: 1.2 },
  { id: 'dust', txt: 'عاصفة ترابية.. الزباين قلّت', dur: 30, spawn: 0.6 },
  { id: 'power', txt: 'الكهربا فصلت!', dur: 8, pause: true },
  { id: 'gas', txt: 'الأنبوبة بتخلص! جري عليها', dur: 20, slow: 1.6, gas: true },
  { id: 'bday', txt: 'عيد ميلاد زبون! طلب كبير 🎂', dur: 25, bday: true },
  { id: 'inspect', txt: 'مفتش الصحة وصل!', dur: 6, inspect: true },
  { id: 'fast', txt: 'الصبيان هيجروا! سرعة ×٢', dur: 15, workers: 2 },
  { id: 'cat', txt: 'قطة الشارع جعانة.. قف جنبها', dur: 25, cat: true },
];
function startEvent() {
  const pool = EVENTS.filter(e => !(e.inspect && !T.some(t => t.unlocked)) && !(e.fast && !(WK.carrier || WK.cleaner)));
  const e = pool[Math.floor(Math.random() * pool.length)];
  G.ev = Object.assign({}, e, { end: G.t + e.dur });
  banner(e.txt); Snd.horn();
  if (e.bday) spawnCustomer({ bday: true, force: true, type: CFG.customers.types[2] });
  if (e.inspect) {
    const un = T.filter(t => t.unlocked), clean = un.filter(t => !t.dirty).length;
    if (clean / un.length >= 0.7) { addMoney(200); banner('المفتش مبسوط! +٢٠٠ ج'); Snd.ding(); }
    else { G.money = Math.max(0, G.money - 100); banner('المفتش زعل.. غرامة ١٠٠ ج'); Snd.buzz(); }
  }
}
function updateEvents(dt) {
  if (G.ev) { if (G.t > G.ev.end) G.ev = null; }
  else if (G.t >= G.nextEv) { startEvent(); G.nextEv = G.t + rand(CFG.events.min, CFG.events.max); }
}

/* ===================== الطيران والمؤثرات ===================== */
function updateFx(dt) {
  for (let i = FLY.length - 1; i >= 0; i--) {
    const f = FLY[i], u = (G.t - f.t0) / f.dur;
    if (u >= 1) { FLY.splice(i, 1); }
  }
  for (let i = FLO.length - 1; i >= 0; i--) if (G.t - FLO[i].t0 > FLO[i].dur) FLO.splice(i, 1);
  for (let i = FXS.length - 1; i >= 0; i--) if (G.t - FXS[i].t0 > FXS[i].dur) FXS.splice(i, 1);
}

/* ===================== تعليمات البداية ===================== */
function tutorialTarget() {
  if (G.playT > 180) return null;
  const hasSW = P.stack.some(s => SW.has(s.type));
  if (hasSW && C.items.length < counterCap()) return CFG.counter.drop;
  if (C.pile > 0) return CFG.desk.zone;
  if (PAD && G.money >= PAD.rem * 0.5) return { x: PAD.x, y: PAD.y - 20 };
  const st = S.foul; if (st.out.length && P.stack.length < playerCap()) return st.pickup;
  return null;
}

/* ===================== شخصية الباز ===================== */
function updateBaz(dt) {
  if (!BAZ.active) {
    if (G.t >= BAZ.nextAt && !G.paused && !G.ev && !G.menuOpen) {
      BAZ.active = true; BAZ.state = 'approach'; BAZ.x = CFG.spawn.x; BAZ.y = CFG.spawn.y;
      BAZ.moving = true; BAZ.rowName = 'walk_down';
    }
    return;
  }
  BAZ.anim += dt;
  BAZ.shake = Math.max(0, (BAZ.shake || 0) - dt);
  if (BAZ.state === 'approach') {
    BAZ.moving = true;
    const tx = P.x + 75, ty = P.y + 8;
    if (moveTo(BAZ, tx, ty, 145, dt)) {
      BAZ.moving = false; BAZ.rowName = 'talk';
      BAZ.state = 'asking';
      if (typeof UI !== 'undefined') UI.openBaz();
    }
  } else if (BAZ.state === 'reaction') {
    BAZ.moving = false; BAZ.rowName = 'reaction';
    BAZ.reactionT -= dt;
    if (BAZ.reactionT <= 0) BAZ.state = 'leaving';
  } else if (BAZ.state === 'leaving') {
    BAZ.moving = true;
    if (moveTo(BAZ, CFG.spawn.x, CFG.spawn.y, 155, dt)) {
      BAZ.active = false; BAZ.state = 'idle'; BAZ.moving = false;
    }
  } else {
    BAZ.moving = false;
    BAZ.rowName = BAZ.state === 'asking' ? 'talk' : 'idle';
  }
}
function removePoliceSandwiches(amount) {
  let remaining = amount;
  const takeFrom = (arr, getType) => {
    if (!Array.isArray(arr) || remaining <= 0) return;
    for (let i = arr.length - 1; i >= 0 && remaining > 0; i--) {
      if (SW.has(getType(arr[i]))) { arr.splice(i, 1); remaining--; }
    }
  };
  takeFrom(P.stack, item => item && item.type);
  for (const key in S) takeFrom(S[key].out, item => item);
  takeFrom(C.items, item => item && item.type);
  for (const key in WK) if (WK[key] && WK[key].stack) takeFrom(WK[key].stack, item => item && item.type ? item.type : item);
  for (const id in (G.businessStock || {})) takeFrom(G.businessStock[id].items, item => item && item.type ? item.type : item);
  return amount - remaining;
}
function finishBaz(accepted) {
  if (!BAZ.active || BAZ.state !== 'asking') return;
  if (accepted) {
    G.money -= 900; G.shown = G.money;
    floater(BAZ.x, BAZ.y - 190, '-٩٠٠ ج', '#ffb08a');
    banner('المعلم دفع ٩٠٠ جنيه لأمين الشرطة'); Snd.buzz();
  } else {
    const taken = removePoliceSandwiches(10);
    BAZ.shake = 0.8;
    floater(BAZ.x, BAZ.y - 190, 'أخد ' + AR(taken) + ' سندوتش', '#ff9c7a');
    banner(taken === 10 ? 'أمين الشرطة أخد ١٠ سندوتشات' : 'أمين الشرطة أخد المتاح: ' + AR(taken) + ' سندوتش');
    Snd.thud();
  }
  BAZ.state = 'reaction'; BAZ.rowName = 'talk'; BAZ.moving = false; BAZ.reactionT = 1.2;
  BAZ.nextAt = G.t + rand(150, 240);
}
function drawBaz() {
  const shake = BAZ.shake > 0 ? Math.sin(BAZ.anim * 45) * 5 * BAZ.shake : 0;
  ctx.save();
  ctx.fillStyle = 'rgba(45,28,12,.22)';
  ctx.beginPath(); ctx.ellipse(BAZ.x, BAZ.y - 3, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(shake, 0); drawChar(BAZ, CFG.CHAR_H); ctx.restore();
  if (BAZ.state === 'asking') txt('أمين الشرطة عايز المعلوم يا معلم!', BAZ.x + shake, BAZ.y - 180, 23, '#fff', '#392313');
}

/* ===================== التحديث الرئيسي ===================== */
function update(dt) {
  G.t += dt; G.playT += dt;
  const today = new Date().toLocaleDateString('en-CA'); if (G.dailyDate !== today) { G.dailyDate = today; G.dailyDishes = 0; G.dailyHappy = 0; }
  updatePlayer(dt);
  updateBaz(dt);
  updateStations(dt);
  updatePlayerZones(dt);
  updateCustomers(dt);
  updWorkers(dt);
  updateTraffic(dt);
  updatePad(dt);
  updateBusinessPads(dt);
  updateBusinessWorkerPads(dt);
  updateEvents(dt);
  updateFx(dt);
  // شخصية: صف العمل تتحرك الإطارات
  G.shown += (G.money - G.shown) * Math.min(1, dt * 9);
  if (Math.abs(G.shown - G.money) < 0.5) G.shown = G.money;
  // متوسط الدخل في الدقيقة
  G.earnT += dt; if (G.earnT >= 60) { G.ipm = G.ipm ? G.ipm * 0.5 + G.earned * 0.5 : G.earned; G.earned = 0; G.earnT = 0; }
  G.saveT += dt; if (G.saveT >= 5) { G.saveT = 0; saveGame(); }
  if (G.boostCd > 0) G.boostCd = Math.max(0, G.boostCd - dt);
}

/* ===================== حفظ/تحميل ===================== */
function saveGame() {
  Store.save({ businessUnlocked:G.businessUnlocked||{}, businessProgress:G.businessProgress||{}, businessStock:G.businessStock||{}, businessWorkerProgress:G.businessWorkerProgress||{}, businessWorkerUnlocked:G.businessWorkerUnlocked||{}, money: G.money, fame: G.fame, level: G.level, padIdx: G.padIdx, up: G.up, bags: G.bags, ipm: G.ipm, last: Date.now(), playT: G.playT, settings: G.settings, servedTotal: G.servedTotal, dailyDate: G.dailyDate, dailyDishes: G.dailyDishes, dailyHappy: G.dailyHappy });
}
function loadGame() {
  const d = Store.load();
  makePad(0);
  rebuildBlockers();
  if (!d) return null;
  G.businessUnlocked=Object.assign({},d.businessUnlocked||{}); G.businessProgress=Object.assign({},d.businessProgress||{}); G.businessStock=Object.assign({},d.businessStock||{}); G.businessWorkerProgress=Object.assign({},d.businessWorkerProgress||{}); G.businessWorkerUnlocked=Object.assign({},d.businessWorkerUnlocked||{}); G.money = d.money || 0; G.shown = G.money; G.fame = d.fame || 0; G.level = d.level || 1; G.up = Object.assign(G.up, d.up || {}); G.bags = d.bags || 0;
  G.ipm = d.ipm || 0; G.playT = d.playT || 0; G.servedTotal=d.servedTotal||0; G.dailyDate=d.dailyDate||''; G.dailyDishes=d.dailyDishes||0; G.dailyHappy=d.dailyHappy||0; G.settings = Object.assign(G.settings, d.settings || {});
  const n = d.padIdx || 0;
  for (let i = 0; i < n; i++) { PAD = { idx: i, def: CFG.pads[i], x: 0, y: 0 }; applyPad(CFG.pads[i], true); }
  G.padIdx = n; makePad(n);
  const away = (Date.now() - (d.last || Date.now())) / 1000;
  if (away > CFG.offline.minSec && G.ipm > 0) {
    const earn = Math.floor(Math.min(away, CFG.offline.maxSec) / 60 * G.ipm * CFG.offline.rate);
    return earn > 0 ? earn : null;
  }
  return null;
}
function resetGame() { Store.reset(); location.reload(); }

/* ===================== جمع الكائنات للرسم ===================== */
function collectEntities(list) {
  const add = (y, fn) => list.push({ y, fn });
  // ديكور ثابت
  for (const d of CFG.decor) {
    if (d[5] && !G.flags[d[5]]) continue;
    if (d[1] === 'carpet') continue;
    add(d[3], () => drawStatic(d[0], d[1], d[2], d[3], d[4]));
  }
  // المحطات
  const st = S;
  add(st.foul.y, () => {
    shadow(st.foul.x, st.foul.y, st.foul.w * 0.8);
    drawStatic('equipment', 'foul_cart', st.foul.x, st.foul.y, st.foul.w);
    const sh = imgH('equipment', 'foul_cart', st.foul.w);
    if (st.foul.out.length < st.foul.cap && !(G.ev && G.ev.pause)) drawFx('steam', st.foul.x - 12, st.foul.y - sh * 0.82, 70, 0.55 + 0.25 * Math.sin(G.t * 3));
    stationBadge(st.foul, sh);
    if (G.ev && G.ev.gas) { drawStatic('equipment', 'gas_cylinder', 800, 1050, 80); const b = Math.sin(G.t * 6) * 6; txt('!', 800, 1050 - 130 + b, 46, '#ffd23a'); }
  });
  if (st.bread.unlocked) add(st.bread.y, () => { shadow(st.bread.x, st.bread.y, 120); drawStatic('equipment', 'bread_basket', st.bread.x, st.bread.y, st.bread.w); stationBadge(st.bread, imgH('equipment', 'bread_basket', st.bread.w)); });
  if (st.wrap.unlocked) add(st.wrap.y, () => {
    const w = st.wrap; shadow(w.x, w.y, w.w * 0.8);
    const h = drawStatic('equipment', 'wrap_table', w.x, w.y, w.w);
    // احتياجات التجهيز
    let ix = w.x - 60;
    drawItem('bread', ix, w.y - h - 6, 40); txt(fmt(w.bread), ix + 20, w.y - h - 14, 26, '#fff'); ix += 62;
    const fills = Object.keys(w.fill).filter(f => w.fill[f] > 0);
    if (!fills.length && !w.crafting) { drawItem('bowl_foul', ix, w.y - h - 6, 40, 0.35); }
    for (const f of fills) { drawItem(f, ix, w.y - h - 6, 40); txt('×' + fmt(w.fill[f]), ix + 22, w.y - h - 14, 24, '#fff'); ix += 56; }
    if (w.crafting) drawProgress(w.x + 30, w.y - h * 0.55, w.prog, 22);
    if (w.out.length) { drawItem(w.out[w.out.length - 1], w.x + 85, w.y - 50, 50); txt(fmt(w.out.length), w.x + 112, w.y - 66, 28, '#fff'); }
  });
  if (st.tameya.unlocked) add(st.tameya.y, () => {
    const s = st.tameya; shadow(s.x, s.y, 130);
    drawStatic('equipment', 'gas_stove', s.x, s.y, s.w);
    drawStatic('equipment', 'round_tray', s.x + 4, s.y - 52, s.w * 0.85);
    if (s.out.length < s.cap && !(G.ev && G.ev.pause)) drawFx('steam', s.x, s.y - 110, 60, 0.5 + 0.2 * Math.sin(G.t * 3.3));
    stationBadge(s, 150);
  });
  for (const k of ['fries', 'eggplant']) if (st[k].unlocked) add(st[k].y, () => {
    const s = st[k]; shadow(s.x, s.y, 130);
    const h = drawStatic('equipment', 'topping_tray', s.x, s.y, s.w);
    drawItem(k === 'fries' ? 'fries' : 'eggplant_plate', s.x, s.y - 22, 70);
    stationBadge(s, h);
  });
  // الكاونتر
  add(CFG.counter.y, () => {
    const c = CFG.counter; shadow(c.x, c.y, c.w * 0.9);
    drawStatic('equipment', 'display_case', c.x, c.y, c.w);
    C.items.forEach((it, i) => { if (G.t >= it.ready) { const p = counterSlot(i); drawItem(it.type, p.x, p.y + 12, CFG.COUNTER_ITEM_W); } });
    if (G.flags.rack) { drawStatic('equipment', 'sauces', c.x + 70, c.y - 20, 60); }
    if (C.items.length >= counterCap()) txt('ممتلئ', c.x, c.y - 250, 30, '#ffd23a');
  });
  // مكتب الكاشير + الفلوس
  add(CFG.desk.y, () => {
    const d = CFG.desk; shadow(d.x, d.y, d.w * 0.9);
    drawStatic('equipment', 'prep_counter', d.x, d.y, d.w);
    if (C.pile > 0) {
      const s = 70 + Math.min(1, C.pile / 600) * 90;
      drawFx('coin_pile', d.pileX, d.pileY - 8, s, 1);
      txt(fmt(C.pile) + ' ج', d.pileX, d.pileY - 70, 30, '#ffe27a');
    }
  });
  // الترابيزات
  for (const t of T) if (t.unlocked) {
    for (const dc of t.def.decor) add(t.y + dc[2] + 1, () => drawStatic('furniture', dc[0], t.x + dc[1], t.y + dc[2], dc[3]));
    add(t.y, () => {
      shadow(t.x, t.y, t.w * 0.85);
      const h = drawStatic('furniture', t.def.sprite, t.x, t.y, t.w);
      if (t.dirty) { drawItem('tomato_plate', t.x, t.y - h * 0.62, 46); drawItem('eggs_boiled', t.x - 30, t.y - h * 0.5, 30); if (t.clean > 0) drawProgress(t.x, t.y - h - 24, t.clean / 2.5, 20); else txt('✦', t.x, t.y - h - 18, 36, '#ffd23a'); }
    });
  }
  // الزبالة
  add(CFG.trash.y, () => {
    const z = CFG.trash; shadow(z.x, z.y, z.w * 0.85); drawStatic('props', 'dumpster_barrel', z.x, z.y, z.w);
    if (G.bags > 0) txt(fmt(G.bags) + '/' + fmt(CFG.trash.full), z.x, z.y - 150, 28, G.bags >= CFG.trash.full ? '#ff6a4d' : '#fff');
    if (P.trashT > 0) drawProgress(z.x, z.y - 180, P.trashT / 2, 20);
  });
  // الشخصيات
  if (BAZ.active) add(BAZ.y, () => drawBaz());
  add(P.y, () => { drawChar(P, CFG.CHAR_H); drawStack(); });
  for (const c of CUS) add(c.y, () => { const ch=(c.ty && c.ty.height) || CFG.CUST_H; drawChar(c, c.sheet === 'cust_woman' ? ch - 6 : ch); });
  for (const k in WK) { const w = WK[k]; if (!w) continue; add(w.y, () => { drawChar(w, (CFG.WORKER_SIZES && CFG.WORKER_SIZES[k]) || (w.sheet === 'helper' ? CFG.HELPER_H : CFG.CHAR_H)); if (w.kind === 'carrier') txt('الشنكوتي', w.x, w.y - CFG.CHAR_H - 30, 25, '#fff1c7'); if (w.stack && w.stack.length) w.stack.forEach((t, i) => drawItem(t, w.x, w.y - CFG.CHAR_H * 0.95 - i * 18, 44)); }); }
  // STUDIO_V15_PROJECT_DISPENSER: product dispenses from the business itself; customers queue in front
  for (const b of (CFG.businesses || [])) {
    if (b.visible===false) continue;
    const open=!!(G.businessUnlocked && G.businessUnlocked[b.id]);
    const bx=Number(b.x)||0, by=Number(b.y)||0, bw=Number(b.w)||180, bh=Number(b.h)||160;
    add(by+(Number(b.zOffset)||0),()=>{
      shadow(bx,by,bw*0.85);
      ctx.save(); ctx.translate(bx,by); ctx.rotate((Number(b.rotation)||0)*Math.PI/180);
      drawStatic(b.cat||'equipment',b.sprite||'prep_counter',0,0,bw);
      ctx.restore();
      if (!open) {
        const rr=Math.max(75,bw*0.48), py=by+Math.max(45,bh*0.38);
        ctx.fillStyle='rgba(255,204,55,.20)';ctx.strokeStyle='#ffd23a';ctx.lineWidth=6;
        ctx.beginPath();ctx.ellipse(bx,py,rr,rr*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        const cost=Math.max(1,Number(b.unlockCost)||500), paid=G.businessProgress&&G.businessProgress[b.id]||0;
        drawProgress(bx,py-rr*.5-20,paid/cost,18);
        txt('قف للفتح '+fmt(Math.max(0,cost-paid))+' ج',bx,py-rr*.52-48,22,'#ffd45c');
      } else {
        const cp=businessCounter(b), st=businessState(b);
        const count=st.items.length;
        // المنتجات تخرج من واجهة المشروع نفسه؛ لا نضيف كاونترًا منفصلًا.
        const productY=by-Math.max(18,bh*0.16);
        const prepDuration=Math.max(0.5,Number(b.prepTime)||3);
        const prepProgress=count>=Math.max(1,Number(b.stockCap)||5)?1:Math.max(0,Math.min(1,1-(Number(st.timer)||0)/prepDuration));
        const loadW=Math.max(64,Math.min(112,bw*.58)), loadX=bx-loadW/2, loadY=by-Math.max(74,bh*.58);
        ctx.fillStyle='rgba(15,20,30,.82)';ctx.fillRect(loadX,loadY,loadW,12);
        ctx.fillStyle='#f6b83f';ctx.fillRect(loadX,loadY,loadW*prepProgress,12);
        ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1;ctx.strokeRect(loadX,loadY,loadW,12);
        txt(count>=Math.max(1,Number(b.stockCap)||5)?'جاهز للبيع':'جاري التحضير',bx,loadY-10,13,'#fff');
        st.items.slice(0,Math.max(1,Number(b.stockCap)||5)).forEach((it,i)=>{
          const col=i%3, row=Math.floor(i/3);
          drawStatic(b.productCat||'food',it.type,bx+(col-1)*Math.min(34,bw*0.17),productY-row*22,Math.min(42,bw*0.22));
        });
        txt(b.productName||'المنتج',bx,productY-48,20,'#fff');
        txt('منتجات '+fmt(count),bx,by+22,18,count?'#9dff7a':'#fff');
        ctx.strokeStyle='rgba(255,220,80,.72)';ctx.lineWidth=3;
        ctx.beginPath();ctx.ellipse(bx,by+Math.max(18,bh*0.12),Math.max(58,bw*.30),Math.max(36,bw*.18),0,0,Math.PI*2);ctx.stroke();
        const worker=businessWorker(b);
        if (worker && G.businessWorkerUnlocked && G.businessWorkerUnlocked[b.id]) {
          const wx=bx-Math.max(18,bw*.16), wy=by+Math.max(28,bh*.24);
          const sh=worker.sheet;
          if (ASSETS.anim[sh] && IMG.anim[sh] && IMG.anim[sh].naturalWidth) drawChar({sheet:sh,x:wx,y:wy,rowName:'work',anim:G.t,moving:false},Number(worker.height)||CFG.HELPER_H||150);
          else drawChar({sheet:'helper',x:wx,y:wy,rowName:'work',anim:G.t,moving:false},CFG.HELPER_H||150);
        } else if (worker) {
          const wx=bx-Math.max(65,bw*.55), wy=by+Math.max(80,bh*.60);
          const cost=Math.max(0,Number(b.workerUnlockCost)||0), paid=G.businessWorkerProgress&&G.businessWorkerProgress[b.id]||0;
          ctx.strokeStyle='#64d8ff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(wx,wy,52,32,0,0,Math.PI*2);ctx.stroke();
          txt('فتح العامل '+fmt(Math.max(0,cost-paid))+' ج',wx,wy-48,18,'#8fe6ff');
        }
      }
    });
  }
  for (const c of (G.businessCustomers||[])) add(c.y,()=>{drawChar(c,CFG.CUST_H); if(c.state==='wait'){drawBubble(c.x,c.y-CFG.CUST_H-8,[[((CFG.businesses||[]).find(b=>b.id===c.businessId)||{}).productSprite||'sandwich_foul',Math.max(1,(c.need||1)-(c.delivered||0))]],1);}});
  // المركبات
  for (const v of VEH) add(v.y, () => { shadow(v.x, v.y, v.w * 0.85, 0.22); drawStatic('vehicles', v.kind, v.x, v.y + 6, v.w); });
}
function stationBadge(s, h) {
  if (s.out.length) {
    const t = s.out[s.out.length - 1];
    drawItem(t, s.x, s.y - h - 10, 52); txt(fmt(s.out.length), s.x + 36, s.y - h - 26, 28, s.out.length >= s.cap ? '#ff9a4d' : '#fff');
  }
  if (s.prog > 0.01 && s.out.length < s.cap) drawProgress(s.x, s.y - h * 0.5, s.prog, 20);
}
function drawStack() {
  P.stack.forEach((it, i) => { if (G.t < it.born) return; const p = stackPos(i); drawItem(it.type, p.x, p.y, CFG.ITEM_W); });
  if (P.stack.length >= playerCap()) { const p = stackPos(P.stack.length); if (Math.floor(G.t * 2) % 2 === 0 || true) txt('ممتلئ', P.x, p.y - 12, 28, '#ffd23a'); }
}

/* ===================== طبقة الأرض/العلوية ===================== */
function drawGround() {
  // مناطق الاستلام والتسليم
  const lit = (z) => inZone(P, z);
  for (const k in S) { const st = S[k]; if (!st.unlocked) continue; const out = k === 'wrap' ? 'sandwich_foul' : (k === 'foul' ? (G.flags.chain ? 'bowl_foul' : 'sandwich_foul') : prodType(st)); drawRing(st.pickup, lit(st.pickup) && st.out.length > 0, out); }
  if (S.wrap.unlocked) drawRing(S.wrap.input, lit(S.wrap.input), 'bread');
  drawRing(CFG.counter.drop, lit(CFG.counter.drop), 'sandwich_foul', 1, 'green');
  drawRing(CFG.desk.zone, lit(CFG.desk.zone) && C.pile > 0, null, 1, 'yellow');
  drawRing(CFG.trash.zone, lit(CFG.trash.zone) && P.stack.length > 0, P.stack.length > 0 ? 'tomato_plate' : null);
  txt(P.stack.length > 0 ? 'ارمِ الأكل هنا' : 'صندوق الزبالة', CFG.trash.zone.x, CFG.trash.zone.y + 105, 25, '#fff1d6');
  if (G.flags.window) drawRing(CFG.traffic.window, lit(CFG.traffic.window), 'sandwich_foul');
  if (PAD) drawPad(PAD);
}
function drawOverlay() {
  // فقاعات الزبائن
  for (const c of CUS) {
    const hy = c.y - CFG.CUST_H - 6;
    if (c.state === 'wait' || c.state === 'order') {
      const m = {}; c.need.forEach(t => m[t] = (m[t] || 0) + 1);
      const L = Object.keys(m).map(t => [t, m[t]]);
      if (L.length) drawBubble(c.x, hy, L, c.state === 'wait' ? 1 - c.patT / c.patMax : undefined);
      if (c.say && G.t - c.sayT < 3) txt(c.say, c.x, hy - 112, 25, '#fff');
    } else if (c.state === 'angry') drawBubble(c.x, hy, [], undefined, 'angry');
    else if (c.state === 'queue' && C.queue.indexOf(c) > 0 && !c.moving) { drawItem(c.order[0], c.x, hy - 4, 34, 0.9); }
  }
  // سيارات الشباك
  for (const v of VEH) if (v.win && v.stopped && v.need.length) {
    const m = {}; v.need.forEach(t => m[t] = (m[t] || 0) + 1);
    drawBubble(v.x, v.y - 190, Object.keys(m).map(t => [t, m[t]]), 1 - v.patT / 16);
  }
  // الطيران
  for (const f of FLY) {
    const u = clamp((G.t - f.t0) / f.dur, 0, 1), e = ease(u);
    const tg = typeof f.tgt === 'function' ? f.tgt() : f.tgt;
    const x = lerp(f.x0, tg.x, e), y = lerp(f.y0, tg.y, e) - Math.sin(u * Math.PI) * 60;
    if (f.kind === 'item') drawItem(f.name, x, y + 14, 44);
    else if (f.kind === 'coin') { ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { ctx.save(); ctx.translate(x, y); ctx.rotate(u * 5); ctx.fillStyle = '#8ad46a'; ctx.strokeStyle = '#2f6a20'; ctx.lineWidth = 3; rrect(-16, -9, 32, 18, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  // مؤثرات
  for (const f of FXS) { const u = (G.t - f.t0) / f.dur; drawFx(f.name, f.x, f.y + f.rise * u, f.w * (0.7 + 0.5 * u), 1 - u * u); }
  // نصوص عائمة
  for (const f of FLO) { const u = (G.t - f.t0) / f.dur; ctx.globalAlpha = 1 - u * u; txt(f.text, f.x, f.y - u * 70, 36, f.color); ctx.globalAlpha = 1; }
  // سهم الإرشاد
  const tg = tutorialTarget(); if (tg) drawArrow(tg.x, tg.y - 20);
}
function drawDebug() {
  ctx.strokeStyle = 'red'; ctx.lineWidth = 4; ctx.beginPath();
  CFG.poly.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'cyan'; ctx.lineWidth = 3; for (const b of BLOCKS) ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
  ctx.fillStyle = 'lime'; ctx.beginPath(); ctx.arc(P.x, P.y, 8, 0, 7); ctx.fill();
  CFG.traffic.lanes.forEach(l => { ctx.strokeStyle = 'yellow'; ctx.beginPath(); ctx.moveTo(l.x0, l.y0); ctx.lineTo(l.x1, l.y1); ctx.stroke(); });
}
