import React, { useEffect, useState } from 'react';
import { getApprovalDetail, getMyLeaveDetail, takeApprovalAction, mapApproval } from '../../../../services/CutiService'; // PERBAIKAN: Import Service API Nyata
import './LeaveDetailModal.css'; 

const STATUS_LABEL = {
  'PROSES': "Proses",
  'PENDING': "Proses",
  'DALAM PROSES': "Proses",
  'DISETUJUI': "Disetujui",
  'APPROVED': "Disetujui",
  'DIKEMBALIKAN': "Dikembalikan",
  'RETURNED': "Dikembalikan",
  'DITOLAK': "Ditolak",
  'REJECTED': "Ditolak",
};

const LeaveDetailModal = ({ selectedDetail, onClose, currentUserRole, onRefreshData, allHistory = [], employeeLookup = {} }) => {
  const [detailData, setDetailData] = useState(selectedDetail);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // =========================================================================
  // 1. KONEKSI API NYATA: GET DETAIL REAL-TIME FETCH
  // =========================================================================
  useEffect(() => {
    if (selectedDetail?.id) {
      const fetchLatestDetail = async () => {
        setIsLoading(true);
        try {
          const isAtasan = ['LEADER', 'SPV', 'MANAGER'].includes(
            String(currentUserRole).toUpperCase().replace(/^ROLE_/, '')
          );

          // Panggil API sesuai dengan Role User yang sedang login
          const rawData = isAtasan 
            ? await getApprovalDetail(selectedDetail.id)
            : await getMyLeaveDetail(selectedDetail.id);

          const formattedData = mapApproval(rawData, employeeLookup);
          setDetailData(formattedData); 
        } catch (error) {
          console.error("Gagal mengambil data detail terbaru:", error);
          // Fallback ke data bawaan yang dilempar dari props jika API error
          setDetailData(selectedDetail);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLatestDetail();
    }
  }, [selectedDetail, currentUserRole]);

  if (!detailData) return null;

  const statusKey = (detailData.statusBerkas || 'PROSES').toUpperCase();
  const statusTercetak = STATUS_LABEL[statusKey] || detailData.statusBerkas || "Proses";

  // =========================================================================
  // LOGIKA MENDAPATKAN TOTAL DURASI HARI CUTI
  // =========================================================================
  const getFormattedDuration = () => {
    // 1. Cek dari field totalDays atau totalHari
    const totalDaysNum = detailData.totalDays || detailData.totalHari;
    if (totalDaysNum) {
      return `${totalDaysNum} Hari`;
    }

    // 2. Jika berbentuk string durasi seperti "20 Jan 2026 - 22 Jan 2026 (3 Hari)"
    if (detailData.durasi && detailData.durasi.includes('(')) {
      const extracted = detailData.durasi.match(/\(([^)]+)\)/);
      if (extracted && extracted[1]) {
        return extracted[1]; // Mengambil teks dalam kurung, misal "3 Hari"
      }
    }

    return '-';
  };

  const formattedDurasiKerja = getFormattedDuration();

  // =========================================================================
  // 2. KONEKSI API NYATA: AKSI PERSETUJUAN / APPROVAL 
  // =========================================================================
  const handleActionApproval = async (statusAksi) => {
    const catatanAtasan = prompt(`Masukkan alasan/catatan untuk tindakan ${statusAksi}:`);
    if (catatanAtasan === null) return; // Batal jika menekan cancel pada prompt

    try {
      // Mengubah statusAksi menjadi lowercase ('approve', 'reject', 'return') agar pas dengan endpoint Java
      const actionEndpoint = statusAksi.toLowerCase() === 'approved' ? 'approve' : 
                             statusAksi.toLowerCase() === 'returned' ? 'return' : 'reject';

      await takeApprovalAction(detailData.id, actionEndpoint, catatanAtasan);
      
      alert(`Berkas berhasil diperbarui!`);
      if (onRefreshData) onRefreshData(); 
      onClose(); 
    } catch (error) {
      alert("Gagal memperbarui status persetujuan: " + (error.message || 'Error Server'));
    }
  };

  // Cek apakah user saat ini adalah atasan yang berwenang di alur dokumen ini
  const isAtasan = ['LEADER', 'SPV', 'MANAGER'].includes(String(currentUserRole).toUpperCase());

  return (
    <div className="form-cuti__overlay" onMouseDown={onClose}>
      <div className="form-cuti__modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        
        {/* HEADER MODAL */}
        <div className="form-cuti__header">
          <div>
            <h2 className="form-cuti__title">Informasi Detail Berkas Cuti {isLoading && "(Memuat...)"}</h2>
            <p className="form-cuti__subtitle">Pantau alur verifikasi berkas secara berjenjang</p>
          </div>
          <button type="button" className="form-cuti__close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY MODAL */}
        <div className="form-cuti__body">
          <div className="form-cuti__grid">
            <div className="form-cuti__field">
              <span className="form-cuti__label">Pemohon</span>
              <span className="form-cuti__value">{detailData.karyawan?.nama}</span>
            </div>
            <div className="form-cuti__field">
              <span className="form-cuti__label">Jenis Permohonan</span>
              <span className="form-cuti__value">{detailData.jenisCuti}</span>
            </div>
            <div className="form-cuti__field">
              <span className="form-cuti__label">Durasi Kerja</span>
              <span className="form-cuti__value form-cuti__value--accent">
                {formattedDurasiKerja} {/* PERBAIKAN: Menampilkan total lamanya cuti (misal: "3 Hari") */}
              </span>            
             </div>
            <div className="form-cuti__field">
              <span className="form-cuti__label">Status Sekarang</span>
              <span className="form-cuti__value">{statusTercetak}</span>
            </div>
          </div>

          <div className="form-cuti__divider" />

          {/* Alur Approval Menyamping */}
          <div className="form-cuti__grid form-cuti__grid--three">
            <div className="form-cuti__field">
              <span className="form-cuti__label">App. Leader</span>
              <span className="form-cuti__value">
                {detailData.approvalChain?.leader || detailData.leaderName || detailData.leader?.fullName || '-'}
              </span>
            </div>

            <div className="form-cuti__field">
              <span className="form-cuti__label">App. SPV</span>
              <span className="form-cuti__value">
                {detailData.approvalChain?.spv || detailData.spvName || detailData.spv?.fullName || '-'}
              </span>
            </div>

            <div className="form-cuti__field">
              <span className="form-cuti__label">App. Manager</span>
              <span className="form-cuti__value">
                {detailData.approvalChain?.manager || detailData.managerName || detailData.manager?.fullName || '-'}
              </span>
            </div>
          </div>

          {/* Keterangan & Alasan */}
          <div className="form-cuti__section">
            <span className="form-cuti__label">Alasan Keterangan</span>
            <div className="form-cuti__box">{detailData.keterangan || '-'}</div>
          </div>

          {/* Pekerjaan Tertunda */}
          <div className="form-cuti__section">
            <span className="form-cuti__label">Pekerjaan Tertunda</span>
            <div className="form-cuti__box">
              {detailData.pendingWork || '-'}
            </div>
          </div>

          {/* Backup PIC / Dicover Oleh */}
          <div className="form-cuti__section">
            <span className="form-cuti__label">Dicover Oleh (Backup PIC)</span>
            <div className="form-cuti__box form-cuti__box--warn">
              <strong>{detailData.coveredBy || '-'}</strong>
            </div>
          </div>

          {/* Riwayat Pengajuan Cuti Sebelumnya */}
          <div className="form-cuti__section">
            <span className="form-cuti__label">Semua Riwayat Pengajuan Cuti Anda</span>
            <div className="form-cuti__log-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allHistory.length > 0 ? (
                [...allHistory]
                  .sort((a, b) => {
                    const aIsPending = !a.status?.toLowerCase().includes('setujui') && !a.status?.toLowerCase().includes('tolak') && a.status !== 'APPROVED' && a.status !== 'REJECTED';
                    const bIsPending = !b.status?.toLowerCase().includes('setujui') && !b.status?.toLowerCase().includes('tolak') && b.status !== 'APPROVED' && b.status !== 'REJECTED';

                    if (aIsPending && !bIsPending) return -1;
                    if (!aIsPending && bIsPending) return 1;

                    return (b.id || 0) - (a.id || 0);
                  })
                  .map((item, idx) => {
                    const isAcc = item.status?.toLowerCase().includes('setujui') || item.status === 'APPROVED';
                    const isDitolak = item.status?.toLowerCase().includes('tolak') || item.status === 'REJECTED';
                    const isDikembalikan = item.status?.toLowerCase().includes('kembali') || item.status === 'RETURNED';
                    
                    let dotColor = '#eab308';
                    if (isAcc) dotColor = '#22c55e';
                    if (isDitolak) dotColor = '#ef4444';
                    if (isDikembalikan) dotColor = '#f97316';

                    // Bersihkan teks stringTanggal dari teks di dalam kurung (X Hari) jika ada
                    const historyDateOnly = (item.stringTanggal || '').split('(')[0].trim();

                    return (
                      <div className="form-cuti__log-item" key={idx} style={{ opacity: item.id === detailData.id ? 1 : 0.75 }}>
                        <div className="form-cuti__log-dot" style={{ backgroundColor: dotColor }} />
                        <div className="form-cuti__log-content">
                          <div className="form-cuti__log-top">
                            <span className="form-cuti__log-role" style={{ fontWeight: item.id === detailData.id ? '700' : '600' }}>
                              {item.jenisCuti} {item.id === detailData.id && <span style={{ fontSize: '11px', color: '#0284c7' }}>(Berkas Ini)</span>}
                            </span>
                            <span className="form-cuti__log-time">{historyDateOnly}</span>
                          </div>
                          <div className="form-cuti__log-bottom" style={{ marginTop: '2px' }}>
                            Durasi: {item.totalHari} &middot; Status: <strong style={{ color: dotColor }}>{item.status}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="form-cuti__box" style={{ color: '#6b7280', textAlign: 'center', fontSize: '14px' }}>
                  Belum ada riwayat pengajuan cuti sebelumnya.
                </div>
              )}
            </div>
          </div>

          {/* Catatan Feedback Tambahan Khusus Jika Dikembalikan */}
          {detailData.globalStatus?.toLowerCase() === 'dikembalikan' && detailData.spv?.catatan && (
            <div className="form-cuti__section" style={{ marginTop: '4px' }}>
              <div className="form-cuti__box form-cuti__box--warn" style={{ color: '#b91c1c', borderColor: '#fca5a5', background: '#fef2f2' }}>
                <strong>Catatan Pengembalian (SPV):</strong> {detailData.spv.catatan}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="form-cuti__footer">
          {isAtasan && statusKey === 'PROSES' ? (
            <div className="action-approval-buttons" style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button type="button" className="btn-approve" style={{ background: '#16a34a', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleActionApproval('Approved')}>Setujui (ACC)</button>
              <button type="button" className="btn-return" style={{ background: '#ea580c', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleActionApproval('Returned')}>Kembalikan</button>
              <button type="button" className="btn-reject" style={{ background: '#dc2626', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleActionApproval('Rejected')}>Tolak</button>
              <button type="button" style={{ marginLeft: 'auto', background: '#ccc', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={onClose}>Batal</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
              <button type="button" className="form-cuti__close-btn" onClick={onClose}>Tutup Detail</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LeaveDetailModal;