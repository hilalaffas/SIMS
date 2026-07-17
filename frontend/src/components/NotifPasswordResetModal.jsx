// src/components/NotifPasswordResetModal.jsx
// [BARU] Muncul saat HR Admin/Super Admin klik salah satu notifikasi lonceng
// yang tipenya "password-reset" (lihat Navbar.jsx). Tombol "Proses" akan
// mengarahkan HR ke halaman /karyawan dan otomatis membuka modal edit
// karyawan yang bersangkutan (lihat Karyawan.jsx).
import React from 'react';
import './NotifPasswordResetModal.css';

const formatTanggal = (isoString) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

const NotifPasswordResetModal = ({ request, onClose, onProcess }) => {
  if (!request) return null;

  const namaTampil = request.employeeName || request.username;
  // employeeId bisa null kalau user belum punya baris di tabel employees
  // (lihat catatan di PasswordResetService.toPendingResponse backend) --
  // dalam kasus itu tombol "Proses" dinonaktifkan supaya tidak nyasar.
  const bisaDiproses = !!request.employeeId;

  return (
    <div className="modal-overlay_notif_reset" onClick={onClose}>
      <div className="modal-card_notif_reset" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-container_notif_reset">
          <span className="modal-icon_notif_reset">🔑</span>
        </div>

        <h3 className="modal-title_notif_reset">Permintaan Reset Sandi</h3>

        <p className="modal-message_notif_reset">
          Karyawan <strong>{namaTampil}</strong> ({request.username}) meminta reset sandi akun.
          {request.position && (
            <>
              {' '}Jabatan: <strong>{request.position}</strong>
              {request.divisiName ? ` (${request.divisiName})` : ''}.
            </>
          )}
        </p>

        <p className="modal-time_notif_reset">Diajukan: {formatTanggal(request.requestedAt)}</p>

        {!bisaDiproses && (
          <p className="modal-warning_notif_reset">
            ⚠️ Data karyawan untuk akun ini belum ditemukan di menu Karyawan, jadi tidak bisa
            diarahkan otomatis. Silakan cek manual di tabel karyawan.
          </p>
        )}

        <div className="modal-actions_notif_reset">
          <button className="btn-tutup_notif_reset" onClick={onClose}>
            Tutup
          </button>
          <button
            className="btn-proses_notif_reset"
            onClick={() => onProcess(request)}
            disabled={!bisaDiproses}
            title={!bisaDiproses ? 'Data karyawan tidak ditemukan' : 'Buka data karyawan ini'}
          >
            Proses
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotifPasswordResetModal;
