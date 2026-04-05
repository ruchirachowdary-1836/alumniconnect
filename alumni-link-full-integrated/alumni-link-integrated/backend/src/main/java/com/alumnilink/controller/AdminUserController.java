package com.alumnilink.controller;

import com.alumnilink.dto.AdminUserDto;
import com.alumnilink.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/pending")
    public ResponseEntity<List<AdminUserDto>> pending() {
        return ResponseEntity.ok(adminUserService.listPending());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<AdminUserDto> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.approve(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> reject(@PathVariable UUID id) {
        adminUserService.reject(id);
        return ResponseEntity.noContent().build();
    }
}

