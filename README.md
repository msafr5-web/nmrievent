# nmrievent

منصة رقمية متكاملة لتصميم وإدارة الفعاليات والمؤتمرات والمعارض في المملكة العربية السعودية، مبنية وفق وثيقة متطلبات المنتج (PRD).

## ما تم بناؤه (المرحلة الأولى: البوابة العامة + نظام RFQ)

| الصفحة | المسار | ملاحظات |
| --- | --- | --- |
| الرئيسية | `/` | Hero متحرك، أرقام وإحصائيات، الركائز الخمس، منهجية رحلة الأثر، أعمال مختارة، الجمهور المستهدف، المقالات |
| معرض الأعمال | `/portfolio` | فلترة تفاعلية حسب القطاع ونوع الفعالية + صفحة لكل مشروع (التحدي، الحل، النتائج) |
| الخدمات | `/services` و `/services/[slug]` | الإبداع، الحلول الرقمية، اللوجستيات، الكوادر، إدارة الحشود |
| مهيّئ الفعاليات (RFQ) | `/rfq` | نموذج من 5 خطوات مع حاسبة تكلفة لحظية (FR-01)، يقبل `?service=` لتحديد الخدمات مسبقًا |
| واجهة الطلبات | `POST /api/rfq` | تحقق بـ zod، إعادة حساب التقدير في الخادم، حقل فخ للبوتات، حد للطلبات، تمرير إلى Webhook |
| رؤى وأفكار | `/insights` | المدونة ومقالات الخبراء مع Article JSON-LD |
| من نحن / تواصل / الخصوصية | `/about` `/contact` `/privacy` | قنوات التواصل وواتساب (FR-04) |

**أيضًا:** واجهة عربية RTL بالكامل، وضع داكن/فاتح، تصميم Mobile-First، زر واتساب عائم، `sitemap.xml` و `robots.txt` و OpenGraph و Schema.org، ترويسات أمان (HSTS وغيرها)، دعم `prefers-reduced-motion`، وصفحات ثابتة (SSG) لسرعة التحميل.

## التقنيات

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 بنظام ألوان قائم على متغيرات CSS (`src/app/globals.css`)
- خطوط IBM Plex Sans Arabic للنصوص و Reem Kufi للعناوين
- zod للتحقق من البيانات

## النسخة التجريبية (محلية، بدون أي خدمة خارجية)

```bash
npm install
npm run trial          # يشغّل PostgreSQL محليًا (مجلد .trial-db) + الموقع على http://localhost:3000
npm run trial:leads    # في نافذة أخرى: يعرض الطلبات التي أرسلتها من /rfq
```

- جرّب المسار كاملًا من `/rfq`؛ كل طلب يُحفظ بحالة `stored` ويظهر بالأمر الثاني. أوقف التشغيل بـ `Ctrl+C` (يوقف الموقع وقاعدة البيانات معًا).
- لتصفير البيانات التجريبية احذف مجلد `.trial-db` بعد إيقاف التشغيل.
- هذا الوضع للتجربة فقط: لا Webhook ولا Redis ولا إشعارات. عند الاستضافة اضبط `DATABASE_URL` (**يجب أن تكون القاعدة بترميز UTF8**) و`RFQ_WEBHOOK_URL` وبقية المتغيرات في `.env.example`، ثم `npm run db:migrate`.

## التشغيل

```bash
npm install
cp .env.example .env.local   # عدّل رقم واتساب ورابط الموقع
npm run dev                  # http://localhost:3000
npm run build && npm start   # نسخة الإنتاج
```

## الصور

صور الموقع مستخرجة من ملف تعريف الشركة (Company Profile 2026) بدقتها الأصلية، ومحوَّلة إلى WebP (عرض أقصى 1600px):

