ALTER TABLE leave_requests
    ALTER COLUMN total_days TYPE NUMERIC(4,1)
    USING total_days::NUMERIC(4,1);

UPDATE leave_requests lr
SET total_days = 0.5
FROM leave_types lt
WHERE lr.leave_type_id = lt.leave_type_id
  AND LOWER(lt.name) = LOWER('Cuti setengah hari');
