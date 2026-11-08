import type { Metadata } from "next";

/** لوحة التحكم لا تُفهرس أبدًا ولا تُخزَّن صفحاتها */
export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة التحكم" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
