package com.hust.rms.controller;

import com.hust.rms.dto.auth.*;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint cho UC-01 (Xác thực JWT và phiên nhân viên).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authSvc;

    public AuthController(AuthService authSvc) {
        this.authSvc = authSvc;
    }

    @PostMapping("/login")
    public LoginResponse authenticateShift(@Valid @RequestBody LoginRequest payload) {
        return authSvc.login(payload);
    }

    @GetMapping("/me")
    public CurrentUserDto fetchCurrentShiftProfile(@AuthenticationPrincipal RmsUserPrincipal actor) {
        return authSvc.getCurrentUser(actor);
    }
}
