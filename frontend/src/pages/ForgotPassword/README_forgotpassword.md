# Panduan: Fitur Notifikasi "Permintaan Reset Sandi"

Total **14 file** (5 backend, 9 frontend) — 6 file BARU, 8 file diubah dari versi
sebelumnya. Semua file di paket ini mengikuti path folder asli repo, jadi
tinggal timpa (overwrite) file yang sama di project kamu.

---

## 1. BACKEND

### 🆕 `backend/.../passwordreset/dto/PendingPasswordResetResponse.java`
DTO baru untuk daftar pending request. Bawa `employeeId`, `employeeName`,
`position`, `divisiName` — inilah kunci supaya frontend bisa langsung tahu
baris karyawan mana yang harus dibuka.

### ✏️ `backend/.../passwordreset/service/PasswordResetService.java`
- **Constructor**: tambah dependency `EmployeeRepository`.
- **`getPendingRequests()`**: sekarang mengembalikan `List<PendingPasswordResetResponse>`
  (bukan entity mentah lagi), lewat method baru `toPendingResponse()` yang
  join ke tabel `employees`.
- **BARU — `markResolved(Long requestId, Authentication authentication)`**:
  menandai request jadi `APPROVED` **tanpa** mengubah password lagi (karena
  password sudah diganti duluan oleh `UserController`). Dipanggil otomatis,
  bukan lewat endpoint terpisah.

### ✏️ `backend/.../passwordreset/controller/PasswordResetController.java`
- `GET /pending` sekarang return `List<PendingPasswordResetResponse>`.
- Endpoint lain (`forgot-password`, `count`, `{id}/approve`) **tidak berubah**,
  tetap ada untuk kompatibilitas.

### ✏️ `backend/.../user/dto/UpdateUserRequest.java`
Tambah 1 field opsional: `passwordResetRequestId`.

### ✏️ `backend/.../user/controller/UserController.java`
- Constructor tambah dependency `PasswordResetService`.
- Di `updateUser()`: setelah password berhasil di-encode & disimpan, **kalau**
  `passwordResetRequestId` dikirim di body, otomatis panggil
  `passwordResetService.markResolved(...)`. Dibungkus try/catch sendiri —
  kalau proses ini gagal, password yang SUDAH tersimpan tidak ikut batal,
  cuma dicatat sebagai `AUTO_RESOLVE_RESET_FAILED` di activity log.

> ⚠️ **Catatan jujur**: saya tidak bisa menjalankan `mvn compile` di sandbox
> ini (Maven Central tidak ada di allowlist jaringan saya), jadi backend
> **belum saya build-verify otomatis**. Saya sudah baca ulang tiap file
> dengan teliti (import, tipe data, constructor) dan cukup yakin tidak ada
> typo/error, tapi tolong jalankan `mvn compile` (atau run lewat VSCode
> Spring Boot extension) di sisi kamu sebelum lanjut, ya.

---

## 2. FRONTEND

### 🆕 `frontend/src/services/passwordResetService.js`
Service baru: `submitForgotPassword`, `getPendingResetRequests`,
`getPendingResetCount`, `approveResetRequest`.

### ✏️ `frontend/src/services/authService.js`
`checkUsernameExists` & `requestPasswordReset` (yang tadinya mock
`setTimeout`) **dihapus**. Diganti pemakaiannya oleh `passwordResetService.js`.

### ✏️ `frontend/src/pages/ForgotPassword/ForgotPassword.jsx`
- Import diganti ke `submitForgotPassword`.
- `handleSubmit` (step 1) disederhanakan: cuma validasi kosong lalu tampilkan
  dialog konfirmasi (tidak ada lagi panggilan "cek username" terpisah).
- `handleConfirmReset` (step 2) sekarang **benar-benar** hit
  `POST /api/password-reset/forgot-password`. Kalau username salah, pesan
  error asli dari backend muncul di toast.

### ✏️ `frontend/src/components/Navbar.jsx`
- Import baru: `useNavigate`, `getPendingResetRequests`, `getPendingResetCount`,
  `isHrAdmin`, `isSuperAdmin`, `NotifPasswordResetModal`.
- State baru: `resetRequests`, `selectedResetNotif`.
- `useEffect` baru: polling `getPendingResetRequests()` tiap 30 detik, **hanya**
  untuk role HR Admin / Super Admin (`canSeeResetNotif`).
- `resetNotifications` & `allNotifications`: gabungan notifikasi cuti + reset
  sandi jadi satu daftar/satu badge angka.
