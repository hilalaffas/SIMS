package sys.hris.sims.leavetype.controller;

import lombok.RequiredArgsConstructor;
import sys.hris.sims.leavetype.entity.LeaveType;
import sys.hris.sims.leavetype.service.LeaveTypeService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import sys.hris.sims.activity_logs.service.ActivityLogService;
import org.springframework.security.core.Authentication;

import sys.hris.sims.user.repository.UserRepository;
import sys.hris.sims.user.entity.User;

@RestController
@RequestMapping("/api/jenis-cuti")
@RequiredArgsConstructor
public class LeaveTypeController {

    private final LeaveTypeService jenisCutiService;
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
    public ResponseEntity<List<LeaveType>> getAllJenisCuti(Authentication authentication, HttpServletRequest httpRequest) {

        return ResponseEntity.ok(jenisCutiService.getAllJenisCuti());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveType> getJenisCutiById(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {

        return ResponseEntity.ok(jenisCutiService.getJenisCutiById(id));
    }

    @PostMapping
    public ResponseEntity<LeaveType> createJenisCuti(@RequestBody LeaveType jenisCuti, Authentication authentication, HttpServletRequest httpRequest) {

        // catat activity log
        LeaveType saved = jenisCutiService.createJenisCuti(jenisCuti);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "CREATE_JENIS_CUTI", "leave_types", saved.getLeaveTypeId(), "Menambah jenis cuti: " + saved.getName(), httpRequest);
        
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveType> updateJenisCuti(@PathVariable Long id, @RequestBody LeaveType jenisCuti, Authentication authentication, HttpServletRequest httpRequest) {
        
        // catat activity log
        LeaveType updated = jenisCutiService.updateJenisCuti(id, jenisCuti);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "UPDATE_JENIS_CUTI", "leave_types", id,"Mengupdate jenis cuti id: " + id, httpRequest);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteJenisCuti(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {

        // catat activity log
        jenisCutiService.deleteJenisCuti(id);
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication), 
            "DELETE_JENIS_CUTI", "leave_types", id, "Menghapus jenis cuti id: " + id, httpRequest);

        return ResponseEntity.ok("Jenis cuti berhasil dihapus");
    }
}