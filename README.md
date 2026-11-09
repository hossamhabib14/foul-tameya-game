# فول وطعمية — Foul & Tameya Tycoon

لعبة موبايل HTML (Arcade-Idle Tycoon) بزاوية إيزومترية وشخصيات متحركة.

## التشغيل
- افتح `index.html` بالنقر المزدوج (Chrome/Edge)، أو من VS Code بإضافة **Live Server** ثم افتح الرابط من الموبايل على نفس الشبكة.
- التحكم: اسحب بإصبعك (جويستيك عائم) أو WASD / الأسهم. كل شيء تلقائي بالتلامس.

## الملفات
- `js/config.js` — **كل الأرقام**: الأسعار، السرعات، المواضع، منطقة المشي، الترقيات، الأحداث. ابدأ منه لأي ضبط.
- `js/engine.js` — تحميل الصور والكاش، الجويستيك، الصوت (مولّد بالكود)، الحفظ.
- `js/render.js` — الرسم (الكاميرا، الأنيميشن، الفقاعات، لافتات الفتح).
- `js/game.js` — المنطق: المحطات، الزبائن، الكاونتر، الفلوس، العمال، الترابيزات، المرور، الأحداث.
- `js/ui.js`, `js/main.js`, `style.css`, `index.html` — الواجهة والتشغيل.
- `assets/` + `js/manifest.js` — الأصول (لا تغيّر أسماء الملفات).

## أهم مفاتيح الضبط في config.js
| المفتاح | معناه |
|---|---|
| `DEBUG` | `true` يرسم حدود المشي والتصادم والمسارات، ومفتاح `M` يضيف ١٠٠٠٠ ج |
| `ZOOM` | تكبير الكاميرا (٠٫٥ افتراضي) |
| `CHAR_H`, `CUST_H` | طول الشخصيات في العالم |
| `WORK_SCALE` | تصغير صفوف "العمل" المقرّبة للكاشير والطباخ |
| `poly` | منطقة المشي (أي شيء خارجها ممنوع) |
| `stations.*` | مواضع ومناطق وسرعات المحطات |
| `pads[]` | ترتيب وأسعار الفتح |
| `customers.*` | معدل الظهور، الصبر، الأنواع |
| `upgrades[]`, `upgGrowth` | الترقيات وغلاء الأسعار |
| `events` | توقيت الأحداث المصرية |
| `traffic.lanes` | مسارات المركبات (من أعلى اليمين لأسفل اليسار فقط) |

## الحفظ
يتحفظ تلقائيًا كل ٥ ثواني في المتصفح (`localStorage`). من ⚙ يمكنك مسح التقدّم.


## Visual Refresh V2
- Refined the mobile HUD, modal panels, buttons, and main-menu surfaces with softer contrast and clearer spacing.
- Applied a warm, brighter color grade and light sharpening to all existing character sprite sheets while preserving alpha channels, sprite dimensions, and frame layout.
- Tuned the street background and title artwork for a warmer, more readable palette.
- Gameplay logic and asset paths were preserved.
- Validation: all JavaScript files pass `node --check`; all manifest asset paths resolve.