| المسار | المحتوى | أين تظهر |
| --- | --- | --- |
| `public/images/brand/` | الشعار الرسمي (PNG بخلفية شفافة) | الترويسة والتذييل |
| `public/images/site/` | صورة الهوية، أفق الرياض، الصحراء، لوحتا الشركاء والعملاء | الرئيسية (Hero + شركاء النجاح) و«من نحن» |
| `public/images/works/{booths,staff,crowd,printing,design3d,graphics}/` | 74 صورة أعمال مصنفة | `/portfolio#gallery` (فلترة + تكبير) والرئيسية وصفحات الخدمات |
| `public/og.jpg` | صورة المشاركة الاجتماعية 1200×630 | OpenGraph / Twitter |

الفهرس والنص البديل لكل صورة في `src/content/gallery.ts`؛ أضف صورة جديدة بوضع ملف WebP في المجلد المناسب وسطر في ذلك الملف.

## النشر على خادم (Docker Compose)

يعمل على أي خادم Ubuntu/Debian: التطبيق + PostgreSQL + Caddy (وكيل عكسي، HTTPS تلقائي عند ربط نطاق) + مهمة cron داخلية. القاعدة والتطبيق غير منشورين خارج شبكة Docker؛ المنفذان 80/443 فقط.

```bash
node scripts/make-secrets.mjs http://187.126.25.41   # يولّد deploy/.env.production بأسرار عشوائية (لا يُرفع إلى git)
bash scripts/setup-ssh-key.sh                        # مرة واحدة: يثبّت مفتاحك على الخادم (يطلب كلمة سر root مرة واحدة)
bash scripts/deploy.sh                               # يرفع الأسرار (600) ثم يستنسخ المستودع ويبني ويشغّل ويفحص الصحة
```

- **الأسرار:** `scripts/push-secrets.sh` يرفع `deploy/.env.production` إلى `/opt/nmrievent/.env` بصلاحيات 600. كلمة سر القاعدة تُطبَّق عند أول إنشاء فقط، فلا تُعد توليد الملف (`--force`) على خادم فيه بيانات.
- **ربط نطاق:** غيّر `NEXT_PUBLIC_SITE_URL` إلى `https://نطاقك` و`SITE_ADDRESS` إلى النطاق نفسه في الملف، ووجّه سجل A إلى الخادم، ثم أعد `bash scripts/deploy.sh` (القيمة الأولى تُدمج وقت البناء). وأعد توليد رمز QR (`npm run assets https://نطاقك/profile`).
- **عرض الطلبات:** `ssh root@IP "cd /opt/nmrievent/repo && docker compose --env-file /opt/nmrievent/.env -f deploy/docker-compose.yml exec db psql -U nmr -d nmr -c 'select reference,status,created_at,payload->>'organization' from rfq_leads order by created_at desc limit 20'"`
- **عبر IP بدون نطاق:** يعمل الموقع على HTTP؛ الـ Service Worker (وضع التطبيق/العمل بدون إنترنت) يتطلب HTTPS فيتعطل حتى ربط النطاق.

## الهوية البصرية

مستخلصة من الشعار الرسمي وملف التعريف: برتقالي النمر `#F05A22` فوق كحلي `#070B3F`، مع بنفسجي `#6502EA` ورملي `#F6BC80` للتوهجات واللمسات.

- **دليل الهوية:** صفحة `/brand` (الشعار وقواعده، الألوان، الخطوط، الصور، التطبيقات، التحميلات) و`public/files/nmr-brand-guidelines.pdf`.
- **مصدر الحقيقة:** `src/content/brand.ts`. قيم الألوان تُنسخ إلى `src/app/globals.css`، ويتحقق اختبار (`npm test`) من تطابقها ومن أن كل أزواج النص/الخلفية في الوضعين الداكن والفاتح تحقق تباين WCAG AA.
- **نسخ الشعار:** `npm run assets` يولّد من `public/images/brand/nmr-logo.png` النسخة الفاتحة وأحادية اللون والرمز وأيقونات التطبيق (والـ QR). الشعار الأصلي نقطي (PNG)؛ للطباعة الكبيرة اطلب النسخة المتجهة من فريق التصميم.
- **الخطوط:** Cairo للعناوين، IBM Plex Sans Arabic للنصوص.
- **تحديث ملف PDF للدليل:** شغّل الموقع (`npm run build && npx next start`) ثم `npm run brand:pdf` (يتطلب Chrome أو Edge؛ حدّد مساره بـ `BROWSER_PATH` إن لزم).

