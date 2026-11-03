/**
 * يولّد أصول الهوية من الشعار الرسمي (public/images/brand/nmr-logo.png):
 *   - نسخ الشعار: للفاتح، أحادي أبيض/كحلي، الرمز فقط
 *   - أيقونات التطبيق (PWA) والأيقونة المفضلة وأيقونة Apple
 *   - رمز QR لملف التعريف
 *   node scripts/make-assets.mjs [رابط_ملف_التعريف]
 * الافتراضي للرمز: ${NEXT_PUBLIC_SITE_URL}/profile — أعد التوليد بعد تحديد النطاق النهائي.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const brandDir = join(pub, "images", "brand");
const NAVY = [7, 11, 63]; // #070B3F — Midnight Navy
const NAVY_HEX = "#070B3F";
const ORANGE_G = 0x5a; // قناة G في برتقالي الشعار #F05A22 (الأبيض 255)

const source = join(brandDir, "nmr-logo.png");

/** يقرأ الشعار كـ RGBA خام */
async function loadLogo() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height };
}

const toPng = (buf, w, h) => sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 });

/** كل بكسل خليط بين البرتقالي والأبيض؛ نقدّر نسبة الأبيض من قناة G ونستبدلها بلون آخر مع إبقاء البرتقالي */
function recolorWhite(logo, to) {
  const out = Buffer.from(logo.data);
  for (let i = 0; i < out.length; i += 4) {
    const t = Math.min(1, Math.max(0, (out[i + 1] - ORANGE_G) / (255 - ORANGE_G)));
    out[i] = Math.round(240 + (to[0] - 240) * t);
    out[i + 1] = Math.round(90 + (to[1] - 90) * t);
    out[i + 2] = Math.round(34 + (to[2] - 34) * t);
  }
  return out;
}

function monochrome(logo, rgb) {
  const out = Buffer.from(logo.data);
  for (let i = 0; i < out.length; i += 4) [out[i], out[i + 1], out[i + 2]] = rgb;
  return out;
}

/** الرمز = الشعار بدون سطر EVENTS: نقصّ فوق آخر فجوة أفقية فارغة */
function markBounds(logo) {
  const { data, width, height } = logo;
  const filled = Array.from({ length: height }, (_, y) => {
    for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 40) return true;
    return false;
  });
  let y = height - 1;
  while (y > 0 && !filled[y]) y--; // أسفل EVENTS
  while (y > 0 && filled[y]) y--; // نص EVENTS
  while (y > 0 && !filled[y]) y--; // الفجوة
  return y + 1; // ارتفاع الرمز
}

const logo = await loadLogo();
await toPng(recolorWhite(logo, NAVY), logo.width, logo.height).toFile(join(brandDir, "nmr-logo-on-light.png"));
await toPng(monochrome(logo, [255, 255, 255]), logo.width, logo.height).toFile(join(brandDir, "nmr-logo-white.png"));
await toPng(monochrome(logo, NAVY), logo.width, logo.height).toFile(join(brandDir, "nmr-logo-navy.png"));
const markH = markBounds(logo);
await sharp(source).extract({ left: 0, top: 0, width: logo.width, height: markH }).trim().png({ compressionLevel: 9 }).toFile(join(brandDir, "nmr-mark.png"));

// ===== أيقونات التطبيق (الرمز على الكحلي) =====
mkdirSync(join(pub, "icons"), { recursive: true });
const markBuf = await sharp(join(brandDir, "nmr-mark.png")).toBuffer();

/** مربع كحلي والرمز في المنتصف؛ widthRatio أصغر للأيقونة القابلة للقص (maskable) لتبقى داخل المنطقة الآمنة 80% */
async function squareIcon(size, file, widthRatio) {
  const mark = await sharp(markBuf).resize({ width: Math.round(size * widthRatio) }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY_HEX } })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}
await squareIcon(192, join(pub, "icons", "icon-192.png"), 0.72);
await squareIcon(512, join(pub, "icons", "icon-512.png"), 0.72);
await squareIcon(512, join(pub, "icons", "icon-maskable-512.png"), 0.54);
await squareIcon(180, join(pub, "icons", "apple-touch-icon.png"), 0.7);
// اتفاقيات Next.js: تُضاف تلقائيًا كأيقونة الموقع وأيقونة Apple
await squareIcon(512, join(root, "src", "app", "icon.png"), 0.72);
await squareIcon(180, join(root, "src", "app", "apple-icon.png"), 0.7);

// ===== رمز QR =====
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nmrevent.com").replace(/\/$/, "");
const target = process.argv[2] ?? `${site}/profile`;
mkdirSync(join(pub, "qr"), { recursive: true });
const opts = { errorCorrectionLevel: "Q", margin: 4, color: { dark: "#000000", light: "#ffffff" } };
await QRCode.toFile(join(pub, "qr", "profile-qr.png"), target, { ...opts, width: 1024 });
writeFileSync(join(pub, "qr", "profile-qr.svg"), await QRCode.toString(target, { ...opts, type: "svg" }));
console.log(`logo variants ✔ (mark height ${markH}px of ${logo.height})  |  icons ✔  |  QR → ${target}`);
