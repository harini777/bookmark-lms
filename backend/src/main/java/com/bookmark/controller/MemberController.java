package com.bookmark.controller;

import com.bookmark.dto.UpdateUserRequest;
import com.bookmark.dto.UserDTO;
import com.bookmark.entity.MemberStatus;
import com.bookmark.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<List<UserDTO>> getAllMembers() {
        return ResponseEntity.ok(userService.getAllMembers());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<List<UserDTO>> searchMembers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchMembers(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR') or #id == authentication.principal.username")
    public ResponseEntity<UserDTO> getMember(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getMemberById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getByUsername(authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateMember(@PathVariable Long id,
                                                  @RequestBody UpdateUserRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.ok(userService.updateUser(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<UserDTO> updateStatus(@PathVariable Long id,
                                                  @RequestParam MemberStatus status) {
        return ResponseEntity.ok(userService.updateStatus(id, status));
    }
}
