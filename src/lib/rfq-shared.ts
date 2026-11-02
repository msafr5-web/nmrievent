/** ثوابت مشتركة بين الواجهة والخادم — بدون zod حتى لا يُحمَّل في المتصفح */

export type VenueStatus = "booked" | "searching" | "need-help";
export type Budget = "lt-250k" | "250k-1m" | "1m-5m" | "gt-5m" | "undecided";

export const budgetLabels: Record<Budget, string> = {
  "lt-250k": "أقل من 250 ألف ر.س",
  "250k-1m": "250 ألف – 1 مليون ر.س",
  "1m-5m": "1 – 5 مليون ر.س",
  "gt-5m": "أكثر من 5 مليون ر.س",
  undecided: "لم تحدد بعد",
};

export const venueLabels: Record<VenueStatus, string> = {
  booked: "المكان محجوز",
  searching: "نبحث عن مكان",
  "need-help": "نحتاج مساعدتكم في اختيار المكان",
};

// 32 رمزًا بلا حروف ملتبسة (0/O و1/I) فيكون التوزيع منتظمًا مع `b % 32`
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function referenceNumber(date = new Date()) {
  const y = date.getFullYear().toString().slice(2);
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  const rand = Array.from(bytes, (b) => REF_ALPHABET[b % 32]).join("");
  return `NMR-${y}-${rand}`;
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
