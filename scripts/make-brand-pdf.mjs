/**
 * يطبع صفحة /brand إلى public/files/nmr-brand-guidelines.pdf (صفحات بعرض الموقع 1280px).
 *   1) npm run build && npx next start -p 3000      (في نافذة أخرى)
 *   2) node scripts/make-brand-pdf.mjs [http://localhost:3000]
 * المتصفح: متغير BROWSER_PATH (Chrome/Edge)؛ الافتراضي مسار Edge على ويندوز.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const executablePath = process.env.BROWSER_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const out = join(root, "public", "files", "nmr-brand-guidelines.pdf");

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 }, colorScheme: "dark" });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("theme", "dark");
  } catch {}
});
const page = await ctx.newPage();
await page.goto(`${base}/brand`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (const img of document.images) img.loading = "eager";
  await Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; }))));
});
await page.addStyleTag({
  content: `
    @page { size: 1280px 1760px; margin: 0 }
    html, body { background: #070B3F !important; }
    header, footer, a[aria-label="تواصل عبر واتساب"], nav[aria-label="أقسام الدليل"], #downloads { display: none !important; }
    .card, figure, li { break-inside: avoid; }
    h2, h3 { break-after: avoid; }
    #colors, #type, #apps { break-before: page; }
    section:first-of-type { padding-top: 0; }
    main { padding-bottom: 60px; }
  `,
});
await page.pdf({ path: out, width: "1280px", height: "1760px", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" }, preferCSSPageSize: true });
await browser.close();
console.log("brand guidelines PDF →", out);
