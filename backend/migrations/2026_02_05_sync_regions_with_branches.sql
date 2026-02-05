INSERT INTO regions (region_name)
SELECT DISTINCT b.branch_name
FROM branches b
WHERE b.branch_name IS NOT NULL AND b.branch_name <> ''
ON CONFLICT (region_name) DO NOTHING;

UPDATE accounts a
SET region_id = r.region_id
FROM branches b
JOIN regions r ON r.region_name = b.branch_name
WHERE a.branch_id = b.branch_id
  AND a.branch_id IS NOT NULL
  AND (a.region_id IS NULL OR a.region_id = 0);
