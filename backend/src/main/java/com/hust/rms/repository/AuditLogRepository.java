package com.hust.rms.repository;

import com.hust.rms.domain.entity.AuditLog;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.actor ORDER BY a.createdAt DESC, a.id DESC")
    List<AuditLog> findRecentWithActor(Pageable pageable);
}
