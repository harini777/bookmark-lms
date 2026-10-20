package com.bookmark.controller;

import com.bookmark.dto.UserDTO;
import com.bookmark.entity.Role;
import com.bookmark.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(@PathVariable Long id,
                                                  @RequestParam Role role,
                                                  Authentication authentication) {
        return ResponseEntity.ok(adminService.updateUserRole(id, role, authentication.getName()));
    }

    @GetMapping("/backup")
    public ResponseEntity<Map<String, Object>> exportBackup() {
        return ResponseEntity.ok(adminService.exportDatabaseBackup());
    }

    @PostMapping("/restore")
    public ResponseEntity<Map<String, Object>> restoreBackup(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminService.restoreDatabaseBackup(payload));
    }
}
