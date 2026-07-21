package sys.hris.sims.leave.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaveApprovalResponse {
    private Long leaveRequestId;
    private String employeeName;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private String reason;
    private String pendingWork;
    private String coveredBy;
    private Long leaderEmployeeId;
    private String leaderName;
    private Long spvEmployeeId;
    private String spvName;
    private Long managerEmployeeId;
    private String managerName;
    private String overallStatus;
    private String myApprovalStatus;
    private String reviewNote;
    private List<LeaveApprovalLogResponse> approvalLogs;
}
