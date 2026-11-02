// Tiny bilingual (English / Arabic) layer. English text lives in the HTML itself; it is remembered the
// first time the page loads, so only Arabic strings and dynamic (script-generated) strings are listed here.
(function () {
  var EN = {
    'status.COMPLIANT': 'Meets the pre-check', 'status.CONDITIONAL': 'Conditional', 'status.NON_COMPLIANT': 'Does not meet the pre-check',
    'band.overcrowded': 'Overcrowded', 'band.tight': 'Tight', 'band.standard': 'Standard', 'band.comfortable': 'Comfortable',
    'c.cap': 'Capacity by density', 'cap.dense': 'Dense (1.5 m²/person)', 'cap.standard': 'Standard (2.0)', 'cap.comfortable': 'Comfortable (2.5)',
    'c.actual': 'Your density', 'c.egress': 'Emergency exits', 'c.exits': 'Separate exits required', 'c.wtotal': 'Total clear exit width', 'c.weach': 'Width per exit', 'c.mindoor': 'Minimum door width',
    'c.fire': 'Fire safety', 'c.ext': 'Portable extinguishers', 'c.flame': 'Flame-retardant certificates needed for',
    'flame.booth_fabrics': 'Booth fabrics', 'flame.drapes_banners': 'Drapes and banners', 'flame.wood_panels': 'Wood panels', 'flame.foam_graphics': 'Foam and graphics', 'flame.carpets': 'Carpets',
    'c.alarm': 'Fire alarm system', 'c.sprinkler': 'Sprinkler coverage', 'c.emlight': 'Emergency lighting', 'c.signage': 'Illuminated exit signage',
    'c.outdoor': 'Outdoor measures', 'c.water': 'Water points', 'c.shade': 'Shade and cooling', 'c.weather': 'Weather and heat plan',
    'c.permits': 'Permit checklist', 'c.required': 'Required', 'c.optional': 'Optional', 'c.progress': 'Required items done', 'c.validate': 'Validate checklist',
    'c.missing': 'Missing required items', 'c.ready': 'All required items are in place', 'c.findings': 'Findings', 'c.none': 'No issues found',
    'auth.SECA': 'SECA: exhibitions and conferences', 'auth.GEA': 'GEA: entertainment', 'auth.CIVIL_DEFENSE': 'Civil Defense',
    'p.seca_licence': 'Event licence application', 'p.seca_floorplan': 'Approved floor plan and booth layout', 'p.seca_exhibitors': 'Exhibitor list', 'p.seca_contractor': 'Registered contractor documents', 'p.seca_insurance': 'Public liability insurance',
    'p.gea_licence': 'Event licence', 'p.gea_content': 'Content and programme approval', 'p.gea_security': 'Security and entry plan', 'p.gea_ticketing': 'Ticketing approval',
    'p.cd_safety_plan': 'Approved fire and safety plan', 'p.cd_evacuation': 'Evacuation plan and exit drawings', 'p.cd_flame_cert': 'Flame-retardant material certificates', 'p.cd_electrical': 'Electrical load and inspection report', 'p.cd_crowd_plan': 'Crowd management plan', 'p.cd_firstaid': 'First aid and ambulance plan', 'p.cd_outdoor_weather': 'Weather and heat mitigation plan',
    'f.OVER_MAX_CAPACITY': 'Expected crowd ({crowd}) is above the maximum of {max} people at 1.5 m² per person. Reduce the crowd or enlarge the space.',
    'f.OVER_SELECTED_DENSITY': 'Expected crowd ({crowd}) is above {max} people at the selected {density} m² per person. It fits only at a denser layout.',
    'f.OUTDOOR_HEAT_PLAN': 'Outdoor site: plan shade, cooling, drinking water and weather contingencies.',
    'f.SPRINKLERS_REQUIRED': 'An indoor area of {area} m² normally needs sprinkler coverage.',
    'f.LONG_DURATION': 'An event of {duration} days needs a staffing rota and daily safety inspections.',
    'role.EVENT_DIRECTOR': 'Event Director', 'role.ZONE_SUPERVISOR': 'Zone Supervisor', 'role.SAFETY': 'Safety', 'role.USHER': 'Ushering', 'role.FIRST_AID': 'First Aid',
    'cr.zone': 'Zone', 'cr.total': 'Total staff', 'cr.zones': 'Zones',
    'level.normal': 'Normal', 'level.busy': 'Busy', 'level.near': 'Near capacity', 'level.over': 'Over capacity', 'level.unknown': 'No capacity set',
    'status.PLANNED': 'Planned', 'status.ACTIVE': 'Active', 'status.ON_BREAK': 'On break', 'status.OFF_DUTY': 'Off duty',
    'cr.staffline': 'Staff', 'cr.noevents': 'No events yet. Create one with POST /api/event-projects.',
    'pf.area': 'm²', 'pf.noitems': 'No projects in this category.',
    'booth.loadfail': 'The 3D viewer could not load.',
    'err.network': 'Network error. Check your connection and try again.', 'err.generic': 'Something went wrong. Please try again.',
    'err.VALIDATION_ERROR': 'Please correct the highlighted fields.', 'err.ALREADY_REGISTERED': 'This email is already registered.',
    'err.OTP_COOLDOWN': 'Please wait {retryAfterSeconds} seconds before asking for another code.', 'err.INVALID_OTP': 'The code is wrong or expired.',
    'err.INVALID_OTP_LEFT': 'The code is wrong. Attempts left: {attemptsLeft}.', 'err.OTP_LOCKED': 'Too many wrong attempts. Request a new code.',
    'err.RATE_LIMITED': 'Too many requests. Please wait a few minutes.', 'err.UNAUTHORIZED': 'The operator key is not valid.', 'err.ADMIN_DISABLED': 'Operator access is not configured on this server.',
    'err.ALREADY_VERIFIED': 'This registration is already verified.', 'err.NOT_FOUND': 'Not found.',
    'r.resent': 'A new code was sent.',
    'c.title': 'Saudi compliance engine', 'c.person': 'person', 'cr.empty': 'Build a hierarchy to see the staffing tree.',
    'cat.exhibition': 'Exhibitions', 'cat.event': 'Events', 'cat.interior': 'Interior', 'cat.branding': 'Branding', 'c.checking': 'Checking…',
    'c.disclaimer': 'Pre-check calculated from configurable engineering defaults. It is not an official approval. Confirm the current official requirements.'
  };

  var AR = {
    'nav.skip': 'تخطَّ إلى المحتوى', 'nav.home': 'الرئيسية', 'nav.services': 'الخدمات', 'nav.portfolio': 'الأعمال', 'nav.booth': 'عارض البوث 3D', 'nav.compliance': 'محرك الامتثال', 'nav.crowd': 'إدارة الحشود', 'nav.register': 'انضم للفريق',
    'foot.tag': 'إدارة الفعاليات المؤسسية وبناء المعارض والتصميم الداخلي في المملكة العربية السعودية.', 'foot.vision': 'متوافقون مع رؤية السعودية 2030 ومعرض إكسبو 2030 الرياض.', 'foot.rights': 'جميع الحقوق محفوظة',
    'err.home': 'العودة إلى الرئيسية',
    'hero.eyebrow': 'رؤية 2030 · إكسبو 2030 الرياض', 'hero.title1': 'نصنع', 'hero.title2': 'تجارب استثنائية',
    'hero.sub': 'من الفكرة والتصميم ثلاثي الأبعاد إلى التنفيذ والطباعة وفرق الفعاليات الميدانية، تقدم NMR Events المعارض والمساحات الداخلية والفعاليات في أنحاء المملكة.',
    'hero.cta1': 'استكشف البوث ثلاثي الأبعاد', 'hero.cta2': 'افحص امتثال فعاليتك',
    'stat.years': 'سنوات من الخبرة', 'stat.projects': 'مشروع ناجح', 'stat.clients': 'عميل من الشركات',
    'services.title': 'ما نقدمه', 'services.sub': 'أربع خدمات مترابطة وفريق واحد مسؤول.',
    's.graphic.t': 'التصميم الجرافيكي والموشن جرافيك', 's.graphic.d': 'هوية بصرية ومواد دعائية وعروض ورسوم متحركة للشاشات والإطلاقات.',
    's.d3.t': 'التصميم ثلاثي الأبعاد: المعارض والداخلي', 's.d3.d': 'تصميم أجنحة ومسارح ومساحات داخلية مع مخططات CAD وملفات CNC جاهزة للتصنيع.',
    's.print.t': 'الطباعة والإعلان', 's.print.d': 'طباعة كبيرة الحجم ولوحات وتغليف وإعلانات خارجية، إنتاجاً وتركيباً.',
    's.event.t': 'إدارة الفعاليات وتنفيذها', 's.event.d': 'تنفيذ متكامل مع فرق ميدانية مدربة: استقبال وسلامة وإسعاف وإشراف مناطق.',
    'mod.title': 'أدوات رقمية لفعاليتك',
    'mod.booth.t': 'عارض البوث ثلاثي الأبعاد', 'mod.booth.d': 'دوِّر وافحص وغيّر إضاءة بوث أو مسرح مباشرة من المتصفح.',
    'mod.compliance.t': 'محرك الامتثال', 'mod.compliance.d': 'السعة والمخارج والسلامة من الحريق وقائمة تصاريح SECA وGEA والدفاع المدني.',
    'mod.crowd.t': 'إدارة الحشود', 'mod.crowd.d': 'هيكل الفريق ومراقبة السعة الحية للمواقع الداخلية والخارجية.',
    'mod.crew.t': 'تسجيل الفريق وبطاقة QR', 'mod.crew.d': 'سجّل وأكّد بريدك برمز تحقق واحصل على بطاقة موظف QR قابلة للتحقق.',
    'common.open': '← افتح',
    'pf.title': 'أعمال مختارة', 'pf.all': 'الكل', 'cat.exhibition': 'المعارض', 'cat.event': 'الفعاليات', 'cat.interior': 'الداخلي', 'cat.branding': 'الهوية', 'pf.note': 'نماذج توضيحية. استبدلها بأعمالكم الفعلية.',
    'cta.title': 'انضم إلى فريق NMR الميداني', 'cta.sub': 'سجّل وأكّد بريدك واحصل على بطاقة QR.',
    'booth.title': 'عارض البوث التفاعلي ثلاثي الأبعاد', 'booth.sub': 'اسحب للتدوير، وبالعجلة للتقريب، وبالزر الأيمن للتحريك. غيّر الإضاءة والخامة واللون لفحص التصميم.',
    'booth.nowebgl': 'تعذّر تشغيل WebGL في متصفحك أو جهازك، لذلك لا يتوفر العرض ثلاثي الأبعاد.', 'booth.hint': 'اسحب · قرّب · حرّك',
    'booth.model': 'النموذج', 'booth.light': 'الإضاءة', 'light.studio': 'استوديو', 'light.spot': 'كشافات', 'light.neon': 'نيون',
    'booth.material': 'الخامة', 'mat.matte': 'مطفأ', 'mat.gloss': 'لامع', 'mat.metal': 'معدني', 'mat.wood': 'خشبي', 'booth.color': 'لون العلامة',
    'booth.rotate': 'دوران تلقائي', 'booth.wire': 'هيكل سلكي', 'booth.screen': 'شاشة LED', 'booth.reset': 'إعادة الزاوية', 'booth.loadfail': 'تعذّر تحميل العارض ثلاثي الأبعاد.',
    'c.title': 'محرك الامتثال السعودي', 'c.sub': 'فحص أولي للفعالية: السعة والمخارج والسلامة من الحريق وقائمة تصاريح SECA وGEA والدفاع المدني.',
    'c.area': 'المساحة (م²)', 'c.crowd': 'عدد الحضور المتوقع', 'c.venue': 'طبيعة الموقع', 'venue.INDOOR': 'قاعة مغلقة', 'venue.OUTDOOR': 'مساحة مفتوحة',
    'c.event': 'نوع الفعالية', 'ev.exhibition': 'معرض', 'ev.conference': 'مؤتمر', 'ev.corporate': 'فعالية شركات', 'ev.entertainment': 'ترفيهية',
    'c.density': 'الكثافة', 'c.person': 'شخص', 'c.duration': 'المدة (أيام)', 'c.calc': 'احسب', 'c.empty': 'أدخل حجم الفعالية ثم اضغط احسب.',
    'status.COMPLIANT': 'يستوفي الفحص الأولي', 'status.CONDITIONAL': 'مشروط', 'status.NON_COMPLIANT': 'لا يستوفي الفحص الأولي',
    'band.overcrowded': 'ازدحام زائد', 'band.tight': 'مزدحم', 'band.standard': 'قياسي', 'band.comfortable': 'مريح',
    'c.cap': 'السعة حسب الكثافة', 'cap.dense': 'مزدحم (1.5 م²/شخص)', 'cap.standard': 'قياسي (2.0)', 'cap.comfortable': 'مريح (2.5)',
    'c.actual': 'كثافتك', 'c.egress': 'مخارج الطوارئ', 'c.exits': 'عدد المخارج المنفصلة المطلوبة', 'c.wtotal': 'إجمالي عرض المخارج الصافي', 'c.weach': 'العرض لكل مخرج', 'c.mindoor': 'أدنى عرض للباب',
    'c.fire': 'السلامة من الحريق', 'c.ext': 'طفايات الحريق المحمولة', 'c.flame': 'شهادات مقاومة اللهب مطلوبة لـ',
    'flame.booth_fabrics': 'أقمشة الأجنحة', 'flame.drapes_banners': 'الستائر واللافتات', 'flame.wood_panels': 'الألواح الخشبية', 'flame.foam_graphics': 'الفوم والرسومات', 'flame.carpets': 'السجاد',
    'c.alarm': 'نظام إنذار الحريق', 'c.sprinkler': 'تغطية الرشاشات', 'c.emlight': 'إضاءة الطوارئ', 'c.signage': 'لوحات المخارج المضيئة',
    'c.outdoor': 'إجراءات المواقع المفتوحة', 'c.water': 'نقاط مياه', 'c.shade': 'تظليل وتبريد', 'c.weather': 'خطة الطقس والحرارة',
    'c.permits': 'قائمة التصاريح', 'c.required': 'مطلوب', 'c.optional': 'اختياري', 'c.progress': 'البنود المطلوبة المنجزة', 'c.validate': 'تحقق من القائمة',
    'c.missing': 'بنود مطلوبة ناقصة', 'c.ready': 'جميع البنود المطلوبة مكتملة', 'c.findings': 'الملاحظات', 'c.none': 'لا توجد ملاحظات',
    'auth.SECA': 'SECA: المعارض والمؤتمرات', 'auth.GEA': 'GEA: الترفيه', 'auth.CIVIL_DEFENSE': 'الدفاع المدني',
    'p.seca_licence': 'طلب ترخيص الفعالية', 'p.seca_floorplan': 'المخطط المعتمد وتوزيع الأجنحة', 'p.seca_exhibitors': 'قائمة العارضين', 'p.seca_contractor': 'مستندات المقاول المسجل', 'p.seca_insurance': 'تأمين المسؤولية تجاه الغير',
    'p.gea_licence': 'ترخيص الفعالية', 'p.gea_content': 'اعتماد المحتوى والبرنامج', 'p.gea_security': 'خطة الأمن والدخول', 'p.gea_ticketing': 'اعتماد التذاكر',
    'p.cd_safety_plan': 'خطة السلامة والحريق المعتمدة', 'p.cd_evacuation': 'خطة الإخلاء ومخططات المخارج', 'p.cd_flame_cert': 'شهادات مقاومة اللهب للمواد', 'p.cd_electrical': 'تقرير الأحمال الكهربائية والفحص', 'p.cd_crowd_plan': 'خطة إدارة الحشود', 'p.cd_firstaid': 'خطة الإسعاف والإسعاف المتنقل', 'p.cd_outdoor_weather': 'خطة الطقس وتخفيف الحرارة',
    'f.OVER_MAX_CAPACITY': 'عدد الحضور المتوقع ({crowd}) يتجاوز الحد الأقصى {max} شخصاً عند 1.5 م² للفرد. قلّل الحضور أو وسّع المساحة.',
    'f.OVER_SELECTED_DENSITY': 'عدد الحضور المتوقع ({crowd}) يتجاوز {max} شخصاً عند الكثافة المختارة {density} م² للفرد. يتسع فقط بتوزيع أكثر ازدحاماً.',
    'f.OUTDOOR_HEAT_PLAN': 'موقع مفتوح: خطّط للتظليل والتبريد ومياه الشرب وبدائل الطقس.',
    'f.SPRINKLERS_REQUIRED': 'المساحة الداخلية {area} م² تحتاج عادةً إلى تغطية رشاشات.',
    'f.LONG_DURATION': 'فعالية مدتها {duration} يوماً تحتاج جدول مناوبات وفحص سلامة يومياً.',
    'c.disclaimer': 'فحص أولي محسوب بقيم هندسية قابلة للضبط، وليس اعتماداً رسمياً. راجع متطلبات الجهات الرسمية الحالية.',
    'cr.title': 'إدارة الحشود', 'cr.sub': 'خطّط للتنظيم الميداني وراقب السعة لحظياً.', 'cr.plan': 'مخطط الكوادر', 'cr.build': 'ابنِ الهيكل', 'cr.empty': 'ابنِ الهيكل لعرض شجرة الكوادر.',
    'cr.monitor': 'مراقبة السعة الحية', 'cr.monitor.sub': 'للمشغّلين فقط. يتحدّث كل 3 ثوانٍ.', 'cr.key': 'مفتاح المشغّل', 'cr.connect': 'اتصال', 'cr.select': 'الفعالية',
    'role.EVENT_DIRECTOR': 'مدير الفعالية', 'role.ZONE_SUPERVISOR': 'مشرف منطقة', 'role.SAFETY': 'السلامة', 'role.USHER': 'الاستقبال', 'role.FIRST_AID': 'الإسعاف',
    'cr.zone': 'المنطقة', 'cr.total': 'إجمالي الكوادر', 'cr.zones': 'المناطق',
    'level.normal': 'طبيعي', 'level.busy': 'مزدحم', 'level.near': 'قارب السعة', 'level.over': 'تجاوز السعة', 'level.unknown': 'لم تُحدد السعة',
    'status.PLANNED': 'مخطط', 'status.ACTIVE': 'على رأس العمل', 'status.ON_BREAK': 'استراحة', 'status.OFF_DUTY': 'خارج الدوام',
    'cr.staffline': 'الكوادر', 'cr.noevents': 'لا توجد فعاليات بعد. أنشئ واحدة عبر POST /api/event-projects.',
    'pf.area': 'م²', 'pf.noitems': 'لا توجد مشاريع في هذه الفئة.',
    'r.title': 'تسجيل الفريق', 'r.sub': 'سجّل، ثم أكّد بريدك برمز من 6 أرقام، لتحصل على بطاقة موظف QR.',
    'r.step1': '1 · البيانات', 'r.step2': '2 · التحقق', 'r.step3': '3 · البطاقة',
    'r.name': 'الاسم الكامل', 'r.dob': 'تاريخ الميلاد', 'r.email': 'البريد الإلكتروني', 'r.bio': 'نبذة قصيرة', 'r.exp': 'الخبرات', 'r.submit': 'أرسل رمز التحقق',
    'r.otp.title': 'أدخل الرمز المكوّن من 6 أرقام', 'r.otp.sub': 'أرسلنا رمزاً إلى', 'r.demo': 'وضع التجربة: رمزك هو', 'r.code': 'رمز التحقق', 'r.verify': 'تحقق واحصل على البطاقة', 'r.resend': 'إعادة إرسال الرمز', 'r.resent': 'تم إرسال رمز جديد.',
    'r.done.title': 'اكتمل التسجيل', 'r.done.sub': 'رقم التتبع وبطاقة QR جاهزان.', 'r.view': 'افتح بطاقتي',
    'b.verified': 'موثّق', 'b.unverified': 'غير موثّق', 'b.title': 'بطاقة الفريق الرسمية', 'b.id': 'رقم التتبع', 'b.issued': 'تاريخ التوثيق', 'b.privacy': 'بيانات التواصل مخفية جزئياً لحماية خصوصية صاحب البطاقة.', 'b.print': 'اطبع البطاقة',
    'err.network': 'خطأ في الشبكة. تحقق من الاتصال وحاول مجدداً.', 'err.generic': 'حدث خطأ. حاول مرة أخرى.',
    'err.VALIDATION_ERROR': 'يرجى تصحيح الحقول المظللة.', 'err.ALREADY_REGISTERED': 'هذا البريد مسجّل مسبقاً.',
    'err.OTP_COOLDOWN': 'انتظر {retryAfterSeconds} ثانية قبل طلب رمز جديد.', 'err.INVALID_OTP': 'الرمز خاطئ أو منتهي.',
    'err.INVALID_OTP_LEFT': 'الرمز خاطئ. المحاولات المتبقية: {attemptsLeft}.', 'err.OTP_LOCKED': 'محاولات خاطئة كثيرة. اطلب رمزاً جديداً.',
    'err.RATE_LIMITED': 'طلبات كثيرة. انتظر بضع دقائق.', 'err.UNAUTHORIZED': 'مفتاح المشغّل غير صحيح.', 'err.ADMIN_DISABLED': 'وصول المشغّلين غير مهيأ على هذا الخادم.',
    'err.ALREADY_VERIFIED': 'هذا التسجيل موثّق مسبقاً.', 'err.NOT_FOUND': 'غير موجود.', 'c.checking': 'جارٍ الفحص…'
  };

  var D = { en: EN, ar: AR };
  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  var listeners = [];

  function t(key, vars) {
    var s = (D[lang] && D[lang][key]) || EN[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent; // remember the English source once
      var key = el.getAttribute('data-i18n');
      el.textContent = lang === 'ar' ? (AR[key] || el.dataset.en) : (EN[key] || el.dataset.en);
    });
    var toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'ar' ? 'English' : 'العربية';
  }

  function setLang(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    try { localStorage.setItem('nmr-lang', lang); } catch (e) { /* storage blocked */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    apply();
    listeners.forEach(function (fn) { fn(lang); });
  }

  window.NMR = {
    t: t,
    apply: apply,
    setLang: setLang,
    getLang: function () { return lang; },
    onLang: function (fn) { listeners.push(fn); },
    dict: D,
  };
  apply();
})();
