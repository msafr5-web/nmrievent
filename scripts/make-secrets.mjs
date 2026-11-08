/**
 * يولّد ملف أسرار الإنتاج deploy/.env.production بقيم عشوائية قوية (crypto)، بصلاحيات 600.
 *   node scripts/make-secrets.mjs [عنوان_الموقع]     مثال: node scripts/make-secrets.mjs https://nmrevent.com
 *
 * لا يستبدل ملفًا موجودًا إلا مع --force؛ لأن كلمة سر PostgreSQL تُطبَّق عند أول إنشاء للقاعدة فقط،
 * وتغييرها لاحقًا في الملف دون تغييرها في القاعدة يكسر الاتصال.
 * الملف مُستثنى من git ولا يُرسل إلا عبر scripts/push-secrets.sh.
 */
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "deploy", ".env.production");
const args = process.argv.slice(2);
const force = args.includes("--force");
const siteUrl = (args.find((a) => !a.startsWith("--")) ?? "https://nmrevent.com").replace(/\/$/, "");

if (existsSync(out) && !force) {
  console.error(`الملف موجود: ${out}\nلن أستبدله (قد تكسر كلمة سر القاعدة الحالية). استخدم --force فقط لإعداد جديد كليًا.`);
  process.exit(1);
}

const hex = (bytes) => randomBytes(bytes).toString("hex");
const dbPassword = hex(24); // hex فقط فيصلح داخل رابط الاتصال دون ترميز

const isHttps = siteUrl.startsWith("https://");
const host = new URL(siteUrl).hostname;
const content = `# أسرار الإنتاج — لا تُرفع إلى git. تُرسل إلى الخادم عبر scripts/push-secrets.sh (صلاحيات 600).
# تاريخ التوليد: ${new Date().toISOString()}

# ----- قاعدة البيانات (داخل شبكة Docker فقط) -----
POSTGRES_PASSWORD=${dbPassword}
DATABASE_URL=postgres://nmr:${dbPassword}@db:5432/nmr

# ----- الأسرار -----
CRON_SECRET=${hex(24)}
RFQ_WEBHOOK_SECRET=${hex(24)}

# ----- الموقع -----
NEXT_PUBLIC_SITE_URL=${siteUrl}
NEXT_PUBLIC_WHATSAPP_NUMBER=966547047635
# نطاق لتفعيل HTTPS تلقائيًا؛ ":80" للعمل عبر IP بدون تشفير
SITE_ADDRESS=${isHttps ? host : ":80"}
# تحويل دائم من www إلى النطاق الأساسي (يتطلب سجل DNS لـ www)؛ القيمة الافتراضية لا تطابق أي طلب
WWW_ADDRESS=${isHttps ? `www.${host}` : "http://www.invalid"}

# ----- لوحة التحكم -----
SUPER_ADMIN_EMAIL=msafr.5@gmail.com
# رمز لمرة واحدة لإنشاء حساب المدير الأعلى من /admin/setup؛ يبقى بلا فائدة بعد إنشاء الحساب
ADMIN_BOOTSTRAP_TOKEN=${hex(24)}
# مجلد الصور المرفوعة والسير الذاتية (وحدة تخزين دائمة)
UPLOAD_DIR=/data
ADMIN_SESSION_HOURS=12
APPLICATION_RETENTION_DAYS=365

# ----- اختياري -----
# وجهة تسليم الطلبات (CRM/n8n)؛ فارغ = تُحفظ في القاعدة فقط
RFQ_WEBHOOK_URL=
RFQ_RETENTION_DAYS=180
LOG_LEVEL=info
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, content, { mode: 0o600 });
try {
  chmodSync(out, 0o600);
} catch {
  /* ويندوز: الصلاحيات تُضبط على الخادم عند الرفع */
}
console.log(`✔ تم إنشاء ${out}\n  عنوان الموقع: ${siteUrl}\n  (القيم السرية لم تُطبع هنا عمدًا)`);
