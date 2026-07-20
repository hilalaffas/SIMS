import { api } from './api';

const statusLabel = (value) => ({ PENDING: 'Dalam Proses', APPROVED: 'Disetujui (ACC)', RETURNED: 'Dikembalikan', REJECTED: 'Ditolak' }[String(value || '').toUpperCase()] || value || 'Dalam Proses');
const statusCode = (value) => ({ PENDING: 'PROSES', APPROVED: 'DISETUJUI', RETURNED: 'DIKEMBALIKAN', REJECTED: 'DITOLAK' }[String(value || '').toUpperCase()] || 'PROSES');
const dateText = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const logDateText = (value) => value ? new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value)).replace(',', '') : '-';
const logStatusLabel = (value) => ({
  PENDING: 'DIAJUKAN', APPROVED: 'DISETUJUI (ACC)', RETURNED: 'DIKEMBALIKAN (RETURN)', REJECTED: 'DITOLAK',
}[String(value || '').toUpperCase()] || value || '-');

export const getLeaveBalance = () => api.get('/api/cuti/balance/me');
export const getApprovers = (role) => api.get(`/api/karyawan/approvers?role=${role}`);
export const getLeaveTypes = () => api.get('/api/jenis-cuti');

export async function submitCuti(payload) {
  const body = {
    leaveType: { leaveTypeId: Number(payload.leaveTypeId) },
    startDate: payload.dariTanggal,
    endDate: payload.sampaiTanggal,
    reason: payload.alasan,
    pendingWork: payload.pekerjaanTertunda,
    coveredBy: payload.coverOleh,
    leaderEmployeeId: payload.leaderEmployeeId || null,
    spvEmployeeId: payload.spvEmployeeId || null,
    managerEmployeeId: payload.managerEmployeeId || null,
  };
  return api.post('/api/cuti', body);
}

// [BARU] Cuti Susulan/Darurat oleh HR Admin/Super Admin atas nama karyawan.
// Backend (LeaveService.createUrgentCuti) otomatis set status APPROVED,
// endpoint ini juga sudah dibatasi role HRD_ADMIN/SUPER_ADMIN di SecurityConfig.
export async function submitUrgentCuti(payload) {
  const body = {
    employee: { employeeId: Number(payload.karyawanId) },
    leaveType: { leaveTypeId: Number(payload.leaveTypeId) },
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.alasan,
    pendingWork: payload.pekerjaanTertunda,
    coveredBy: payload.dicoverOleh,
    leaderEmployeeId: payload.leaderEmployeeId || null,
    spvEmployeeId: payload.spvEmployeeId || null,
    managerEmployeeId: payload.managerEmployeeId || null,
  };
  return api.post('/api/cuti/urgent', body);
}

export const resubmitCuti = (id, payload) => api.put(`/api/cuti/${id}/resubmit`, {
  leaveType: { leaveTypeId: Number(payload.leaveTypeId) },
  startDate: payload.dariTanggal,
  endDate: payload.sampaiTanggal,
  reason: payload.alasan,
  pendingWork: payload.pekerjaanTertunda,
  coveredBy: payload.coverOleh,
  leaderEmployeeId: payload.leaderEmployeeId || null,
  spvEmployeeId: payload.spvEmployeeId || null,
  managerEmployeeId: payload.managerEmployeeId || null,
});

export function mapMyLeave(item) {
  const status = item.status?.statusName || item.status || 'PENDING';
  return {
    id: item.leaveRequestId,
    userName: item.employee?.fullName,
    jenisCuti: item.leaveType?.name || 'Cuti',
    stringTanggal: `${dateText(item.startDate)} - ${dateText(item.endDate)}`,
    totalHari: `${item.totalDays || 0} Hari`,
    status: statusLabel(status),
    rawDetail: { jenisCuti: item.leaveType?.name, dariTanggal: item.startDate, sampaiTanggal: item.endDate, alasan: item.reason, pekerjaanTertunda: item.pendingWork, coverOleh: item.coveredBy, reviewNote: item.reviewNote },
  };
}

export async function getRiwayatByUser() { return (await api.get('/api/cuti/me')).map(mapMyLeave); }
export const getMyLeaveDetail = (id) => api.get(`/api/cuti/me/${id}`);

