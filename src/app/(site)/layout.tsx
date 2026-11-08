import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import { WhatsAppFab } from "@/components/WhatsAppFab";

/** قشرة الموقع العام: الترويسة والتذييل وزر واتساب. لوحة التحكم (admin) لها قشرتها المستقلة. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppFab />
      <PwaRegister />
    </>
  );
}
