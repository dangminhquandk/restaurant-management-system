package com.hust.rms.service;

import com.hust.rms.domain.entity.AuditLog;
import com.hust.rms.domain.entity.User;
import com.hust.rms.repository.AuditLogRepository;
import com.hust.rms.repository.UserRepository;
import com.hust.rms.security.RmsUserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records tamper-evident operational audit trail entries for sensitive domain actions.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logCurrentActor(String action, String targetType, Long targetId, String detail) {
        User actor = resolveCurrentActor();
        log(actor, action, targetType, targetId, detail);
    }

    @Transactional
    public void log(User actor, String action, String targetType, Long targetId, String detail) {
        AuditLog entry = new AuditLog();
        entry.setActor(actor);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setDetail(detail);
        auditLogRepository.save(entry);
    }

    private User resolveCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof RmsUserPrincipal principal)) {
            return null;
        }
        return userRepository.findById(principal.getId()).orElse(null);
    }
}
