import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/app/LoginForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "الدخول إلى البوابات" };

export default function LoginPage() {
  const showDemo = process.env.NODE_ENV !== "production" || process.env.OTP_DEMO_MODE === "true";
  return (
    <main id="main" className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="sadu absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <Logo />
      <div className="text-center">
        <h1 className="text-3xl font-bold">الدخول إلى منصة nmrievent</h1>
        <p className="mt-2 text-muted">بوابة العملاء، لوحة العمليات الميدانية، ولوحة الإدارة العليا</p>
      </div>
      <Suspense fallback={<div className="card h-96 w-full max-w-md animate-pulse" />}>
        <LoginForm showDemo={showDemo} />
      </Suspense>
      <Link href="/" className="text-sm text-muted hover:text-gold">العودة إلى الموقع</Link>
    </main>
  );
}
