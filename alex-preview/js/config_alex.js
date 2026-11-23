/* ===================== مرحلة اسكندرية — عربية الكبدة (نموذج أولي) =====================
   تتحمّل بعد config.js فقط عندما ?stage=alex، وتعدّل CFG في مكانه. */
(function () {
  if (new URLSearchParams(location.search).get('stage') !== 'alex') return;

  CFG.stageId = 'alex';
  CFG.bg = 'street_alex';
  CFG.travel = { url: location.pathname, label: '🚌 الحارة' };
  CFG.currentStage = 'stage_alex';
  CFG.storeKey = 'foul_tameya_alex_v1';
  document.title = 'كبدة اسكندراني — فول وطعمية';
  const ls = document.querySelector('#loading .lsub'); if (ls) ls.textContent = 'جاري تسخين الطاسة...';

  // أصناف المرحلة
  CFG.breadType = 'fino';
  CFG.products = { sandwich_kebda: 15, sandwich_sogo: 18, sandwich_fries: 12, sandwich_mix: 22 };
  CFG.fillToSandwich = { kebda_pan: 'sandwich_kebda', sogo_pan: 'sandwich_sogo', fries: 'sandwich_fries', mix_pan: 'sandwich_mix' };

  // المحطات: نفس الميكانيكا، محتوى سكندراني
  const st = CFG.stations;
  st.foul.prod = 'sandwich_kebda'; st.foul.prodChain = 'kebda_pan'; st.foul.sprite = 'liver_cart'; st.foul.sandwich = 'sandwich_kebda';
  st.bread.prod = 'fino';
  st.tameya.prod = 'sogo_pan'; st.tameya.sandwich = 'sandwich_sogo';
  st.fries.prod = 'fries'; st.fries.sandwich = 'sandwich_fries';
  st.eggplant.prod = 'mix_pan'; st.eggplant.sandwich = 'sandwich_mix';

  /* ===== تخطيط الكورنيش (خلفية v2): كل حاجة على الرصيف، واسع ومترتب ===== */
  // منطقة المشي: الرصيف بين السور/المحلات (فوق) وحرف الطريق (تحت)
  CFG.poly = [[0, 1490], [400, 1460], [800, 1390], [1200, 1240], [1600, 1090], [2000, 980], [2400, 825], [2400, 650], [2200, 590], [2000, 540], [1800, 490], [1600, 440], [1400, 340], [1200, 380], [1000, 420], [800, 470], [600, 510], [400, 570], [200, 650], [0, 710]];
  CFG.spawn = { x: 60, y: 1450 };
  CFG.gate = { x: 520, y: 1380 };
  CFG.start = { x: 1200, y: 950 };
  CFG.corridorY = 940;
  CFG.leavePath = [[900, 1340], [450, 1430], [120, 1450]];

  // عربية الكبدة في قلب الرصيف — بعيدة عن السور وعن اللمبة وحواليها فراغ للمشي
  st.foul.x = 880; st.foul.y = 1010; st.foul.pickup = { x: 976, y: 1066, r: 72 };
  // باقي المحطات على امتداد السور والمحلات
  st.bread.x = 980; st.bread.y = 660; st.bread.pickup = { x: 980, y: 745, r: 60 };
  st.wrap.x = 1360; st.wrap.y = 820; st.wrap.input = { x: 1285, y: 905, r: 55 }; st.wrap.pickup = { x: 1435, y: 905, r: 55 };
  st.tameya.x = 1750; st.tameya.y = 740; st.tameya.pickup = { x: 1750, y: 825, r: 60 };
  st.fries.x = 1890; st.fries.y = 770; st.fries.pickup = { x: 1890, y: 855, r: 60 };
  st.eggplant.x = 2160; st.eggplant.y = 755; st.eggplant.pickup = { x: 2160, y: 835, r: 60 };

  // الكاونتر والكاشير في النص الأعمق من الرصيف، والطابور ماشي مع الحرف
  CFG.counter = Object.assign(CFG.counter, { x: 1100, y: 1120, drop: { x: 1110, y: 830, r: 72 } });
  CFG.queue = { x: 1100, y: 1210, dx: -68, dy: 22, max: 6 };
  CFG.desk = Object.assign(CFG.desk, { x: 1560, y: 1100, pileX: 1560, pileY: 915, zone: { x: 1560, y: 845, r: 85 } });
  CFG.trash = Object.assign(CFG.trash, { x: 240, y: 1150, zone: { x: 420, y: 945, r: 80 } });

  CFG.padSpots = { A: [540, 1070], B: [760, 1260] };
  CFG.WORKER_POSITIONS = {
    carrier: { sheet: 'delivery', x: 1100, y: 1010 },
    cleaner: { sheet: 'helper', x: 600, y: 1360 },
    cook: { sheet: 'cook', x: 1360, y: 960 },
    cashier: { sheet: 'cashier', x: 1495, y: 850 },
  };

  // ترابيزتين بس في آخر الرصيف العالي ناحية البحر — لوحدهم بعيد عن الزحمة
  CFG.tables[2].x = 730; CFG.tables[2].y = 630;
  CFG.tables[3].x = 900; CFG.tables[3].y = 600;
  CFG.tables = [CFG.tables[2], CFG.tables[3]];

  // حواجز العناصر المحروقة في الخلفية (لمبة، دكك، بلاطات النخل، بوص)
  CFG.extraBlocks = [
    [620, 870, 90, 70],
    [165, 1060, 260, 100],
    [1470, 410, 360, 80],
    [1280, 530, 200, 100],
    [55, 1290, 130, 140],
    [1600, 460, 110, 80],
    [1800, 520, 110, 80],
    [2060, 570, 110, 80],
  ];

  // العربيات على الطريق نفسه: دخول من حرف الطريق يمين، خروج من تحت — زي الحارة
  CFG.traffic = Object.assign(CFG.traffic, {
    lanes: [{ x0: 2500, y0: 1050, x1: 240, y1: 1860 }, { x0: 2500, y0: 1210, x1: 685, y1: 1860 }],
    stop: { x: 1800, lane: 0 },
    window: { x: 1800, y: 890, r: 85 },
  });

  // ديكور خفيف (النخل واللمبة والدكك مرسومين في الخلفية نفسها)
  CFG.carpetPos = [1150, 950, 240];
  CFG.decor = [
    ['props', 'crates_wood', 170, 1380, 120, '', 112, 0, true, 0, false],
    ['props', 'boxes_cardboard', 2250, 720, 110, '', 100, 0, true, 0, false],
    ['props', 'bunting', 950, 500, 600, 'decor', 283, 0, true, 0, false],
    ['props', 'lantern_a', 620, 640, 40, 'decor', 105, 0, true, 0, false],
  ];

  CFG.stationInfo = {
    foul: { name: 'عربية الكبدة', price: '١٥ ج للسندوتش' },
    bread: { name: 'محطة الفينو' },
    wrap: { name: 'منضدة التجهيز' },
    tameya: { name: 'طاسة السجق', price: '١٨ ج للسندوتش' },
    fries: { name: 'محطة البطاطس', price: '١٢ ج للسندوتش' },
    eggplant: { name: 'طاسة المشكل', price: '٢٢ ج للسندوتش' },
  };

  // أسماء المشتريات (نفس التسلسل والأسعار تقريبًا)
  const padNames = {
    bread_wrap: 'الفينو والتجهيز', tameya: 'طاسة السجق', table: 'ترابيزة على البحر',
    carrier: 'صبي التوصيل', trash: 'الزبالة وعامل نظافة', cook: 'أسطى التجهيز',
    rack: 'رف عرض إضافي', fries: 'محطة البطاطس', cashier: 'كاشير',
    eggplant: 'طاسة المشكل', decor: 'زينة الكورنيش', window: 'شباك التوك توك', branch: 'فرع الميامي',
  };
  let ti = 0;
  for (const p of CFG.pads) { p.name = padNames[p.id] === 'ترابيزة على البحر' ? 'ترابيزة على البحر ' + '١٢٣٤٥٦'[ti++] : (padNames[p.id] || p.name); }

  // زباين اسكندرية
  CFG.customers.types = [
    { id: 'fisherman', sheet: 'cust_man', w: 25, pat: 1.2, tip: 1.3, maxOrder: 3 },
    { id: 'student', sheet: 'cust_man', w: 25, pat: 1, tip: 0.9, maxOrder: 2 },
    { id: 'family', sheet: 'cust_woman', w: 25, pat: 1, tip: 1, maxOrder: 3 },
    { id: 'hajj', sheet: 'cust_elder', w: 15, pat: 1.8, tip: 1, maxOrder: 1 },
    { id: 'tourist', sheet: 'cust_woman', w: 10, pat: 0.5, tip: 2.5, maxOrder: 2 },
  ];

  // أحداث سكندرية بدل أحداث الحارة
  CFG.eventsReplace = true;
  CFG.customEvents = [
    { id: 'nawwa', txt: 'نوّة على اسكندرية! البحر هايج 🌊', dur: 30, spawn: 0.5, income: 1.2, pat: 1.3 },
    { id: 'masayef', txt: 'زحمة المصايف! الكورنيش مليان 🏖️', dur: 35, spawn: 1.8, income: 1.3 },
    { id: 'tram', txt: 'الترام عدّى! وقفة صغيرة 🚋', dur: 8, pause: true },
    { id: 'itihad', txt: 'ماتش الاتحاد السكندري! ⚽', dur: 35, spawn: 1.5, income: 1.2 },
    { id: 'sayadeen', txt: 'الصيادين راجعين من البحر! طلبات كبيرة 🐟', dur: 25, spawn: 1.6, income: 1.4 },
    { id: 'shalil', txt: 'ريح شليل.. الزباين صبرها قليل', dur: 25, pat: 0.7, spawn: 0.9 },
    { id: 'power', txt: 'الكهربا فصلت!', dur: 8, pause: true },
    { id: 'gas', txt: 'الأنبوبة بتخلص! جري عليها', dur: 20, slow: 1.6, gas: true },
    { id: 'bday', txt: 'عيد ميلاد زبون! طلب كبير 🎂', dur: 25, bday: true },
    { id: 'cat', txt: 'قطة الكورنيش جعانة.. قف جنبها', dur: 25, cat: true },
  ];


  // كلام الزباين في اسكندرية
  CFG.speech = [
    'بسرعة يا أسطى!',
    'حط شطة أكتر يا معلم',
    'ريحة الكبدة واصلة للبحر',
    'واحد كبدة وواحد سجق',
    'تسلم إيدك يا ابني',
    'الهوا باين والطاسة سخنة',
  ];

  // بدون مشاريع جانبية في النموذج الأولي
  CFG.businesses = [];
  CFG.customWorkers = [];
})();
