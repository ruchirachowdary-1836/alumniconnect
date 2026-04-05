package com.alumnilink.security;

import com.alumnilink.model.User;
import com.alumnilink.model.UserRole;
import com.alumnilink.repository.UserRepository;
import com.alumnilink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));

        String role = userRoleRepository.findByUserId(user.getId())
                .map(ur -> "ROLE_" + ur.getRole().name().toUpperCase())
                .orElse("ROLE_STUDENT");

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isApproved(),
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority(role))
        );
    }
}