export async function getTeamLeaveByYear(year) {
  const requests = await api.get(`/api/cuti/calendar?year=${year}`);
  const result = {};

  requests
    .filter((item) => ['PENDING', 'APPROVED'].includes(String(item.status?.statusName || item.status || '').toUpperCase()))
    .forEach((item) => {
      const start = new Date(`${item.startDate}T00:00:00`);
      const end = new Date(`${item.endDate}T00:00:00`);
      for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        if (date.getFullYear() !== Number(year)) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        (result[key] ??= []).push({
          nama: item.employee?.fullName || 'Karyawan',
          jenisCuti: item.leaveType?.name || 'Cuti',
          status: statusLabel(item.status?.statusName || item.status),
        });
      }
    });

  return result;
}

export function mapApproval(item) {
  const logs = item.approvalLogs || [];
  const chain = Object.fromEntries(['LEADER', 'SPV', 'MANAGER'].map(role => {
    const entry = logs.find(log => log.approverRole === role);
    return [role.toLowerCase(), entry?.approverName || '-'];
  }));
  const submissionLog = item.submittedAt ? [{
    nama: item.employeeName || 'Pemohon', waktu: logDateText(item.submittedAt), statusBadge: 'DIAJUKAN',
    catatan: 'Permohonan cuti diajukan.',
  }] : [];

  return {
    id: item.leaveRequestId,
    karyawan: { nama: item.employeeName, kode: `CUTI-${item.leaveRequestId}`, jabatan: '-' },
    jenisCuti: item.leaveType,
    durasi: `${dateText(item.startDate)} - ${dateText(item.endDate)} (${item.totalDays} Hari)`,
    keterangan: item.reason || '-',
    pekerjaanTertunda: item.pendingWork || '-',
    dicoverOleh: item.coveredBy || '-',
    statusBerkas: statusCode(item.overallStatus),
    approvalChain: chain,
    submittedAt: item.submittedAt || null, // [BARU] dipakai Navbar utk timestamp notifikasi
    riwayatLog: [
      ...submissionLog,
      ...logs.filter(log => String(log.action).toUpperCase() !== 'PENDING').map(log => ({
        nama: log.approverName || log.approverRole,
        waktu: logDateText(log.actedAt),
        statusBadge: logStatusLabel(log.action),
        catatan: log.note || '-',
      })),
    ],
  };
}

// [BARU] Dipakai tab "Cuti Karyawan" di halaman Manajemen Karyawan (HR/Super
// Admin) — menggantikan data dummy allLeaveHistory. Bentuk hasil mapping
// disamakan dengan mapApproval() supaya kompatibel dengan LeaveListHr.jsx &
// modal rincian (Form.jsx) yang sudah ada.
// Catatan: approvalChain (nama Leader/SPV/Manager) belum tersedia dari
// endpoint GET /api/cuti (data itu ada di tabel leave_request_approvals,
// baru diekspos lewat /api/cuti/approvals/* untuk approver) — ditampilkan
// '-' untuk sementara.
export function mapKaryawanLeave(item) {
  const status = item.status?.statusName || item.status || 'PENDING';
  const hasBeenReviewed = String(status).toUpperCase() !== 'PENDING';

  return {
    id: item.leaveRequestId,
    karyawan: { nama: item.employee?.fullName, kode: item.employee?.nikKaryawan || '-' },
    jenisCuti: item.leaveType?.name || 'Cuti',
    durasi: `${dateText(item.startDate)} - ${dateText(item.endDate)} (${item.totalDays || 0} Hari)`,
    statusBerkas: statusCode(status),
    keterangan: item.reason || '-',
    pekerjaanTertunda: item.pendingWork || '-',
    dicoverOleh: item.coveredBy || '-',
    approvalChain: { leader: '-', spv: '-', manager: '-' },
    riwayatLog: hasBeenReviewed ? [{
      nama: item.reviewedBy?.fullName || 'Sistem',
      waktu: logDateText(item.approvedAt || item.returnedAt),
      statusBadge: logStatusLabel(status),
      catatan: item.reviewNote || '-',
    }] : [],
  };
}

export async function getAllLeaveRequestsForHr() {
  return (await api.get('/api/cuti')).map(mapKaryawanLeave);
}

export const getPendingApprovals = async () => (await api.get('/api/cuti/approvals/my-task')).map(mapApproval);
export const getApprovalHistory = async () => (await api.get('/api/cuti/approvals/history')).map(mapApproval);
export const getApprovalDetail = async (id) => mapApproval(await api.get(`/api/cuti/approvals/${id}`));
export const takeApprovalAction = (id, action, note) => api.put(`/api/cuti/${id}/${action}`, { note });
