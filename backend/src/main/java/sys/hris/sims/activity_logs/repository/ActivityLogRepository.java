package sys.hris.sims.activity_logs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sys.hris.sims.activity_logs.entity.ActivityLog;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Transactional
    @Query("DELETE FROM ActivityLog a WHERE a.createdAt <= :thresholdDate")
    void deleteLogsOlderThan(@Param("thresholdDate") LocalDateTime thresholdDate);
}