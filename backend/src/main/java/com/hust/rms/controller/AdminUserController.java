package com.hust.rms.controller;

import com.hust.rms.dto.user.*;
import com.hust.rms.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint Quản trị tài khoản nhân sự & RBAC (FR-03, UC-12).
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userSvc;

    public AdminUserController(UserService userSvc) {
        this.userSvc = userSvc;
    }

    @GetMapping
    public List<UserDto> listStaffAccounts() {
        return userSvc.listUsers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto registerStaffAccount(@Valid @RequestBody CreateUserRequest payload) {
        return userSvc.createUser(payload);
    }

    @PutMapping("/{id}")
    public UserDto modifyStaffAccount(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest payload) {
        return userSvc.updateUser(id, payload);
    }

    @PatchMapping("/{id}/status")
    public UserDto switchStaffActiveStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest payload
    ) {
        return userSvc.updateUserStatus(id, payload);
    }
}
