/**
 * يولّد أيقونات التطبيق (PWA) من الشعار الرسمي، ورمز QR لملف التعريف.
 *   node scripts/make-assets.mjs [رابط_ملف_التعريف]
 * الافتراضي: ${NEXT_PUBLIC_SITE_URL}/profile — أعد التوليد بعد تحديد النطاق النهائي.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const NAVY = "#0b0f3b";

// ===== أيقونات التطبيق =====
const logo = join(pub, "images", "brand", "nmr-logo.png");
mkdirSync(join(pub, "icons"), { recursive: true });

/** مربع كحلي والشعار في المنتصف؛ pad أكبر للأيقونة القابلة للقص (maskable) لتبقى داخل المنطقة الآمنة 80% */
async function icon(size, name, widthRatio) {
  const w = Math.round(size * widthRatio);
  const mark = await sharp(logo).resize({ width: w }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(join(pub, "icons", name));
}
await icon(192, "icon-192.png", 0.78);
await icon(512, "icon-512.png", 0.78);
await icon(512, "icon-maskable-512.png", 0.56);
await icon(180, "apple-touch-icon.png", 0.74);

// ===== رمز QR =====
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nmrievent.com").replace(/\/$/, "");
const target = process.argv[2] ?? `${site}/profile`;
mkdirSync(join(pub, "qr"), { recursive: true });
const opts = { errorCorrectionLevel: "Q", margin: 4, color: { dark: "#000000", light: "#ffffff" } };
await QRCode.toFile(join(pub, "qr", "profile-qr.png"), target, { ...opts, width: 1024 });
writeFileSync(join(pub, "qr", "profile-qr.svg"), await QRCode.toString(target, { ...opts, type: "svg" }));
console.log("icons ✔  |  QR →", target);
