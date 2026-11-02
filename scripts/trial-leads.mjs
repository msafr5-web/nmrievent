/** يعرض الطلبات المحفوظة في القاعدة التجريبية (يتطلب أن يكون `npm run trial` يعمل). */
import pg from "pg";

const port = Number(process.env.TRIAL_DB_PORT ?? 54329);
const client = new pg.Client({ connectionString: `postgres://postgres:trial@localhost:${port}/nmr` });
try {
  await client.connect();
} catch {
  console.error("تعذر الاتصال بالقاعدة التجريبية. شغّل `npm run trial` أولًا.");
  process.exit(1);
}
const { rows } = await client.query(
  "SELECT reference, status, created_at, payload FROM rfq_leads ORDER BY created_at DESC LIMIT 50",
);
await client.end();

if (rows.length === 0) console.log("لا توجد طلبات بعد. أرسل طلبًا من http://localhost:3000/rfq");
for (const r of rows) {
  const p = r.payload;
  console.log(
    `${r.reference} | ${r.status} | ${r.created_at.toISOString()} | ${p.organization} | ${p.kind}/${p.tier} | ` +
      `${p.guests} ضيف × ${p.days} يوم | ${p.city} | تقدير ${p.estimate?.low}–${p.estimate?.high} ر.س | ${p.name} ${p.phone}`,
  );
}
