"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Platform = "installed" | "ios" | "other";

const noopSubscribe = () => () => {};
function detectPlatform(): Platform {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

/** زر تثبيت التطبيق: أندرويد/سطح المكتب عبر beforeinstallprompt، وآيفون بتعليمات «إضافة إلى الشاشة الرئيسية». */
export function InstallApp() {
  const platform = useSyncExternalStore<Platform | null>(noopSubscribe, detectPlatform, () => null);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (platform === null) return null;
  if (platform === "installed" || done) return <p className="text-brand" role="status">✓ التطبيق مثبّت على جهازك.</p>;

  if (prompt) {
    return (
      <button
        type="button"
        className="btn-primary px-8 py-4 text-base"
        onClick={async () => {
          await prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") setDone(true);
          setPrompt(null);
        }}
      >
        ثبّت التطبيق على جهازك
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-elevated p-5 text-sm leading-8 text-muted">
      {platform === "ios" ? (
        <>
          <p className="font-semibold text-fg">للتثبيت على الآيفون / الآيباد (من Safari):</p>
          <ol className="mt-2 list-inside list-decimal">
            <li>اضغط زر المشاركة <span aria-hidden>⎙</span> في أسفل الشاشة.</li>
            <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
            <li>اضغط «إضافة».</li>
          </ol>
        </>
      ) : (
        <>
          <p className="font-semibold text-fg">للتثبيت على أندرويد / الكمبيوتر:</p>
          <p className="mt-2">افتح قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>
        </>
      )}
    </div>
  );
}
