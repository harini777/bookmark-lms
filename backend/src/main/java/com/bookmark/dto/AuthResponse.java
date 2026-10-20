package com.bookmark.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String role;
    private String fullName;

    public AuthResponse(String token, Long userId, String username, String role, String fullName) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }
}
