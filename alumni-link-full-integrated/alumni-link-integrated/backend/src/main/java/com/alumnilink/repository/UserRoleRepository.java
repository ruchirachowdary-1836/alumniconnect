package com.alumnilink.repository;

import com.alumnilink.model.UserRole;
import com.alumnilink.model.UserRole.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    Optional<UserRole> findByUserId(UUID userId);
    List<UserRole> findByRole(AppRole role);
    boolean existsByUserIdAndRole(UUID userId, AppRole role);
    boolean existsByRole(AppRole role);
    void deleteByUserId(UUID userId);
}
