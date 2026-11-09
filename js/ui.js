'use strict';
/* ===================== الواجهة (DOM) ===================== */
const $ = (s) => document.querySelector(s);
const AR = (n) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

const UI = {
  _bannerT: null, _toastT: null, last: {}, menuActive: true, pendingOffline: 0,
  init() {
    $('#menuContinue').addEventListener('click', () => this.startGame());
    $('#menuNew').addEventListener('click', () => { if (confirm('هتخسر كل تقدمك والفلوس والتطويرات، متأكد؟')) resetGame(); });
    $('#menuHelp').addEventListener('click', () => this.openHowTo());
    $('#menuSettings').addEventListener('click', () => this.openSettings());
    $('#gear').addEventListener('click', () => { Snd.init(); Snd.click(); this.openSettings(); });
    canvas.addEventListener('click', (e) => { if (G.paused || this.menuActive) return; const r = canvas.getBoundingClientRect(); const wx = (e.clientX-r.left)*DPR; const wy = (e.clientY-r.top)*DPR; const x = (wx-W/2)/K+cam.x, y = (wy-H/2)/K+cam.y; for (const key in S) { const st=S[key]; if (Math.hypot(x-st.x,y-st.y)<Math.max(85,st.w*.55)) { this.openStationInfo(st); break; } } });
    $('#btnGoals').addEventListener('click', () => this.openGoals());
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
  openGoals() { const dishes=G.dailyDishes||0, happy=G.dailyHappy||0; this.openModal('<h2>أهداف اليوم</h2><div class="card"><div class="info"><div class="nm">قدّم ٥٠ طبق</div><div class="ef">'+AR(Math.min(50,dishes))+' / ٥٠</div></div><b>'+(dishes>=50?'✓':'…')+'</b></div><div class="card"><div class="info"><div class="nm">رضّي ١٠ زباين</div><div class="ef">'+AR(Math.min(10,happy))+' / ١٠</div></div><b>'+(happy>=10?'✓':'…')+'</b></div><div class="card"><div class="info"><div class="nm">إنجاز إجمالي</div><div class="ef">'+AR(G.servedTotal||0)+' زبون تم خدمتهم</div></div></div><button class="close" id="goalClose">تمام</button>'); $('#goalClose').onclick=()=>this.closeModal(); },
  openStationInfo(st) { const names={foul:'عربية الفول',bread:'محطة العيش',wrap:'منضدة التجهيز',tameya:'وقدة الطعمية',fries:'محطة البطاطس',eggplant:'محطة الباذنجان'}; const stock=st.key==='wrap' ? (st.bread+' عيش / '+st.fillTotal+' حشوات / '+st.out.length+' جاهز') : (st.out.length+' من '+st.cap+''); const price=st.key==='foul'?'١٠ ج للسندوتش':st.key==='tameya'?'١٢ ج للسندوتش':st.key==='fries'?'١٤ ج للسندوتش':st.key==='eggplant'?'١٦ ج للسندوتش':'حسب الصنف'; this.openModal('<h2>'+names[st.key]+'</h2><div class="card"><div class="info"><div class="nm">المخزون</div><div class="ef">'+stock+'</div></div></div><div class="card"><div class="info"><div class="nm">سعر البيع</div><div class="ef">'+price+'</div></div></div><div class="card"><div class="info"><div class="nm">وقت التحضير</div><div class="ef">'+AR(st.cycle)+' ثانية تقريبًا</div></div></div><button class="close" id="stationClose">تمام</button>'); $('#stationClose').onclick=()=>this.closeModal(); },
  showMainMenu(hasSave) { $('#menuContinue').textContent = hasSave ? 'كمّل اللعب' : 'ابدأ اللعب'; $('#mainMenu').classList.remove('hidden'); G.paused = true; this.menuActive = true; },
  startGame() { $('#mainMenu').classList.add('hidden'); this.menuActive = false; G.paused = false; Snd.init(); Snd.startMusic(); if (this.pendingOffline > 0) { addMoney(this.pendingOffline); G.shown = G.money; this.openOffline(this.pendingOffline); this.pendingOffline = 0; } else if (G.playT < 5) this.toast('حرّك المعلم بالجويستيك — الأكل بيتجمع لوحده'); },
  openBaz() { this.openModal('<h2>الباز</h2><div style="text-align:center;font-size:20px;font-weight:900;padding:12px">لله يا محسنين.. حاجة ببلاش يا معلم؟</div><div class="row"><button class="buy" id="bazYes">أوافق - ١٥ ج</button><button class="sw danger" id="bazNo">أرفض</button></div>'); let done = false; const finish = (ok) => { if (done) return; done = true; clearTimeout(this._bazTimer); finishBaz(ok); this.closeModal(); }; $('#bazYes').onclick = () => finish(true); $('#bazNo').onclick = () => finish(false); this._bazTimer = setTimeout(() => finish(false), 15000); },
  openHowTo() { this.openModal(`<h2>كيف تلعب؟</h2><div class="card"><b>١</b><span>استقبل الزبون وتابع طلبه</span></div><div class="card"><b>٢</b><span>جهّز السندوتشات من المحطات</span></div><div class="card"><b>٣</b><span>قدّم الطلب للكاونتر</span></div><div class="card"><b>٤</b><span>اجمع الفلوس من درج الكاشير</span></div><div class="card"><b>٥</b><span>طوّر المحل وافتح معدات وعمال</span></div><button class="close" id="howClose">فهمت</button>`); $('#howClose').onclick = () => this.closeModal(); },
  openModal(html) { G.paused = true; $('#sheet').innerHTML = html; $('#modal').classList.remove('hidden'); },
  closeModal() { $('#modal').classList.add('hidden'); G.paused = this.menuActive; if (!this.menuActive) saveGame(); },
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
        '<div class="row"><span>اللغة</span><button class="sw" id="sLang">العربية فقط</button></div>' +
        '<div class="row"><span>الاهتزاز</span><button class="sw ' + (s.vib ? '' : 'off') + '" id="s3">' + (s.vib ? 'شغّال' : 'مقفول') + '</button></div>' +
        '<div class="row"><span>مسح التقدّم</span><button class="sw danger" id="s4">امسح</button></div>' +
        '<button class="close" id="cl">تمام</button>';
      $('#s1').onclick = () => { s.sound = !s.sound; applySettings(); render(); };
      $('#s2').onclick = () => { s.music = !s.music; applySettings(); render(); };
      $('#s3').onclick = () => { s.vib = !s.vib; applySettings(); render(); };
      $('#sLang').onclick = () => { this.toast('اللغة المتاحة حاليًا: العربية'); };
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