## الاختبارات والجودة

```bash
npm test             # Vitest (الحاسبة، المخطط، المحدِّد، التسليم، مسار /api/rfq)
npm run test:db      # تكامل على PostgreSQL حقيقي مؤقت (embedded-postgres) — يطبّق الـ migration ويختبر الحجز المتزامن
npm run typecheck && npm run lint
```

- **التسليم:** في الإنتاج يُرجِع `/api/rfq` الرمز 503 إذا لم يُضبط `RFQ_WEBHOOK_URL` أو فشل التسليم بعد محاولتين، فلا يُبلَّغ العميل بنجاح كاذب. الطلبات موقّعة بـ HMAC (`X-NMR-Signature`) وتحمل `Idempotency-Key`.
- **حفظ الطلبات (Outbox):** عند ضبط `DATABASE_URL` يُحفظ كل طلب في جدول `rfq_leads` قبل التسليم، فلا يضيع إن تعطل الـ Webhook (يُرجَع 201 ويبقى الطلب `pending`). أنشئ الجدول بـ `npm run db:migrate`، وجدوِل استدعاء `GET /api/rfq/retry` بالترويسة `Authorization: Bearer $CRON_SECRET` كل بضع دقائق لإعادة التسليم (backoff أسّي، 8 محاولات ثم `failed`). **الاحتفاظ (PDPL):** نفس مهمة الـ cron تحذف الطلبات المنتهية (`delivered` و`stored` و`failed`) الأقدم من `RFQ_RETENTION_DAYS` (افتراضي 180 يومًا)، ولا تمس `pending`. إن لم يكن لديك webhook فالطلبات `stored` هي نسختك الوحيدة، فاضبط المدة بما يناسب احتياجك قبل أن تُحذف.
- **المتغيرات** تُتحقق بـ zod في `src/lib/env.ts` (راجع `.env.example`).

## هيكل المشروع

```
src/
├── app/            الصفحات والمسارات وواجهة /api/rfq
├── components/     مكونات الواجهة (Header, RfqConfigurator, PortfolioExplorer, ...)
├── content/        المحتوى (المشاريع، الخدمات، المقالات) — طبقة جاهزة للاستبدال بـ Headless CMS
└── lib/            حاسبة التكلفة (estimator.ts) ومخطط طلب العرض (rfq.ts)
```

## تخصيص المحتوى

- **الأعمال والخدمات والمقالات** في `src/content/*.ts`. المحتوى الحالي توضيحي ويجب استبداله بأعمال حقيقية.
- **أسعار الحاسبة** في `src/lib/estimator.ts` (أسعار أساسية لكل نوع، معاملات المستوى والمدينة، والخدمات الإضافية).
- **استقبال الطلبات:** اضبط `RFQ_WEBHOOK_URL` لإرسال كل طلب إلى CRM أو خادم NestJS أو أداة أتمتة (n8n / Zapier) لإرسال تأكيد البريد وواتساب.

## المراحل القادمة (وفق PRD)

1. ربط Headless CMS (Sanity أو Strapi) لمعرض الأعمال والمدونة، وصور وفيديو حقيقية عبر `next/image`.
2. خادم NestJS + PostgreSQL + Redis لحفظ الطلبات، وإشعارات WhatsApp Business API والبريد.
3. بوابة العملاء: متتبع المراحل (FR-02)، الاعتمادات والتوقيع الرقمي.
4. منصة الكوادر والتشغيل الميداني (FR-03): الورديات والتحضير بالموقع الجغرافي.
5. لوحة الإدارة العليا: CRM وخط المبيعات والتحليلات.
6. الاستضافة داخل المملكة (AWS me-central / STC Cloud) التزامًا بنظام PDPL.