- `handleNotifClick`: kalau item bertipe `password-reset`, buka
  `NotifPasswordResetModal`.
- `handleProcessReset`: `navigate('/karyawan?employeeId=X&resetRequestId=Y')`.
- List notifikasi & badge sekarang pakai `allNotifications` (bukan
  `notifications` saja), plus ikon SVG baru (warna ungu) utk tipe
  `password-reset`.

### ✏️ `frontend/src/components/Navbar.css`
Tambah 1 class kecil: `.notification-action-hint` (teks "Klik untuk
memproses →").

### 🆕 `frontend/src/components/NotifPasswordResetModal.jsx` + `.css`
Modal baru: detail permintaan reset (nama, jabatan, divisi, waktu) + tombol
**Proses**. Tombol nonaktif otomatis kalau `employeeId` null (karyawan belum
ada di tabel `employees`).

### ✏️ `frontend/src/pages/Karyawan/Karyawan.jsx`
- Import `useSearchParams`.
- State baru: `pendingResetRequestId`.
- `useEffect` baru (jalan setiap `karyawanList` berubah): baca query param
  `employeeId` & `resetRequestId` dari URL, cari karyawan yang cocok di
  `karyawanList`, lalu `setEditTarget(...)` — modal edit otomatis terbuka.
  Query param langsung dibersihkan dari URL setelah dipakai.
- `handleCloseEdit` & `handleSubmitEditModal`: ikut reset
  `pendingResetRequestId` ke `null`.
- `<ModalDetailKaryawan>`: tambah prop `resetRequestId={pendingResetRequestId}`.

### ✏️ `frontend/src/pages/Karyawan/components/ModalDetailKaryawan.jsx` + `.css`
- Terima prop baru `resetRequestId`.
- Banner ungu di atas form: muncul kalau modal dibuka dari notifikasi,
  mengarahkan HR untuk isi password baru lalu simpan.
- `handleSimpan`: kalau `resetRequestId` ada **dan** field password diisi,
  otomatis sisipkan `passwordResetRequestId` ke body `PUT /api/users/{id}`.
- Pesan sukses ikut menyebut "Permintaan reset sandi juga sudah ditandai
  selesai" kalau kondisi di atas terpenuhi.

✅ **Sudah saya build-verify** dengan `npx vite build` — 145 modul, 0 error.

---

## 3. Alur End-to-End (untuk testing manual)

1. Login sebagai karyawan biasa → logout → di halaman Login klik "Lupa
   Sandi" → isi username → konfirmasi → submit.
   - Cek tabel `password_reset_requests` di pgAdmin: harus ada baris baru
     status `PENDING`.
2. Login sebagai HR Admin / Super Admin.
   - Lonceng di Navbar harus menampilkan badge angka bertambah (tunggu
     maks. 30 detik kalau baru saja submit di langkah 1, atau langsung
     kalau baru login/refresh).
3. Klik lonceng → harus muncul item notifikasi ungu "Karyawan ... meminta
   reset sandi" dengan hint "Klik untuk memproses →".
4. Klik item itu → modal `NotifPasswordResetModal` muncul dengan detail
   (nama, jabatan, divisi, waktu). Klik **Proses**.
5. Browser harus pindah ke `/karyawan` dan modal `ModalDetailKaryawan`
   otomatis terbuka untuk karyawan yang tepat, dengan banner ungu di atas.
6. Isi field **Ubah Password** dengan sandi baru → klik **Simpan Perubahan
   Data**.
7. Cek:
   - Notifikasi toast sukses menyebut "Permintaan reset sandi juga sudah
     ditandai selesai".
   - Tabel `password_reset_requests`: baris tadi berubah status jadi
     `APPROVED`, `approved_by` & `approved_at` terisi.
   - Badge lonceng HR berkurang (setelah polling berikutnya / reload).
   - Karyawan bisa login pakai password baru tsb.

## 4. Yang Sengaja Belum Disentuh

- Endpoint `PUT /api/password-reset/{id}/approve` (approve manual dengan
  password dummy yang diketik HR) **tetap ada**, tidak dihapus — kalau
  suatu saat masih dibutuhkan sebagai jalur alternatif.
- `ForgotPassword.jsx` masih pakai className Tailwind (bukan vanilla CSS)
  seperti sudah saya catat sebelumnya — di luar scope perbaikan kali ini,
  kabari kalau mau sekalian dirapikan ke vanilla CSS.
