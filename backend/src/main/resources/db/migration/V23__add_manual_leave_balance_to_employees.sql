-- Menambahkan kolom kuota cuti manual (di luar Cuti Tahunan) yang diisi
-- langsung oleh HR per karyawan lewat form Manajemen Data Pegawai.
-- Sebelumnya field "Sisa Cuti Sakit" di ModalDetailKaryawan.jsx cuma
-- tampilan dummy (fallback ke angka 12) karena kolomnya belum ada sama
-- sekali di tabel employees, dan sistem ini juga belum punya jenis cuti
-- "Cuti Sakit" di tabel leave_types -- jadi kolom ini dipakai sebagai
-- kuota manual serbaguna (bukan hasil hitungan otomatis).
ALTER TABLE employees
ADD COLUMN manual_leave_balance INTEGER NOT NULL DEFAULT 0;
