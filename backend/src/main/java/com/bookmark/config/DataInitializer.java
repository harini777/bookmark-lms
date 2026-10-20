package com.bookmark.config;

import com.bookmark.entity.MemberStatus;
import com.bookmark.entity.Role;
import com.bookmark.entity.User;
import com.bookmark.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createDemoUser("admin", "admin@bookmark.com", "Admin User", Role.ADMINISTRATOR, "Admin@123");
        createDemoUser("librarian", "librarian@bookmark.com", "Librarian User", Role.LIBRARIAN, "Librarian@123");
        createDemoUser("member1", "member1@bookmark.com", "Alice Johnson", Role.MEMBER, "Member@123");
        createDemoUser("member2", "member2@bookmark.com", "Bob Smith", Role.MEMBER, "Member@123");
        log.info("Demo accounts initialized.");
    }

    private void createDemoUser(String username, String email, String fullName, Role role, String rawPassword) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setFullName(fullName);
            user.setRole(role);
            user.setStatus(MemberStatus.APPROVED);
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            log.info("Created demo user: {} ({})", username, role);
        }
    }
}
