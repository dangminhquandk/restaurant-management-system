package com.hust.rms.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.*;
import com.hust.rms.domain.enums.Role;
import com.hust.rms.dto.auth.LoginRequest;
import com.hust.rms.dto.setting.SystemSettingsDto;
import com.hust.rms.dto.user.*;
import com.hust.rms.repository.*;
import com.hust.rms.security.JwtService;
import com.hust.rms.security.RmsUserPrincipal;
import java.util.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * HUST IT3180 RMS — Kiểm thử đơn vị phủ nhánh cho AuthService, UserService, SettingService và AuditLogService.
 */
class AuthUserAndSettingBranchUnitTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("AuthService: phủ toàn bộ nhánh đăng nhập, tài khoản khóa, sai mật khẩu và phiên hiện tại")
    void authServiceAllBranches() {
        UserRepository userRepo = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        JwtService jwtSvc = mock(JwtService.class);
        AuthService authSvc = new AuthService(userRepo, encoder, jwtSvc);

        when(userRepo.findByUsername("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authSvc.login(new LoginRequest("ghost", "123456")))
                .isInstanceOf(UnauthorizedException.class);

        User staff = new User();
        staff.setId(2L);
        staff.setUsername("staff1");
        staff.setFullName("Nhân viên 1");
        staff.setPasswordHash("hashed");
        staff.setRole(Role.STAFF);
        staff.setIsActive(false);

        when(userRepo.findByUsername("staff1")).thenReturn(Optional.of(staff));
        assertThatThrownBy(() -> authSvc.login(new LoginRequest(" staff1 ", "staff123")))
                .isInstanceOf(UnauthorizedException.class);

        staff.setIsActive(true);
        when(encoder.matches("wrong", "hashed")).thenReturn(false);
        assertThatThrownBy(() -> authSvc.login(new LoginRequest("staff1", "wrong")))
                .isInstanceOf(UnauthorizedException.class);

        when(encoder.matches("staff123", "hashed")).thenReturn(true);
        when(jwtSvc.generateToken(staff)).thenReturn("jwt-token");
        when(jwtSvc.getExpirationMs()).thenReturn(28800000L);
        assertThat(authSvc.login(new LoginRequest("staff1", "staff123")).accessToken()).isEqualTo("jwt-token");

        assertThatThrownBy(() -> authSvc.getCurrentUser(null)).isInstanceOf(UnauthorizedException.class);

        RmsUserPrincipal principal = RmsUserPrincipal.fromUser(staff);
        when(userRepo.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authSvc.getCurrentUser(principal)).isInstanceOf(UnauthorizedException.class);

        staff.setIsActive(false);
        when(userRepo.findById(2L)).thenReturn(Optional.of(staff));
        assertThatThrownBy(() -> authSvc.getCurrentUser(principal)).isInstanceOf(UnauthorizedException.class);

        staff.setIsActive(true);
        assertThat(authSvc.getCurrentUser(principal).username()).isEqualTo("staff1");
    }

    @Test
    @DisplayName("UserService: phủ toàn bộ nhánh tạo/sửa tài khoản, kiểm tra định dạng mật khẩu và bảo vệ ADMIN cuối cùng")
    void userServiceAllBranches() {
        UserRepository userRepo = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AuditLogService auditSvc = mock(AuditLogService.class);
        UserService userSvc = new UserService(userRepo, encoder, auditSvc);

        User admin = new User();
        admin.setId(1L);
        admin.setUsername("admin");
        admin.setFullName("Quản trị viên");
        admin.setRole(Role.ADMIN);
        admin.setIsActive(true);

        when(userRepo.findAllByOrderByIdAsc()).thenReturn(List.of(admin));
        assertThat(userSvc.listUsers()).hasSize(1);

        when(userRepo.existsByUsernameIgnoreCase("admin")).thenReturn(true);
        assertThatThrownBy(() -> userSvc.createUser(
                new CreateUserRequest(" admin ", "secret1", "Admin", Role.ADMIN, null)))
                .isInstanceOf(ConflictException.class);

        when(userRepo.existsByUsernameIgnoreCase("kitchen2")).thenReturn(false);
        when(encoder.encode(any())).thenReturn("bcrypt");
        when(userRepo.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) {
                u.setId(9L);
            }
            return u;
        });
        UserDto created = userSvc.createUser(
                new CreateUserRequest(" kitchen2 ", "secret1", " Đầu bếp 2 ", Role.KITCHEN, null));
        assertThat(created.isActive()).isTrue();

        when(userRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userSvc.updateUserStatus(99L, new UpdateUserStatusRequest(false)))
                .isInstanceOf(ResourceNotFoundException.class);

        when(userRepo.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepo.countByRoleAndIsActiveTrue(Role.ADMIN)).thenReturn(1L);
        assertThatThrownBy(() -> userSvc.updateUser(
                1L, new UpdateUserRequest(null, null, "Admin", Role.STAFF, true)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> userSvc.updateUserStatus(1L, new UpdateUserStatusRequest(false)))
                .isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> userSvc.updateUser(
                1L, new UpdateUserRequest("bad space!", null, "Admin", Role.ADMIN, null)))
                .isInstanceOf(BadRequestException.class);

        when(userRepo.existsByUsernameIgnoreCaseAndIdNot("dup_user", 1L)).thenReturn(true);
        assertThatThrownBy(() -> userSvc.updateUser(
                1L, new UpdateUserRequest("dup_user", null, "Admin", Role.ADMIN, true)))
                .isInstanceOf(ConflictException.class);

        assertThatThrownBy(() -> userSvc.updateUser(
                1L, new UpdateUserRequest("   ", "123", "Admin", Role.ADMIN, true)))
                .isInstanceOf(BadRequestException.class);

        when(userRepo.existsByUsernameIgnoreCaseAndIdNot("admin.pro", 1L)).thenReturn(false);
        when(userRepo.countByRoleAndIsActiveTrue(Role.ADMIN)).thenReturn(2L);
        UserDto updated = userSvc.updateUser(
                1L, new UpdateUserRequest("admin.pro", "strong123", "Admin Mới", Role.STAFF, false));
        assertThat(updated.username()).isEqualTo("admin.pro");
        assertThat(updated.role()).isEqualTo(Role.STAFF);

        UserDto reactivated = userSvc.updateUserStatus(1L, new UpdateUserStatusRequest(true));
        assertThat(reactivated.isActive()).isTrue();
    }

    @Test
    @DisplayName("SettingService & AuditLogService: phủ nhánh fallback VietQR, kiểm tra BIN 6 chữ số và SecurityContext")
    void settingAndAuditLogAllBranches() {
        SystemSettingRepository settingRepo = mock(SystemSettingRepository.class);
        AuditLogRepository auditRepo = mock(AuditLogRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        AuditLogService auditSvc = new AuditLogService(auditRepo, userRepo);
        SettingService settingSvc = new SettingService(
                settingRepo, auditSvc, "970415", "113366668888", "NHA HANG DEMO IT3180");

        SystemSetting blankName = new SystemSetting();
        blankName.setSettingKey("RESTAURANT_NAME");
        blankName.setSettingValue("   ");
        when(settingRepo.findAll()).thenReturn(List.of(blankName));
        SystemSettingsDto defaults = settingSvc.getSettings();
        assertThat(defaults.vietqrBankBin()).isEqualTo("970415");

        assertThatThrownBy(() -> settingSvc.updateSettings(
                new SystemSettingsDto("Quán", "12AB", "123", "TEN")))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> settingSvc.updateSettings(
                new SystemSettingsDto("   ", "970436", "123", "TEN")))
                .isInstanceOf(BadRequestException.class);

        SystemSetting existingBin = new SystemSetting();
        existingBin.setSettingKey("VIETQR_BANK_BIN");
        existingBin.setSettingValue("970415");
        when(settingRepo.findById("VIETQR_BANK_BIN")).thenReturn(Optional.of(existingBin));
        when(settingRepo.findById(argThat(k -> !"VIETQR_BANK_BIN".equals(k)))).thenReturn(Optional.empty());

        // Test AuditLogService with 3 SecurityContext states: empty, non-RmsUserPrincipal, and RmsUserPrincipal
        auditSvc.logCurrentActor("TEST_ANON", "SYSTEM", null, "No auth");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("plain-string-principal", null, List.of()));
        settingSvc.updateSettings(new SystemSettingsDto("Bách Khoa Quán", "970436", "99998888", "DANG MINH QUAN"));

        User actor = new User();
        actor.setId(1L);
        actor.setUsername("admin");
        actor.setPasswordHash("pw");
        actor.setFullName("Quân");
        actor.setRole(Role.ADMIN);
        actor.setIsActive(true);
        when(userRepo.findById(1L)).thenReturn(Optional.of(actor));
        RmsUserPrincipal rmsPrincipal = RmsUserPrincipal.fromUser(actor);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(rmsPrincipal, null, rmsPrincipal.getAuthorities()));
        auditSvc.logCurrentActor("TEST_AUTH", "USERS", 1L, "With RmsUserPrincipal");

        verify(auditRepo, times(3)).save(any(AuditLog.class));
    }
}
