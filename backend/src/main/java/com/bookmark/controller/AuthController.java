package com.bookmark.controller;

import com.bookmark.dto.AuthResponse;
import com.bookmark.dto.LoginRequest;
import com.bookmark.dto.RegisterRequest;
import com.bookmark.dto.UserDTO;
import com.bookmark.entity.User;
import com.bookmark.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDTO.fromEntity(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, Object>> forgotPassword(@Valid @RequestBody com.bookmark.dto.ForgotPasswordRequest request) {
        boolean exists = authService.forgotPassword(request.getUsernameOrEmail());
        if (!exists) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", "User with provided username/email not found"));
        }
        return ResponseEntity.ok(java.util.Map.of("message", "Identity verified. You may proceed to reset password."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@Valid @RequestBody com.bookmark.dto.ResetPasswordRequest request) {
        authService.resetPassword(request.getUsernameOrEmail(), request.getNewPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully. You can now login."));
    }
}
