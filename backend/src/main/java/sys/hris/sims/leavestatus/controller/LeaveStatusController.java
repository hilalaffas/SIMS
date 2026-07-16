package sys.hris.sims.leavestatus.controller;

import lombok.RequiredArgsConstructor;
import sys.hris.sims.leavestatus.entity.LeaveStatus;
import sys.hris.sims.leavestatus.service.LeaveStatusService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import sys.hris.sims.activity_logs.service.ActivityLogService;
import org.springframework.security.core.Authentication;

import sys.hris.sims.user.repository.UserRepository;
import sys.hris.sims.user.entity.User;

@RestController
@RequestMapping("/api/status-cuti")
@RequiredArgsConstructor
public class LeaveStatusController {

    private final LeaveStatusService statusCutiService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    // Helper untuk konsistensi data log
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null) return null;
        User user = userRepository.findByUsername(authentication.getName());
        return user != null ? user.getUserId() : null;
    }

    private String getUsername(Authentication authentication) {
        return authentication != null ? authentication.getName() : "System";
    }

    @GetMapping
    public ResponseEntity<List<LeaveStatus>> getAllStatusCuti(Authentication authentication, HttpServletRequest httpRequest) {

        return ResponseEntity.ok(statusCutiService.getAllStatusCuti());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveStatus> getStatusCutiById(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {

               return ResponseEntity.ok(statusCutiService.getStatusCutiById(id));
    }

    @PostMapping
    public ResponseEntity<LeaveStatus> createStatusCuti(@RequestBody LeaveStatus statusCuti, Authentication authentication, HttpServletRequest httpRequest) {

        // catat activity log
        LeaveStatus saved = statusCutiService.createStatusCuti(statusCuti);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "CREATE_STATUS_CUTI", "leave_statuses", saved.getStatusId(), 
            "Menambah status cuti: " + saved.getStatusName(), httpRequest);
        
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveStatus> updateStatusCuti(@PathVariable Long id, @RequestBody LeaveStatus statusCuti, Authentication authentication, HttpServletRequest httpRequest) {

        // catat activity log
        LeaveStatus updated = statusCutiService.updateStatusCuti(id, statusCuti);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "UPDATE_STATUS_CUTI", "leave_statuses", id,"Mengupdate status cuti id: " + id, httpRequest);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStatusCuti(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {

        // catat activity log
        statusCutiService.deleteStatusCuti(id);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "DELETE_STATUS_CUTI", "leave_statuses", id, "Menghapus status cuti id: " + id, httpRequest);

        return ResponseEntity.ok("Status cuti berhasil dihapus");
    }
}