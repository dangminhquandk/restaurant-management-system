package com.hust.rms.controller;

import com.hust.rms.dto.setting.SystemSettingsDto;
import com.hust.rms.service.SettingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint đọc/cập nhật cấu hình nhà hàng & tài khoản VietQR động (UC-14).
 */
@RestController
@RequestMapping("/api/v1/admin/settings")
public class SettingController {

    private final SettingService settingSvc;

    public SettingController(SettingService settingSvc) {
        this.settingSvc = settingSvc;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public SystemSettingsDto readSystemSettings() {
        return settingSvc.getSettings();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SystemSettingsDto saveSystemSettings(@Valid @RequestBody SystemSettingsDto payload) {
        return settingSvc.updateSettings(payload);
    }
}
