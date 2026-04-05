package com.alumnilink.service;

import com.alumnilink.dto.AdminUserDto;
import com.alumnilink.model.User;
import com.alumnilink.model.UserRole;
import com.alumnilink.model.UserRole.AppRole;
import com.alumnilink.repository.UserRepository;
import com.alumnilink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public List<AdminUserDto> listPending() {
        return userRepository.findByApprovedFalseOrderByCreatedAtAsc().stream()
                .map(this::toDtoIfNotAdmin)
                .filter(dto -> dto != null)
                .toList();
    }

    @Transactional
    public AdminUserDto approve(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserRole role = userRoleRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User role not found"));

        if (role.getRole() == AppRole.admin) {
            throw new SecurityException("Admin users do not require approval");
        }

        user.setApproved(true);
        userRepository.save(user);
        return toDto(user, role.getRole().name());
    }

    @Transactional
    public void reject(UUID userId) {
        if (!userRepository.existsById(userId)) {
            return;
        }
        userRoleRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    private AdminUserDto toDtoIfNotAdmin(User user) {
        String role = userRoleRepository.findByUserId(user.getId())
                .map(ur -> ur.getRole().name())
                .orElse("student");

        if ("admin".equalsIgnoreCase(role)) {
            return null;
        }
        return toDto(user, role);
    }

    private AdminUserDto toDto(User user, String role) {
        return new AdminUserDto(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                role,
                user.isApproved(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null
        );
    }
}

