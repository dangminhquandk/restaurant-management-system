package com.hust.rms.dto.setting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * HUST IT3180 RMS — Thông tin cấu hình nhà hàng & tài khoản thụ hưởng VietQR động (UC-14).
 */
public record SystemSettingsDto(
        @NotBlank(message = "Tên nhà hàng không được để trống")
        @Size(max = 150, message = "Tên nhà hàng tối đa 150 ký tự")
        String restaurantName,

        @NotBlank(message = "Mã BIN ngân hàng không được để trống")
        String vietqrBankBin,

        @NotBlank(message = "Số tài khoản thụ hưởng không được để trống")
        @Size(max = 30, message = "Số tài khoản tối đa 30 ký tự")
        String vietqrAccountNumber,

        @NotBlank(message = "Tên chủ tài khoản không được để trống")
        @Size(max = 100, message = "Tên chủ tài khoản tối đa 100 ký tự")
        String vietqrAccountName
) {
}
