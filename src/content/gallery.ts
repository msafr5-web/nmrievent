// مولَّد من ملف تعريف الشركة (Company Profile 2026) — الصور في public/images/works
export type GalleryCategory = "booths" | "staff" | "crowd" | "printing" | "design3d" | "graphics";

export type GalleryItem = {
  id: string;
  category: GalleryCategory;
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const galleryCategories: { id: GalleryCategory; label: string; lead: string }[] = [
  { id: "booths", label: "الأجنحة والمعارض", lead: "تصميم وتنفيذ أجنحة معارض وتفعيلات في المعارض والمتاجر." },
  { id: "staff", label: "الكوادر والمضيفون", lead: "فرق ضيافة وتنظيم وأمن بالزي الرسمي والتراثي." },
  { id: "crowd", label: "إدارة الحشود", lead: "تنظيم الدخول والبوابات والطوابير في الفعاليات المفتوحة." },
  { id: "printing", label: "الطباعة واللوحات", lead: "طباعة كبيرة الحجم ولوحات إرشادية وتسجيل لفعالية كاملة." },
  { id: "design3d", label: "التصميم ثلاثي الأبعاد", lead: "تصاميم أجنحة وديكورات داخلية مع الرسومات التنفيذية." },
  { id: "graphics", label: "التصميم الجرافيكي والهوية", lead: "هويات بصرية وتغليف ومطبوعات ومواقع وإعلانات." },
];

export const gallery: GalleryItem[] = [
  {"id":"alakaria-wide","category":"booths","src":"/images/works/booths/alakaria-wide.webp","width":1060,"height":755,"alt":"جناح العقارية في معرض عقاري — منظور عام للجناح"},
  {"id":"alakaria-facade","category":"booths","src":"/images/works/booths/alakaria-facade.webp","width":1060,"height":755,"alt":"جناح العقارية — واجهة الجناح وشاشة العرض"},
  {"id":"alakaria-models","category":"booths","src":"/images/works/booths/alakaria-models.webp","width":1060,"height":755,"alt":"جناح العقارية — طاولات المجسمات العقارية"},
  {"id":"ferrero-arches","category":"booths","src":"/images/works/booths/ferrero-arches.webp","width":1185,"height":833,"alt":"تفعيل داخل متجر: أقواس ذهبية بزخارف إسلامية لعرض منتجات فيريرو"},
  {"id":"wadi-hanifah","category":"booths","src":"/images/works/booths/wadi-hanifah.webp","width":1432,"height":559,"alt":"جناح وادي حنيفة بشاشة عرض ومجسم تفاعلي"},
  {"id":"jetour-booth","category":"booths","src":"/images/works/booths/jetour-booth.webp","width":1060,"height":755,"alt":"جناح جيتور بإطار إضاءة نيون وسيارة العرض"},
  {"id":"jetour-booth-wide","category":"booths","src":"/images/works/booths/jetour-booth-wide.webp","width":1060,"height":755,"alt":"جناح جيتور — منظور عام بإضاءة ملونة"},
  {"id":"astra-kiosk","category":"booths","src":"/images/works/booths/astra-kiosk.webp","width":1410,"height":690,"alt":"كشك أسترا: التصميم ثلاثي الأبعاد بجوار التنفيذ الفعلي"},
  {"id":"alzan-booth","category":"booths","src":"/images/works/booths/alzan-booth.webp","width":1060,"height":755,"alt":"جناح الزان لتجارة مواد البناء"},
  {"id":"green-arches-booth","category":"booths","src":"/images/works/booths/green-arches-booth.webp","width":1060,"height":755,"alt":"جناح بأقواس خضراء وذهبية مضاءة"},
  {"id":"green-arches-side","category":"booths","src":"/images/works/booths/green-arches-side.webp","width":1057,"height":749,"alt":"جناح بأقواس خضراء وذهبية — منظور جانبي"},
  {"id":"green-arches-corner","category":"booths","src":"/images/works/booths/green-arches-corner.webp","width":1057,"height":749,"alt":"جناح بأقواس خضراء وذهبية — ركن الاستقبال"},
  {"id":"alakaria-ballroom","category":"booths","src":"/images/works/booths/alakaria-ballroom.webp","width":1057,"height":749,"alt":"جناح العقارية داخل قاعة فندقية بإضاءة سفلية"},
  {"id":"alakaria-ballroom-front","category":"booths","src":"/images/works/booths/alakaria-ballroom-front.webp","width":1057,"height":749,"alt":"جناح العقارية داخل القاعة — الواجهة الرئيسية"},
  {"id":"alakaria-ballroom-side","category":"booths","src":"/images/works/booths/alakaria-ballroom-side.webp","width":1057,"height":749,"alt":"جناح العقارية داخل القاعة — منظور جانبي"},
  {"id":"mdp-booth","category":"booths","src":"/images/works/booths/mdp-booth.webp","width":1057,"height":749,"alt":"جناح mdp بواجهات زجاجية وإضاءة زرقاء"},
  {"id":"interactive-screens-booth","category":"booths","src":"/images/works/booths/interactive-screens-booth.webp","width":1063,"height":680,"alt":"جناح بشاشات عرض تفاعلية وأكشاك خدمة ذاتية"},
  {"id":"tanweel-booth","category":"booths","src":"/images/works/booths/tanweel-booth.webp","width":1057,"height":749,"alt":"جناح تنويل بسقف معلّق وإضاءة بنفسجية"},
  {"id":"advance-method-booth","category":"booths","src":"/images/works/booths/advance-method-booth.webp","width":1057,"height":749,"alt":"جناح أدفانس ميثود بسقف معلّق وإضاءة محيطية"},
  {"id":"studio-set","category":"booths","src":"/images/works/booths/studio-set.webp","width":1005,"height":753,"alt":"ديكور استوديو تصوير بخلفية زرقاء وكاونتر استقبال"},
  {"id":"ksu-booth","category":"booths","src":"/images/works/booths/ksu-booth.webp","width":1057,"height":749,"alt":"جناح جامعة الملك سعود في معرض دولي"},
  {"id":"team-black-vests","category":"staff","src":"/images/works/staff/team-black-vests.webp","width":1600,"height":745,"alt":"فريق ميداني متكامل بالزي الرسمي"},
  {"id":"staff-assisting-visitor","category":"staff","src":"/images/works/staff/staff-assisting-visitor.webp","width":1397,"height":991,"alt":"عضو فريق يساعد زائرًا على جهاز التسجيل"},
  {"id":"hosts-white-sashes","category":"staff","src":"/images/works/staff/hosts-white-sashes.webp","width":1600,"height":557,"alt":"مضيفون ومضيفات بالوشاح الأبيض أمام شاشة العرض"},
  {"id":"heritage-hosts","category":"staff","src":"/images/works/staff/heritage-hosts.webp","width":1600,"height":777,"alt":"فريق ضيافة بالزي التراثي عند مدخل فعالية المعهد الملكي للفنون التقليدية"},
  {"id":"security-team","category":"staff","src":"/images/works/staff/security-team.webp","width":1600,"height":869,"alt":"فريق الأمن والسلامة بالزي الرسمي"},
  {"id":"traditional-arts-hosts","category":"staff","src":"/images/works/staff/traditional-arts-hosts.webp","width":1600,"height":965,"alt":"فريق الضيافة في معرض الفنون التقليدية السعودية"},
  {"id":"taste-barriers","category":"crowd","src":"/images/works/crowd/taste-barriers.webp","width":1423,"height":967,"alt":"تنظيم الدخول بحواجز مطبوعة في فعالية ذا تيست أوف ذا وورلد"},
  {"id":"runners-entry-control","category":"crowd","src":"/images/works/crowd/runners-entry-control.webp","width":613,"height":819,"alt":"فريق ينظم دخول المشاركين في فعالية جري"},
  {"id":"gate-control","category":"crowd","src":"/images/works/crowd/gate-control.webp","width":1205,"height":819,"alt":"ضبط الدخول عند بوابة الفعالية"},
  {"id":"red-carpet-entrance","category":"crowd","src":"/images/works/crowd/red-carpet-entrance.webp","width":1435,"height":975,"alt":"تنظيم الدخول عند مدخل بالسجاد الأحمر والعواميد"},
  {"id":"emf-north-entrance","category":"printing","src":"/images/works/printing/emf-north-entrance.webp","width":1600,"height":1002,"alt":"لافتة كبيرة الحجم عند المدخل الشمالي لملتقى الطب التجميلي"},
  {"id":"emf-outdoor-banners","category":"printing","src":"/images/works/printing/emf-outdoor-banners.webp","width":1600,"height":1003,"alt":"لافتات خارجية ومجسم عند مدخل ملتقى الطب التجميلي"},
  {"id":"emf-backdrop","category":"printing","src":"/images/works/printing/emf-backdrop.webp","width":1600,"height":1004,"alt":"خلفية تصوير ومجسم زهرة لملتقى الطب التجميلي 2023"},
  {"id":"emf-hall-arch","category":"printing","src":"/images/works/printing/emf-hall-arch.webp","width":1600,"height":1002,"alt":"قوس مطبوع ولوحات داخل قاعة ملتقى الطب التجميلي"},
  {"id":"emf-registration-stands","category":"printing","src":"/images/works/printing/emf-registration-stands.webp","width":1600,"height":1004,"alt":"حاملان لتسجيل الزوار والورش برمز QR"},
  {"id":"emf-media-center","category":"printing","src":"/images/works/printing/emf-media-center.webp","width":1600,"height":1004,"alt":"المركز الإعلامي بطباعة مخصصة"},
  {"id":"emf-glass-facade","category":"printing","src":"/images/works/printing/emf-glass-facade.webp","width":1600,"height":1003,"alt":"طباعة على الواجهة الزجاجية لمدخل الملتقى"},
  {"id":"emf-screens-corridor","category":"printing","src":"/images/works/printing/emf-screens-corridor.webp","width":1600,"height":1006,"alt":"ممر الشاشات الرقمية ومنطقة التسجيل"},
  {"id":"emf-registration-desk","category":"printing","src":"/images/works/printing/emf-registration-desk.webp","width":1600,"height":1004,"alt":"كاونتر التسجيل بطباعة مخصصة"},
  {"id":"booth-concepts","category":"design3d","src":"/images/works/design3d/booth-concepts.webp","width":1600,"height":900,"alt":"ستة تصاميم ثلاثية الأبعاد لأجنحة معارض"},
  {"id":"technical-deliverables","category":"design3d","src":"/images/works/design3d/technical-deliverables.webp","width":1536,"height":1024,"alt":"مخرجات فنية: مساقط وواجهات وملفات CNC لجناح وكاونتر وبرجولا ومسرح"},
  {"id":"interior-board","category":"design3d","src":"/images/works/design3d/interior-board.webp","width":1600,"height":900,"alt":"لوحة تصميم داخلي لشقة سكنية: مسقط ومواد وألوان"},
  {"id":"web-portfolio","category":"graphics","src":"/images/works/graphics/web-portfolio.webp","width":1600,"height":900,"alt":"تصميم واجهة موقع لمحفظة أعمال إنتاج مرئي"},
  {"id":"summit-brochure","category":"graphics","src":"/images/works/graphics/summit-brochure.webp","width":1600,"height":900,"alt":"هوية وكتيّب ثلاثي الطيّات لقمة فعاليات بالرياض"},
  {"id":"purple-stationery","category":"graphics","src":"/images/works/graphics/purple-stationery.webp","width":1600,"height":900,"alt":"طقم هوية مؤسسية: مظاريف ودفتر وبطاقة تعريفية وذاكرة USB"},
  {"id":"premium-box","category":"graphics","src":"/images/works/graphics/premium-box.webp","width":1600,"height":900,"alt":"علبة تغليف فاخرة بنقوش ذهبية"},
  {"id":"airport-baggage-ad","category":"graphics","src":"/images/works/graphics/airport-baggage-ad.webp","width":1070,"height":680,"alt":"إعلان على سير الحقائب في مطار"},
  {"id":"anova-identity","category":"graphics","src":"/images/works/graphics/anova-identity.webp","width":1145,"height":605,"alt":"هوية بصرية وأدوات مكتبية لأنوفا لتأجير السيارات"},
  {"id":"najdiyah-labels","category":"graphics","src":"/images/works/graphics/najdiyah-labels.webp","width":1095,"height":725,"alt":"تصميم أغطية وملصقات منتجات الألبان لنجدية"},
  {"id":"alahlia-insurance","category":"graphics","src":"/images/works/graphics/alahlia-insurance.webp","width":1095,"height":760,"alt":"تصميم عرض نظام تأمين الرعاية الصحية للأهلية للتأمين التعاوني"},
  {"id":"arwadh-packaging","category":"graphics","src":"/images/works/graphics/arwadh-packaging.webp","width":1150,"height":770,"alt":"تصميم علبة تغليف مغناطيسية لأرواض بمنظورات متعددة"},
  {"id":"almaha-logo","category":"graphics","src":"/images/works/graphics/almaha-logo.webp","width":800,"height":765,"alt":"مراحل تطوير شعار مدرسة المها الإنجليزية من الرسم الأولي إلى النسخة النهائية"},
  {"id":"gift-bags","category":"graphics","src":"/images/works/graphics/gift-bags.webp","width":1150,"height":765,"alt":"أكياس هدايا ورقية بهويات مؤسسية مختلفة"},
  {"id":"massage-chairs-web","category":"graphics","src":"/images/works/graphics/massage-chairs-web.webp","width":1160,"height":680,"alt":"تصميم صفحات متجر إلكتروني لكراسي التدليك"},
  {"id":"seafood-packaging","category":"graphics","src":"/images/works/graphics/seafood-packaging.webp","width":722,"height":568,"alt":"تصميم عبوات وأكواب ومظاريف لمطعم مأكولات بحرية"},
  {"id":"care-store-web","category":"graphics","src":"/images/works/graphics/care-store-web.webp","width":1190,"height":631,"alt":"تصميم واجهات متجر إلكتروني لمنتجات العناية والإكسسوارات"},
  {"id":"tannoureen-ad","category":"graphics","src":"/images/works/graphics/tannoureen-ad.webp","width":990,"height":550,"alt":"تصميم إعلان لمطعم تانورين"},
  {"id":"adel-cars-warranty","category":"graphics","src":"/images/works/graphics/adel-cars-warranty.webp","width":949,"height":672,"alt":"إعلان باقة الضمان الممتد لعادل للسيارات"},
  {"id":"capri-gelato","category":"graphics","src":"/images/works/graphics/capri-gelato.webp","width":1076,"height":767,"alt":"تصميم إعلاني لكابري جيلاتو"},
  {"id":"teshrine-dishes","category":"graphics","src":"/images/works/graphics/teshrine-dishes.webp","width":1296,"height":643,"alt":"تصوير وتصميم منشورات أطباق مطعم تشرين"},
  {"id":"teshrine-opening","category":"graphics","src":"/images/works/graphics/teshrine-opening.webp","width":824,"height":824,"alt":"إعلان عرض الافتتاح الرسمي لمطعم تشرين"},
  {"id":"ibn-hamido-ad","category":"graphics","src":"/images/works/graphics/ibn-hamido-ad.webp","width":1078,"height":769,"alt":"تصميم إعلان لمطعم ابن حميدو"},
  {"id":"alfanar-web","category":"graphics","src":"/images/works/graphics/alfanar-web.webp","width":770,"height":777,"alt":"تصميم موقع شركة الفنار"},
  {"id":"appliances-web-home","category":"graphics","src":"/images/works/graphics/appliances-web-home.webp","width":540,"height":624,"alt":"تصميم الصفحة الرئيسية لموقع شركة تجارة أجهزة منزلية"},
  {"id":"appliances-web-product","category":"graphics","src":"/images/works/graphics/appliances-web-product.webp","width":421,"height":487,"alt":"تصميم صفحة منتج في موقع شركة تجارة أجهزة منزلية"},
  {"id":"car-coloring-book","category":"graphics","src":"/images/works/graphics/car-coloring-book.webp","width":1004,"height":558,"alt":"كتاب تلوين مطبوع لوكالة سيارات"},
  {"id":"alfaisal-gift-box","category":"graphics","src":"/images/works/graphics/alfaisal-gift-box.webp","width":814,"height":659,"alt":"علبة هدية بتصميم تراثي بعنوان الفيصل"},
  {"id":"smt-banner","category":"graphics","src":"/images/works/graphics/smt-banner.webp","width":1056,"height":748,"alt":"تصميم هوية المسوق الشامل للتجارة"},
  {"id":"medical-brochure","category":"graphics","src":"/images/works/graphics/medical-brochure.webp","width":944,"height":710,"alt":"كتيّب تعريفي لمنشأة طبية"},
  {"id":"mubtathoon-magazine","category":"graphics","src":"/images/works/graphics/mubtathoon-magazine.webp","width":632,"height":822,"alt":"غلاف مجلة المبتعثون السعودي لوزارة التعليم العالي"},
  {"id":"braira-hotel-web","category":"graphics","src":"/images/works/graphics/braira-hotel-web.webp","width":550,"height":769,"alt":"تصميم موقع فندق برايرا"},
  {"id":"adel-cars-cashback","category":"graphics","src":"/images/works/graphics/adel-cars-cashback.webp","width":624,"height":624,"alt":"منشور عرض الاسترجاع النقدي لعادل للسيارات"},
  {"id":"adel-cars-accord","category":"graphics","src":"/images/works/graphics/adel-cars-accord.webp","width":622,"height":624,"alt":"منشور عروض هوندا أكورد لعادل للسيارات"},
];

/** أبرز الصور للصفحة الرئيسية */
export const featuredGalleryIds: string[] = ["jetour-booth","tanweel-booth","booth-concepts","team-black-vests","emf-north-entrance","alakaria-ballroom"];

/** صور كل خدمة (معرّف الخدمة في content/services.ts) */
export const serviceGalleryIds: Record<string, string[]> = {
  "creative": [
    "summit-brochure",
    "purple-stationery",
    "booth-concepts",
    "technical-deliverables",
    "interior-board",
    "premium-box"
  ],
  "tech": [
    "emf-registration-stands",
    "emf-screens-corridor",
    "emf-registration-desk",
    "staff-assisting-visitor"
  ],
  "logistics": [
    "alakaria-wide",
    "jetour-booth",
    "tanweel-booth",
    "advance-method-booth",
    "alzan-booth",
    "mdp-booth"
  ],
  "staffing": [
    "team-black-vests",
    "hosts-white-sashes",
    "heritage-hosts",
    "traditional-arts-hosts",
    "security-team",
    "staff-assisting-visitor"
  ],
  "crowd": [
    "taste-barriers",
    "runners-entry-control",
    "gate-control",
    "red-carpet-entrance"
  ]
};

export const siteImages = {
  "hero-riyadh": {
    "src": "/images/site/hero-riyadh.webp",
    "width": 1400,
    "height": 1130
  },
  "about-skyline": {
    "src": "/images/site/about-skyline.webp",
    "width": 1180,
    "height": 1362
  },
  "vision-desert": {
    "src": "/images/site/vision-desert.webp",
    "width": 1131,
    "height": 1200
  },
  "partners-panel": {
    "src": "/images/site/partners-panel.webp",
    "width": 1400,
    "height": 636
  },
  "clients-panel": {
    "src": "/images/site/clients-panel.webp",
    "width": 1400,
    "height": 693
  }
} as const;
export const logoImage = { src: "/images/brand/nmr-logo.png", width: 722, height: 331 } as const;

const byId = new Map(gallery.map((g) => [g.id, g]));
export const galleryByIds = (ids: string[]): GalleryItem[] => ids.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : []));
