package com.bookmark.service;

import com.bookmark.dto.AuthResponse;
import com.bookmark.dto.LoginRequest;
import com.bookmark.dto.RegisterRequest;
import com.bookmark.entity.MemberStatus;
import com.bookmark.entity.Role;
import com.bookmark.entity.User;
import com.bookmark.exception.BadRequestException;
import com.bookmark.repository.UserRepository;
import com.bookmark.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();

        return new AuthResponse(token, user.getId(), user.getUsername(),
                user.getRole().name(), user.getFullName());
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.MEMBER);
        user.setStatus(MemberStatus.APPROVED);

        return userRepository.save(user);
    }

    public boolean forgotPassword(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .isPresent();
    }

    @Transactional
    public void resetPassword(String usernameOrEmail, String newPassword) {
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new BadRequestException("No account found with username or email: " + usernameOrEmail));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
