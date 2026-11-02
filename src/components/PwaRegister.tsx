"use client";

import { useEffect } from "react";

/** يسجّل الـ Service Worker في الإنتاج فقط (في التطوير يتعارض مع إعادة التحميل الفوري). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* التسجيل اختياري؛ الموقع يعمل دونه */
    });
  }, []);
  return null;
}
