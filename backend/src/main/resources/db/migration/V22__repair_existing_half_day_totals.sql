-- Memperbaiki pengajuan setengah hari yang sempat dibuat oleh instance aplikasi
-- versi lama setelah migrasi V21 dijalankan.
UPDATE leave_requests lr
SET total_days = 0.5
FROM leave_types lt
WHERE lr.leave_type_id = lt.leave_type_id
  AND LOWER(TRIM(lt.name)) = LOWER('Cuti setengah hari')
  AND lr.total_days <> 0.5;
