'use strict';
/* ===================== الواجهة (DOM) ===================== */
const $ = (s) => document.querySelector(s);
const AR = (n) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

const UI = {
  _bannerT: null, _toastT: null, last: {},
  init() {
    $('#gear').addEventListener('click', () => { Snd.init(); Snd.click(); this.openSettings(); });
    $('#btnUp').addEventListener('click', () => { Snd.init(); Snd.click(); this.openUpgrades(); });
    $('#btnBonus').addEventListener('click', () => {
      Snd.init(); Snd.click();
      if (G.boostCd > 0) return;
      G.boostUntil = G.t + CFG.bonus.dur; G.boostCd = CFG.bonus.dur + CFG.bonus.cd;
      this.banner('الدخل ×٢ لمدة ٦٠ ثانية! 🔥'); Snd.fanfare();
    });
    $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.closeModal(); });
    // منع المودال من تمرير اللمس للعبة
    $('#modal').addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  },
  set(id, v) { if (this.last[id] !== v) { this.last[id] = v; $(id).textContent = v; } },
  update() {
    this.set('#money', fmt(G.shown));
    const base = CFG.fameLevelDiv * Math.pow(G.level - 1, 2), next = CFG.fameLevelDiv * Math.pow(G.level, 2);
    const fr = clamp((G.fame - base) / (next - base), 0, 1);
    const w = Math.round(fr * 100) + '%';
    if (this.last.fame !== w) { this.last.fame = w; $('#fameFill').style.width = w; }
    this.set('#lvlTxt', 'مستوى ' + fmt(G.level));
    const b = $('#btnBonus');
    let label, dis = false;
    if (G.t < G.boostUntil) { label = '×٢ ' + AR(Math.ceil(G.boostUntil - G.t)) + 'ث'; dis = true; }
    else if (G.boostCd > 0) { label = 'جاهزة بعد ' + AR(Math.ceil(G.boostCd)) + 'ث'; dis = true; }
    else label = 'مكافأة مجانية';
    if (this.last.bonus !== label) { this.last.bonus = label; b.textContent = label; b.disabled = dis; b.classList.toggle('alert', !dis); }
    // لمّا تكفي الفلوس لترقية يظهر تنبيه
    const can = CFG.upgrades.some(u => G.up[u.k] < u.max && G.money >= upCost(u));
    const u = $('#btnUp'); if (this.last.can !== can) { this.last.can = can; u.classList.toggle('alert', can); }
  },
  banner(t) {
    const b = $('#banner'); b.textContent = t; b.classList.add('show');
    clearTimeout(this._bannerT); this._bannerT = setTimeout(() => b.classList.remove('show'), 3500);
  },
  toast(t) {
    const b = $('#toast'); b.textContent = t; b.classList.add('show');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => b.classList.remove('show'), 2200);
  },
  openModal(html) { G.paused = true; $('#sheet').innerHTML = html; $('#modal').classList.remove('hidden'); },
  closeModal() { $('#modal').classList.add('hidden'); G.paused = false; saveGame(); },
  upEffect(u) {
    const l = G.up[u.k];
    switch (u.k) {
      case 'speed': return 'السرعة: ' + AR(Math.round((CFG.player.speed + l * CFG.player.speedPerLvl) / CFG.player.speed * 100)) + '٪ ← ' + AR(Math.round((CFG.player.speed + (l + 1) * CFG.player.speedPerLvl) / CFG.player.speed * 100)) + '٪';
      case 'cap': return 'يشيل ' + AR(CFG.player.cap + l) + ' ← ' + AR(CFG.player.cap + l + 1);
      case 'prep': return 'زمن التحضير: ' + AR(Math.round(Math.max(0.35, 1 - 0.06 * l) * 100)) + '٪ ← ' + AR(Math.round(Math.max(0.35, 1 - 0.06 * (l + 1)) * 100)) + '٪';
      case 'price': return 'سعر البيع: ' + AR(100 + 12 * l) + '٪ ← ' + AR(100 + 12 * (l + 1)) + '٪';
      case 'pat': return 'صبر الزبون: ' + AR(Math.round(CFG.customers.patience + 2.5 * l)) + 'ث ← ' + AR(Math.round(CFG.customers.patience + 2.5 * (l + 1))) + 'ث';
      case 'ccap': return 'الكاونتر يشيل ' + AR(CFG.counter.cap + CFG.counter.capPerLvl * l) + ' ← ' + AR(CFG.counter.cap + CFG.counter.capPerLvl * (l + 1));
      case 'work': return 'سرعة العمال: ' + AR(100 + 10 * l) + '٪ ← ' + AR(100 + 10 * (l + 1)) + '٪';
    }
    return '';
  },
  openUpgrades() {
    const render = () => {
      let h = '<h2>تطوير المحل</h2>';
      for (const u of CFG.upgrades) {
        const l = G.up[u.k], max = l >= u.max, cost = upCost(u), can = G.money >= cost;
        h += '<div class="card"><div class="info"><div class="nm">' + u.name + ' — مستوى ' + AR(l) + '/' + AR(u.max) + '</div><div class="ef">' + (max ? 'وصلت للحد الأقصى' : this.upEffect(u)) + '</div></div>' +
          '<button class="buy ' + (max ? 'max' : can ? '' : 'no') + '" data-k="' + u.k + '">' + (max ? 'أقصى' : AR(cost) + ' ج') + '</button></div>';
      }
      h += '<button class="close" id="cl">تمام</button>';
      $('#sheet').innerHTML = h;
      $('#cl').onclick = () => { Snd.click(); this.closeModal(); };
      document.querySelectorAll('.buy').forEach(b => b.onclick = () => {
        const u = CFG.upgrades.find(x => x.k === b.dataset.k);
        if (G.up[u.k] >= u.max) return;
        const cost = upCost(u);
        if (G.money < cost) { Snd.buzz(); return; }
        G.money -= cost; G.shown = G.money; G.up[u.k]++; Snd.ding(); Snd.vibrate(15); this.toast('تم التطوير!');
        render();
      });
    };
    this.openModal(''); render();
  },
  openSettings() {
    const render = () => {
      const s = G.settings;
      $('#sheet').innerHTML = '<h2>الإعدادات</h2>' +
        '<div class="row"><span>الصوت</span><button class="sw ' + (s.sound ? '' : 'off') + '" id="s1">' + (s.sound ? 'شغّال' : 'مقفول') + '</button></div>' +
        '<div class="row"><span>الموسيقى</span><button class="sw ' + (s.music ? '' : 'off') + '" id="s2">' + (s.music ? 'شغّالة' : 'مقفولة') + '</button></div>' +
        '<div class="row"><span>الاهتزاز</span><button class="sw ' + (s.vib ? '' : 'off') + '" id="s3">' + (s.vib ? 'شغّال' : 'مقفول') + '</button></div>' +
        '<div class="row"><span>مسح التقدّم</span><button class="sw danger" id="s4">امسح</button></div>' +
        '<button class="close" id="cl">تمام</button>';
      $('#s1').onclick = () => { s.sound = !s.sound; applySettings(); render(); };
      $('#s2').onclick = () => { s.music = !s.music; applySettings(); render(); };
      $('#s3').onclick = () => { s.vib = !s.vib; applySettings(); render(); };
      $('#s4').onclick = () => { if (confirm('متأكد؟ هتمسح كل التقدّم.')) resetGame(); };
      $('#cl').onclick = () => { Snd.click(); this.closeModal(); };
    };
    this.openModal(''); render();
  },
  openOffline(earn) {
    this.openModal('<h2>أهلًا بيك تاني!</h2><div style="text-align:center;font-size:20px;font-weight:800;margin:8px 0 14px">وانت غايب المحل كسب<br><span style="font-size:34px;color:#1F6B4A">' + fmt(earn) + ' ج</span></div><button class="close" id="cl">استلم</button>');
    $('#cl').onclick = () => { Snd.ding(); this.closeModal(); };
  },
};
function applySettings() { Snd.on = G.settings.sound; Snd.music = G.settings.music; Snd.vib = G.settings.vib; saveGame(); }
