package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.Role;
import com.hust.rms.dto.user.CreateUserRequest;
import com.hust.rms.dto.user.UpdateUserRequest;
import com.hust.rms.dto.user.UpdateUserStatusRequest;
import com.hust.rms.dto.user.UserDto;
import com.hust.rms.repository.UserRepository;
import com.hust.rms.service.mapper.DtoMapper;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages staff, kitchen, and administrator accounts with last-active-ADMIN protection and audit logging.
 */
@Service
public class UserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_.-]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserDto> listUsers() {
        return userRepository.findAllByOrderByIdAsc().stream()
                .map(DtoMapper::toUserDto)
                .toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String normalizedUsername = request.username().trim();
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ConflictException("USERNAME_DUPLICATE", "Tên đăng nhập đã tồn tại.");
        }
        User user = new User();
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setIsActive(request.isActive() != null ? request.isActive() : Boolean.TRUE);
        User saved = userRepository.saveAndFlush(user);

        auditLogService.logCurrentActor(
                "USER_CREATED",
                "USERS",
                saved.getId(),
                String.format("Tạo tài khoản '%s' với vai trò %s", saved.getUsername(), saved.getRole())
        );
        return DtoMapper.toUserDto(saved);
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);
        boolean nextActive = request.isActive() != null
                ? request.isActive()
                : Boolean.TRUE.equals(user.getIsActive());

        ensureNotRemovingLastActiveAdmin(user, request.role(), nextActive);
        applyUsernameUpdateIfPresent(user, request.username());
        applyPasswordUpdateIfPresent(user, request.password());

        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setIsActive(nextActive);
        User saved = userRepository.saveAndFlush(user);

        auditLogService.logCurrentActor(
                "USER_UPDATED",
                "USERS",
                saved.getId(),
                String.format(
                        "Cập nhật tài khoản '%s' (role=%s, isActive=%s)",
                        saved.getUsername(),
                        saved.getRole(),
                        saved.getIsActive()
                )
        );
        return DtoMapper.toUserDto(saved);
    }

    @Transactional
    public UserDto updateUserStatus(Long id, UpdateUserStatusRequest request) {
        User user = findUserOrThrow(id);
        boolean nextActive = Boolean.TRUE.equals(request.isActive());
        ensureNotRemovingLastActiveAdmin(user, user.getRole(), nextActive);

        user.setIsActive(nextActive);
        User saved = userRepository.saveAndFlush(user);

        auditLogService.logCurrentActor(
                "USER_STATUS_CHANGED",
                "USERS",
                saved.getId(),
                String.format("Đổi trạng thái hoạt động tài khoản '%s' thành %s", saved.getUsername(), nextActive)
        );
        return DtoMapper.toUserDto(saved);
    }

    private void applyUsernameUpdateIfPresent(User user, String rawUsername) {
        if (rawUsername == null || rawUsername.isBlank()) {
            return;
        }
        String trimmed = rawUsername.trim();
        if (!USERNAME_PATTERN.matcher(trimmed).matches()) {
            throw new BadRequestException("INVALID_USERNAME", "Tên đăng nhập chỉ gồm chữ, số và ký tự _ . -");
        }
        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(trimmed, user.getId())) {
            throw new ConflictException("USERNAME_DUPLICATE", "Tên đăng nhập đã tồn tại.");
        }
        user.setUsername(trimmed);
    }

    private void applyPasswordUpdateIfPresent(User user, String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return;
        }
        if (rawPassword.length() < 6) {
            throw new BadRequestException("WEAK_PASSWORD", "Mật khẩu mới phải có tối thiểu 6 ký tự.");
        }
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
    }

    private void ensureNotRemovingLastActiveAdmin(User targetUser, Role nextRole, boolean nextActive) {
        boolean isCurrentlyActiveAdmin = targetUser.getRole() == Role.ADMIN
                && Boolean.TRUE.equals(targetUser.getIsActive());
        boolean willRemainActiveAdmin = nextRole == Role.ADMIN && nextActive;
        if (isCurrentlyActiveAdmin && !willRemainActiveAdmin) {
            long activeAdmins = userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
            if (activeAdmins <= 1) {
                throw new BadRequestException(
                        "LAST_ADMIN_PROTECTION",
                        "Không thể vô hiệu hóa hoặc hạ quyền tài khoản ADMIN đang hoạt động cuối cùng."
                );
            }
        }
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng."));
    }
}
