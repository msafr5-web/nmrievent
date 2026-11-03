/**
 * يتحقق أن النطاق (والـ www) يشيران إلى عنوان الخادم عبر محللات عامة (Google وCloudflare)،
 * حتى لا يحاول Caddy إصدار شهادة HTTPS قبل جاهزية DNS.
 *   node scripts/check-dns.mjs <domain> <server-ip> [--wait]
 * مع --wait ينتظر حتى 15 دقيقة لانتشار السجلات؛ يخرج برمز 0 عند النجاح و1 عند الفشل.
 */
import { Resolver } from "node:dns/promises";

const [domain, ip, ...flags] = process.argv.slice(2);
if (!domain || !ip) {
  console.error("usage: node scripts/check-dns.mjs <domain> <server-ip> [--wait]");
  process.exit(2);
}
const wait = flags.includes("--wait");
const names = [domain, `www.${domain}`];

async function lookup(name) {
  const out = { name, a: [], aaaa: [] };
  for (const server of ["8.8.8.8", "1.1.1.1"]) {
    const r = new Resolver({ timeout: 4000, tries: 1 });
    r.setServers([server]);
    const a = await r.resolve4(name).catch(() => []);
    const aaaa = await r.resolve6(name).catch(() => []);
    out.a.push(...a);
    out.aaaa.push(...aaaa);
  }
  out.a = [...new Set(out.a)];
  out.aaaa = [...new Set(out.aaaa)];
  return out;
}

async function check() {
  const results = await Promise.all(names.map(lookup));
  let ok = true;
  for (const r of results) {
    const good = r.a.length > 0 && r.a.every((x) => x === ip);
    const v6 = r.aaaa.length > 0;
    console.log(`${good && !v6 ? "✔" : "✘"} ${r.name.padEnd(22)} A: ${r.a.join(", ") || "(none)"}${v6 ? `   AAAA: ${r.aaaa.join(", ")} ← احذف سجل IPv6` : ""}`);
    if (!good || v6) ok = false;
  }
  return ok;
}

const deadline = Date.now() + 15 * 60 * 1000;
for (;;) {
  if (await check()) {
    console.log(`DNS جاهز: ${names.join(" و ")} → ${ip}`);
    process.exit(0);
  }
  if (!wait || Date.now() > deadline) {
    console.error(`\nDNS غير جاهز بعد. أنشئ سجلي A (للنطاق و www) يشيران إلى ${ip} واحذف أي سجل A/AAAA آخر لهما.`);
    process.exit(1);
  }
  console.log("… إعادة الفحص بعد 30 ثانية\n");
  await new Promise((r) => setTimeout(r, 30_000));
}
