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

export function referenceNumber(date = new Date()) {
  const y = date.getFullYear().toString().slice(2);
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NMR-${y}-${rand}`;
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
