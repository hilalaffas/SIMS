package sys.hris.sims.holiday.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import sys.hris.sims.activity_logs.service.ActivityLogService;
import sys.hris.sims.holiday.dto.HolidayRequest;
import sys.hris.sims.holiday.service.HolidayService;
import sys.hris.sims.user.entity.User;
import sys.hris.sims.user.repository.UserRepository;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    // Helper untuk konsistensi ID User
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null) return null;
        User user = userRepository.findByUsername(authentication.getName());
        return user != null ? user.getUserId() : null;
    }

    // Helper untuk konsistensi Username
    private String getUsername(Authentication authentication) {
        return authentication != null ? authentication.getName() : "System";
    }

    // GET semua hari libur
    @GetMapping
    public ResponseEntity<?> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    // GET hari libur by bulan
    @GetMapping("/month")
    public ResponseEntity<?> getByMonth(
            @RequestParam int year,
            @RequestParam int month) {

        return ResponseEntity.ok(holidayService.getHolidaysByMonth(year, month));
    }

    // GET hari libur by range tanggal
    @GetMapping("/range")
    public ResponseEntity<?> getByRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {

        return ResponseEntity.ok(holidayService.getHolidaysByRange(start, end));
    }

    // GET cek apakah tanggal tertentu hari libur
    @GetMapping("/check")
    public ResponseEntity<?> checkHoliday(
            @RequestParam LocalDate date) {
        
        boolean isHoliday = holidayService.isHoliday(date);
        return ResponseEntity.ok(isHoliday);
    }

    // POST tambah hari libur
    @PostMapping
    public ResponseEntity<?> createHoliday(
            @RequestBody HolidayRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        Long userId = getCurrentUserId(authentication);
        var saved = holidayService.createHoliday(request, userId);
        
        activityLogService.log(getUsername(authentication), userId,
                "CREATE_HOLIDAY", "holidays", saved.getHolidayId(),
                "Menambah hari libur: " + saved.getName(), httpRequest);
        return ResponseEntity.ok(saved);
    }

    // PUT update hari libur
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHoliday(
            @PathVariable Long id,
            @RequestBody HolidayRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        var updated = holidayService.updateHoliday(id, request);
        
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication),
                "UPDATE_HOLIDAY", "holidays", id,
                "Mengupdate hari libur: " + updated.getName(), httpRequest);
        return ResponseEntity.ok(updated);
    }

    // DELETE hari libur
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHoliday(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        holidayService.deleteHoliday(id);
        
        activityLogService.log(getUsername(authentication), getCurrentUserId(authentication),
                "DELETE_HOLIDAY", "holidays", id,
                "Menghapus hari libur dengan ID: " + id, httpRequest);
        return ResponseEntity.ok("Hari libur berhasil dihapus");
    }
}