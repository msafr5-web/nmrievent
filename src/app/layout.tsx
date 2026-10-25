import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { themeScript } from "@/components/ThemeToggle";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { site } from "@/content/site";
import "./globals.css";

const body = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Reem_Kufi({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  keywords: ["تنظيم فعاليات", "شركة فعاليات الرياض", "تنظيم مؤتمرات", "معارض", "إدارة حشود", "مضيفين", "هولوجرام", "السعودية"],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0C10" },
    { media: "(prefers-color-scheme: light)", color: "#FAF7F1" },
  ],
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  email: site.email,
  telephone: site.phone,
  address: { "@type": "PostalAddress", addressLocality: "الرياض", addressCountry: "SA" },
  areaServed: "SA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}
