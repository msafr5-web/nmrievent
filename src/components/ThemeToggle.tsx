"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:border-gold hover:text-gold"
      aria-label={dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
    >
      {dark === false ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
    </button>
  );
}

/** يُحقن في <head> لتطبيق الوضع قبل الرسم ومنع الوميض */
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`;
