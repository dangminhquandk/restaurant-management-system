package com.hust.rms.service;

import com.hust.rms.common.exception.UnauthorizedException;
import com.hust.rms.domain.entity.User;
import com.hust.rms.dto.auth.AuthUserSummaryDto;
import com.hust.rms.dto.auth.CurrentUserDto;
import com.hust.rms.dto.auth.LoginRequest;
import com.hust.rms.dto.auth.LoginResponse;
import com.hust.rms.repository.UserRepository;
import com.hust.rms.security.JwtService;
import com.hust.rms.security.RmsUserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authenticates staff, kitchen, and admin credentials and issues stateless JWT tokens.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username().trim())
                .orElseThrow(() -> new UnauthorizedException(
                        "INVALID_CREDENTIALS",
                        "Tên đăng nhập hoặc mật khẩu không chính xác."
                ));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(
                    "INVALID_CREDENTIALS",
                    "Tên đăng nhập hoặc mật khẩu không chính xác."
            );
        }
        String token = jwtService.generateToken(user);
        AuthUserSummaryDto summary = new AuthUserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole()
        );
        return new LoginResponse(token, "Bearer", jwtService.getExpirationMs(), summary);
    }

    @Transactional(readOnly = true)
    public CurrentUserDto getCurrentUser(RmsUserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("UNAUTHORIZED", "Chưa đăng nhập.");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UnauthorizedException("UNAUTHORIZED", "Không tìm thấy phiên người dùng."));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa.");
        }
        return new CurrentUserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                true
        );
    }
}
