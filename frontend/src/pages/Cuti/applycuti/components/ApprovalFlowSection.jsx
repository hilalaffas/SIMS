import React from 'react';
import './LeaveForm.css';

/**
 * Bagian: PILIH ALUR APPROVAL CUTI (Leader / SPV / Manager)
 * Nama prop mengikuti field payload backend (leaderEmployeeId/spvEmployeeId/managerEmployeeId)
 * supaya tidak perlu mapping ulang saat submit ke API.
 */
const ApprovalFlowSection = ({
  leaderEmployeeId, setLeaderEmployeeId,
  spvEmployeeId, setSpvEmployeeId,
  managerEmployeeId, setManagerEmployeeId,
  approvers = { LEADER: [], SPV: [], MANAGER: [] },
  isSupervisor = false,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">PILIH ALUR APPROVAL CUTI *</label>
      <div className="approval-row">
        <div className="approval-col">
          <span className="badge-approval leader">Leader</span>
          <select
            value={isSupervisor ? '' : leaderEmployeeId}
            onChange={(e) => setLeaderEmployeeId(e.target.value)}
            className="form-control"
            required={!isSupervisor}
            disabled={isSupervisor}
          >
            <option value="">{isSupervisor ? 'None' : 'Pilih...'}</option>
            {!isSupervisor && approvers.LEADER.map(person => (
              <option key={person.employeeId} value={person.employeeId}>{person.fullName}</option>
            ))}
          </select>
        </div>

        <div className="approval-col">
          <span className="badge-approval spv">SPV</span>
          <select
            value={isSupervisor ? '' : spvEmployeeId}
            onChange={(e) => setSpvEmployeeId(e.target.value)}
            className="form-control"
            required={!isSupervisor}
            disabled={isSupervisor}
          >
            <option value="">{isSupervisor ? 'None' : 'Pilih...'}</option>
            {!isSupervisor && approvers.SPV.map(person => (
              <option key={person.employeeId} value={person.employeeId}>{person.fullName}</option>
            ))}
          </select>
        </div>

        <div className="approval-col">
          <span className="badge-approval manager">Manager</span>
          <select
            value={managerEmployeeId}
            onChange={(e) => setManagerEmployeeId(e.target.value)}
            className="form-control"
            required
          >
            <option value="">Pilih...</option>
            {approvers.MANAGER.map(person => (
              <option key={person.employeeId} value={person.employeeId}>{person.fullName}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ApprovalFlowSection;
