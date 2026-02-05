-- Fix overpaid invoices by capping the newest payments first so total_paid == final_total.
-- Preview overpaid invoices before running:
-- SELECT p.invoice_id,
--        SUM(p.total_paid) AS total_paid,
--        i.final_total,
--        SUM(p.total_paid) - i.final_total AS overpaid
-- FROM payments p
-- JOIN invoices i ON i.invoice_id = p.invoice_id
-- GROUP BY p.invoice_id, i.final_total
-- HAVING SUM(p.total_paid) > i.final_total;

WITH ordered AS (
  SELECT p.payment_id,
         p.invoice_id,
         p.total_paid,
         i.final_total,
         SUM(p.total_paid) OVER (PARTITION BY p.invoice_id) AS sum_paid,
         SUM(p.total_paid) OVER (
           PARTITION BY p.invoice_id
           ORDER BY p.date_paid DESC NULLS LAST, p.payment_id DESC
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
         ) AS running_from_latest
  FROM payments p
  JOIN invoices i ON i.invoice_id = p.invoice_id
),
to_fix AS (
  SELECT *,
         (sum_paid - final_total) AS overage,
         (running_from_latest - total_paid) AS prior_from_latest
  FROM ordered
  WHERE sum_paid > final_total
),
updates AS (
  SELECT payment_id,
         CASE
           WHEN overage <= 0 THEN total_paid
           WHEN prior_from_latest >= overage THEN total_paid
           WHEN running_from_latest <= overage THEN 0
           ELSE total_paid - (overage - prior_from_latest)
         END AS new_total_paid
  FROM to_fix
)
UPDATE payments p
SET total_paid = u.new_total_paid
FROM updates u
WHERE p.payment_id = u.payment_id;
