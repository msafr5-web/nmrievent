import type { Pool } from "pg";
import type { ClaimedLead, Lead, LeadRepository } from "./lead-repository";

const CLAIM_LEASE_MINUTES = 5;

export function createPgLeadRepository(pool: Pick<Pool, "query">): LeadRepository {
  return {
    async create(lead, status) {
      const res = await pool.query(
        `INSERT INTO rfq_leads (reference, payload, status) VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (reference) DO NOTHING`,
        [lead.reference, JSON.stringify(lead), status],
      );
      return (res.rowCount ?? 0) > 0;
    },

    async markDelivered(reference) {
      await pool.query(
        `UPDATE rfq_leads SET status = 'delivered', delivered_at = now(), last_error = NULL WHERE reference = $1`,
        [reference],
      );
    },

    async markFailed(reference, error, maxAttempts) {
      await pool.query(
        `UPDATE rfq_leads
            SET attempts = attempts + 1,
                last_error = left($2, 500),
                status = CASE WHEN attempts + 1 >= $3 THEN 'failed' ELSE 'pending' END,
                next_attempt_at = now() + (interval '1 minute' * power(2, least(attempts, 10)))
          WHERE reference = $1 AND status <> 'delivered'`,
        [reference, error, maxAttempts],
      );
    },

    async claimPending(limit, maxAttempts) {
      // حجز ذري: نُزيح next_attempt_at فيتجاهل العمّال الآخرون هذه الصفوف حتى تنتهي مهلة الحجز
      const res = await pool.query<{ reference: string; payload: Lead; attempts: number }>(
        `UPDATE rfq_leads SET next_attempt_at = now() + interval '${CLAIM_LEASE_MINUTES} minutes'
          WHERE reference IN (
            SELECT reference FROM rfq_leads
             WHERE status = 'pending' AND attempts < $1 AND next_attempt_at <= now()
             ORDER BY created_at LIMIT $2
             FOR UPDATE SKIP LOCKED)
        RETURNING reference, payload, attempts`,
        [maxAttempts, limit],
      );
      return res.rows satisfies ClaimedLead[];
    },

    async purgeOlderThan(days) {
      const res = await pool.query(
        `DELETE FROM rfq_leads
          WHERE status IN ('delivered', 'stored', 'failed')
            AND created_at < now() - make_interval(days => $1::int)`,
        [days],
      );
      return res.rowCount ?? 0;
    },
  };
}
