package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.domain.entity.SystemSetting;
import com.hust.rms.dto.setting.SystemSettingsDto;
import com.hust.rms.repository.SystemSettingRepository;
import java.time.Instant;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Quản lý cấu hình hệ thống & tham số tài khoản NAPAS VietQR động (UC-14, FR-17).
 */
@Service
public class SettingService {

    private static final String KEY_RESTAURANT_NAME = "RESTAURANT_NAME";
    private static final String KEY_BANK_BIN = "VIETQR_BANK_BIN";
    private static final String KEY_ACCOUNT_NUMBER = "VIETQR_ACCOUNT_NUMBER";
    private static final String KEY_ACCOUNT_NAME = "VIETQR_ACCOUNT_NAME";
    private static final String DEFAULT_RESTAURANT_NAME = "Nhà Hàng Bách Khoa Bistro";
    private static final Pattern BANK_BIN_PATTERN = Pattern.compile("^\\d{6}$");

    private final SystemSettingRepository settingRepo;
    private final AuditLogService auditLogSvc;
    private final String fallbackBankBin;
    private final String fallbackAccountNumber;
    private final String fallbackAccountName;

    public SettingService(
            SystemSettingRepository settingRepo,
            AuditLogService auditLogSvc,
            @Value("${app.vietqr.bank-bin:970415}") String fallbackBankBin,
            @Value("${app.vietqr.account-number:113366668888}") String fallbackAccountNumber,
            @Value("${app.vietqr.account-name:NHA HANG DEMO IT3180}") String fallbackAccountName
    ) {
        this.settingRepo = settingRepo;
        this.auditLogSvc = auditLogSvc;
        this.fallbackBankBin = fallbackBankBin;
        this.fallbackAccountNumber = fallbackAccountNumber;
        this.fallbackAccountName = fallbackAccountName;
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        Map<String, String> kv = settingRepo.findAll().stream()
                .collect(Collectors.toMap(
                        SystemSetting::getSettingKey,
                        SystemSetting::getSettingValue,
                        (a, b) -> b
                ));
        return new SystemSettingsDto(
                resolveValue(kv, KEY_RESTAURANT_NAME, DEFAULT_RESTAURANT_NAME),
                resolveValue(kv, KEY_BANK_BIN, fallbackBankBin),
                resolveValue(kv, KEY_ACCOUNT_NUMBER, fallbackAccountNumber),
                resolveValue(kv, KEY_ACCOUNT_NAME, fallbackAccountName)
        );
    }

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto req) {
        String bin = req.vietqrBankBin() != null ? req.vietqrBankBin().trim() : "";
        if (!BANK_BIN_PATTERN.matcher(bin).matches()) {
            throw new BadRequestException(
                    "INVALID_BANK_BIN",
                    "Mã BIN ngân hàng NAPAS phải gồm đúng 6 chữ số (ví dụ: 970415)."
            );
        }
        String accNo = req.vietqrAccountNumber() != null ? req.vietqrAccountNumber().trim() : "";
        String accName = req.vietqrAccountName() != null ? req.vietqrAccountName().trim() : "";
        String restName = req.restaurantName() != null ? req.restaurantName().trim() : "";
        if (accNo.isEmpty() || accName.isEmpty() || restName.isEmpty()) {
            throw new BadRequestException("INVALID_SETTINGS", "Các trường cấu hình không được để trống.");
        }

        Instant now = Instant.now();
        upsertSetting(KEY_RESTAURANT_NAME, restName, now);
        upsertSetting(KEY_BANK_BIN, bin, now);
        upsertSetting(KEY_ACCOUNT_NUMBER, accNo, now);
        upsertSetting(KEY_ACCOUNT_NAME, accName, now);
        settingRepo.flush();

        auditLogSvc.logCurrentActor(
                "SETTINGS_UPDATED",
                "SYSTEM_SETTINGS",
                null,
                String.format("Cập nhật cấu hình nhà hàng '%s' & VietQR BIN=%s, STK=%s", restName, bin, accNo)
        );
        return new SystemSettingsDto(restName, bin, accNo, accName);
    }

    private void upsertSetting(String key, String value, Instant now) {
        SystemSetting entity = settingRepo.findById(key).orElseGet(() -> {
            SystemSetting created = new SystemSetting();
            created.setSettingKey(key);
            return created;
        });
        entity.setSettingValue(value);
        entity.setUpdatedAt(now);
        settingRepo.save(entity);
    }

    private static String resolveValue(Map<String, String> kv, String key, String fallback) {
        String v = kv.get(key);
        return (v != null && !v.isBlank()) ? v : fallback;
    }
}
