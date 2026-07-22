package sys.hris.sims.leave.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaveBalanceResponse {
    private Long employeeId;
    private String employeeName;
    private BigDecimal annualQuota;
    private BigDecimal usedAnnualLeave;
    private BigDecimal remainingAnnualLeave;
}
