import React from 'react';
import './LeaveHistory.css';

const LeaveHistory = ({
  riwayatCuti = [],
  filterStatus,
  setFilterStatus,
  handleOpenDetail,
  handleEditKembali
}) => {
  // Filter data riwayat berdasarkan status yang dipilih
  const filteredRiwayat = riwayatCuti.filter((item) => {
    if (filterStatus === 'Semua Berkas') return true;
    
    const statusLower = String(item.status || '').toLowerCase();
    if (filterStatus === 'Dalam Proses') {
      return statusLower === 'proses' || statusLower === 'dalam proses';
    }
    
    return item.status === filterStatus;
  });

  // Fungsi pembantu untuk mendapatkan timestamp sebagai patokan pengurutan
  const getSortTimestamp = (item) => {
    const rawDari = item.rawDetail?.dariTanggal;
    if (rawDari) {
      const timestamp = new Date(rawDari).getTime();
      if (!isNaN(timestamp)) return timestamp;
    }

    const stringTanggal = item.stringTanggal || '';
    const match = stringTanggal.match(/^(\d{1,2})\s+([A-Za-z]+)\s*-\s*\d{1,2}\s+[A-Za-z]+\s+(\d{4})/);
    if (match) {
      const parsed = new Date(`${match[1]} ${match[2]} ${match[3]}`).getTime();
      if (!isNaN(parsed)) return parsed;
    }

    return item.id || 0;
  };

  // Urutkan pengajuan terbaru di posisi paling atas
  const sortedRiwayat = [...filteredRiwayat].sort(
    (a, b) => getSortTimestamp(b) - getSortTimestamp(a)
  );

  const hasGlobalNotification = riwayatCuti.some((item) => item.isUnread);

  // Helper untuk mendapatkan nama jenis cuti
  const getLeaveTypeName = (jenisCuti) => {
    if (typeof jenisCuti === 'object' && jenisCuti !== null) {
      return jenisCuti.name;
    }
    return jenisCuti;
  };

  // Ubah "3 Agu 2026 - 3 Agu 2026" menjadi "3 Agu - 3 Agu 2026"
  // (tahun pada tanggal awal disembunyikan jika sama dengan tahun tanggal akhir)
  const formatShortDateRange = (rangeStr) => {
    if (!rangeStr) return rangeStr;
    const match = rangeStr.trim().match(/^(\d{1,2}\s+\S+)\s+(\d{4})\s*-\s*(\d{1,2}\s+\S+)\s+(\d{4})$/);
    if (!match) return rangeStr;

    const [, startPart, startYear, endPart, endYear] = match;
    return startYear === endYear
      ? `${startPart} - ${endPart} ${endYear}`
      : `${startPart} ${startYear} - ${endPart} ${endYear}`;
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="history-title-container">
          <i className="fa-solid fa-clock-rotate-left history-header-icon"></i>
          <h3 className="history-title">
            Riwayat & Status Pengajuan 
            {hasGlobalNotification && <span className="dot-badge-global"></span>}
          </h3>
        </div>

        <div className="history-filter-container">
          <span className="filter-label">FILTER:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-dropdown"
          >
            <option value="Semua Berkas">Semua Berkas</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Disetujui (ACC)">Disetujui (ACC)</option>
            <option value="Dikembalikan">Dikembalikan</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="history-body">
        {sortedRiwayat.length === 0 ? (
          <div className="empty-history-box">Belum ada riwayat pengajuan.</div>
        ) : (
          <div className="history-list">
            {sortedRiwayat.map((item) => {
              const statusLower = String(item.status || 'proses').toLowerCase();
              const statusUpper = String(item.status || 'PROSES').toUpperCase();
              const classCleanStatus = statusLower.replace(/[^a-z]/g, '');

              const isProses = statusLower === 'proses' || statusLower === 'dalam proses';
              const isDikembalikan = classCleanStatus === 'dikembalikan';

              return (
                <div
                  key={item.id}
                  className={`history-item-card ${isDikembalikan ? 'border-alert-red' : ''}`}
                >
                  <div
                    className="history-item-left clickable"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {item.isUnread && <span className="dot-badge-item"></span>}
                    <div className="history-item-info">
                      <span className="history-item-leave-type">
                        {getLeaveTypeName(item.jenisCuti)}
                      </span>
                      <p className="history-item-dates">
                        {formatShortDateRange(item.stringTanggal)} {item.totalHari && `(${item.totalHari})`}
                      </p>
                    </div>
                  </div>

                  <div className="history-item-actions">
                    {isProses ? (
                      <div className="action-wrapper">
                        <span
                          className="status-badge-list dalam-proses clickable"
                          onClick={() => handleOpenDetail(item)}
                        >
                          DALAM PROSES
                        </span>
                      </div>
                    ) : isDikembalikan ? (
                      <div className="action-wrapper">
                        <span
                          className="status-badge-list dikembalikan clickable"
                          onClick={() => handleOpenDetail(item)}
                        >
                          DIKEMBALIKAN
                        </span>
                        <button
                          type="button"
                          className="btn-edit-inline"
                          onClick={() => handleEditKembali(item.id)}
                        >
                          <i className="fa-regular fa-pen-to-square"></i> Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`status-badge-btn ${classCleanStatus}`}
                        onClick={() => handleOpenDetail(item)}
                      >
                        {classCleanStatus === 'disetujuiacc' ? 'DISETUJUI' : statusUpper}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveHistory;