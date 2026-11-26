package com.hust.rms.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hust.rms.domain.enums.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(max = 50, message = "Tên đăng nhập tối đa 50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Tên đăng nhập chỉ gồm chữ, số và ký tự _ . -")
        String username,
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
        String password,
        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 120, message = "Họ và tên tối đa 120 ký tự")
        String fullName,
        @NotNull(message = "Vai trò không được để trống")
        Role role,
        @JsonProperty("isActive") Boolean isActive
) {
}
