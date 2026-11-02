import { deliverLead, type DeliveryOptions } from "@/lib/rfq-delivery";
import type { Lead, LeadRepository } from "./lead-repository";

export const MAX_DELIVERY_ATTEMPTS = 8;

export type SubmitResult = "delivered" | "queued" | "stored";
type Webhook = Omit<DeliveryOptions, "fetchImpl">;

/**
 * Outbox: يُحفظ الطلب أولًا ثم يُسلَّم؛ فشل التسليم لا يضيّع الطلب بل يبقى معلّقًا لإعادة المحاولة.
 * بدون مستودع يعتمد على التسليم المتزامن. يرمي إذا تعذّر الحفظ/التسليم فلا يُبلَّغ العميل بنجاح كاذب.
 */
export async function submitLead(
  lead: Lead,
  deps: { repo: LeadRepository | null; webhook: Webhook | null; deliver?: typeof deliverLead },
): Promise<SubmitResult> {
  const { repo, webhook, deliver = deliverLead } = deps;

  if (!repo) {
    if (!webhook) throw new Error("no persistence or delivery target configured");
    await deliver(lead, webhook);
    return "delivered";
  }

  await repo.create(lead, webhook ? "pending" : "stored");
  if (!webhook) return "stored";

  try {
    await deliver(lead, webhook);
    await repo.markDelivered(lead.reference);
    return "delivered";
  } catch (err) {
    await repo.markFailed(lead.reference, err instanceof Error ? err.message : String(err), MAX_DELIVERY_ATTEMPTS);
    return "queued";
  }
}

/** يعيد تسليم الطلبات المعلّقة؛ يُستدعى من مهمة مجدولة (cron) */
export async function retryPending(
  repo: LeadRepository,
  webhook: Webhook,
  opts: { batch?: number; deliver?: typeof deliverLead } = {},
) {
  const { batch = 25, deliver = deliverLead } = opts;
  const claimed = await repo.claimPending(batch, MAX_DELIVERY_ATTEMPTS);
  let delivered = 0;
  let failed = 0;
  for (const { reference, payload } of claimed) {
    try {
      await deliver(payload, webhook);
      await repo.markDelivered(reference);
      delivered++;
    } catch (err) {
      await repo.markFailed(reference, err instanceof Error ? err.message : String(err), MAX_DELIVERY_ATTEMPTS);
      failed++;
    }
  }
  return { claimed: claimed.length, delivered, failed };
}
