package com.bookmark.service;

import com.bookmark.dto.UpdateUserRequest;
import com.bookmark.dto.UserDTO;
import com.bookmark.entity.MemberStatus;
import com.bookmark.entity.Role;
import com.bookmark.entity.User;
import com.bookmark.exception.BadRequestException;
import com.bookmark.exception.ResourceNotFoundException;
import com.bookmark.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserDTO> getAllMembers() {
        return userRepository.findByRole(Role.MEMBER).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDTO> searchMembers(String query) {
        return userRepository.searchMembers(query, Role.MEMBER).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDTO getMemberById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDTO.fromEntity(user);
    }

    public UserDTO getByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!user.getEmail().equals(request.getEmail()) &&
                    userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email is already in use");
            }
            user.setEmail(request.getEmail());
        }

        return UserDTO.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateStatus(Long id, MemberStatus status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setStatus(status);
        return UserDTO.fromEntity(userRepository.save(user));
    }
}
