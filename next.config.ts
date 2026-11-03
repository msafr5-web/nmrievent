import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// upgrade-insecure-requests يكسر الموقع إن شُغّل عبر HTTP (مثلًا على IP قبل ربط النطاق)، فلا يُضاف إلا مع عنوان https
const isHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

// CSP: السكربتات المضمّنة (الثيم + JSON-LD + hydration) تتطلب unsafe-inline لأن الـ nonce يُجبر الصفحات
// على العرض الديناميكي ويُسقط SSG. بقية التوجيهات تغلق الإطارات والكائنات والمصادر الخارجية.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(!isDev && isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // Docker يبني بوضع standalone (صورة صغيرة)؛ محليًا يبقى `next start` الافتراضي
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // الـ Service Worker لا يُخزَّن مؤقتًا حتى تصل التحديثات فورًا
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
};

export default nextConfig;
