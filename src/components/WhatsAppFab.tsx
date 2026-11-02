import { site } from "@/content/site";
import { whatsappLink } from "@/lib/rfq-shared";
import { WhatsAppIcon } from "./icons";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink(site.whatsapp, "مرحبًا nmrievent، أرغب في الاستفسار عن تنظيم فعالية.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 start-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105"
      aria-label="تواصل عبر واتساب"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
