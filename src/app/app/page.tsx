import type { Metadata } from "next";
import QRCode from "qrcode";
import { InstallApp } from "@/components/InstallApp";
import { PageHero } from "@/components/PageHero";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "التطبيق وملف التعريف",
  description: "ثبّت تطبيق nmrievent على جوالك، وحمّل ملف تعريف الشركة PDF أو افتحه بمسح رمز QR.",
  alternates: { canonical: "/app" },
};

/** رمز QR كـ SVG يُولَّد وقت البناء من عنوان الموقع، فلا حاجة لمكتبة في المتصفح */
async function qrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}

export default async function AppPage() {
  const profileUrl = `${site.url}/profile`;
  const [profileQr, siteQr] = await Promise.all([qrSvg(profileUrl), qrSvg(site.url)]);

  return (
    <>
      <PageHero eyebrow="التطبيق" title={<>nmrievent <span className="text-brand">في جيبك</span></>} lead="ثبّت التطبيق على شاشتك الرئيسية للوصول السريع، واطلب عرض سعر أو تواصل معنا بضغطة واحدة." />
      <section className="container grid gap-6 md:grid-cols-2">
        <div className="card flex flex-col p-8">
          <h2 className="text-2xl font-bold">ثبّت التطبيق</h2>
          <p className="mt-3 leading-8 text-muted">يعمل على أندرويد والآيفون والكمبيوتر دون الحاجة إلى متجر تطبيقات، ويفتح بملء الشاشة ويحفظ الصفحات التي زرتها للتصفح بدون إنترنت.</p>
          <div className="mt-6"><InstallApp /></div>
          <div className="mt-auto flex items-center gap-5 pt-8">
            <div
              className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`رمز QR لفتح موقع ${site.name} على الجوال`}
              dangerouslySetInnerHTML={{ __html: siteQr }}
            />
            <p className="text-sm leading-7 text-muted">امسح الرمز من جوالك لفتح الموقع ثم ثبّته من هناك.</p>
          </div>
        </div>

        <div className="card flex flex-col p-8">
          <h2 className="text-2xl font-bold">ملف تعريف الشركة (PDF)</h2>
          <p className="mt-3 leading-8 text-muted">استعرض أعمالنا وخدماتنا وعملاءنا في ملف واحد (84 صفحة). امسح الرمز ليفتح الملف مباشرة على جوالك.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/profile" className="btn-primary" target="_blank" rel="noopener noreferrer">فتح الملف</a>
            <a href="/files/nmr-events-profile.pdf" download="NMR-Events-Profile.pdf" className="btn-ghost">تحميل PDF (16 م.ب)</a>
          </div>
          <div className="mt-auto flex items-center gap-5 pt-8">
            <div
              className="h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-1 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label="رمز QR لفتح ملف تعريف الشركة PDF مباشرة"
              dangerouslySetInnerHTML={{ __html: profileQr }}
            />
            <div className="text-sm leading-7 text-muted">
              <p>امسح الرمز بكاميرا الجوال.</p>
              <p className="mt-1 text-xs" dir="ltr">{profileUrl}</p>
              <a href="/qr/profile-qr.png" download="NMR-Profile-QR.png" className="mt-3 inline-block font-semibold text-brand hover:underline">تحميل الرمز للطباعة (PNG)</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
