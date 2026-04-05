package com.alumnilink.service;

import com.alumnilink.dto.ProfileDto;
import com.alumnilink.model.Profile;
import com.alumnilink.model.User;
import com.alumnilink.model.UserRole.AppRole;
import com.alumnilink.repository.ProfileRepository;
import com.alumnilink.repository.UserRepository;
import com.alumnilink.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;

    public List<ProfileDto> getAllProfiles() {
        return profileRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ProfileDto> getAlumniProfiles() {
        List<UUID> alumniIds = userRoleRepository.findByRole(AppRole.alumni)
                .stream().map(ur -> ur.getUserId()).collect(Collectors.toList());
        return profileRepository.findByUserIdIn(alumniIds).stream()
                .map(p -> {
                    ProfileDto dto = toDto(p);
                    dto.setRole("alumni");
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public ProfileDto getProfileByUserId(UUID userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return toDto(profile);
    }

    public ProfileDto getProfileById(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return toDto(profile);
    }

    @Transactional
    public ProfileDto updateProfile(UUID userId, ProfileDto.UpdateRequest req) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (req.getName() != null) profile.setName(req.getName());
        if (req.getRollNo() != null) profile.setRollNo(req.getRollNo());
        if (req.getDepartment() != null) profile.setDepartment(req.getDepartment());
        if (req.getCompany() != null) profile.setCompany(req.getCompany());
        if (req.getPackageAmount() != null) profile.setPackageAmount(req.getPackageAmount());
        if (req.getBatch() != null) profile.setBatch(req.getBatch());
        if (req.getJobRole() != null) profile.setJobRole(req.getJobRole());
        if (req.getExpertise() != null) profile.setExpertise(req.getExpertise());
        if (req.getBio() != null) profile.setBio(req.getBio());
        if (req.getAvatarUrl() != null) profile.setAvatarUrl(req.getAvatarUrl());
        if (req.getAvailable() != null) profile.setAvailable(req.getAvailable());

        return toDto(profileRepository.save(profile));
    }

    private ProfileDto toDto(Profile p) {
        ProfileDto dto = new ProfileDto();
        dto.setId(p.getId());
        dto.setUserId(p.getUserId());
        dto.setName(p.getName());
        dto.setRollNo(p.getRollNo());
        dto.setDepartment(p.getDepartment());
        dto.setCompany(p.getCompany());
        dto.setPackageAmount(p.getPackageAmount());
        dto.setBatch(p.getBatch());
        dto.setJobRole(p.getJobRole());
        dto.setExpertise(p.getExpertise());
        dto.setBio(p.getBio());
        dto.setAvatarUrl(p.getAvatarUrl());
        dto.setAvailable(p.getAvailable());
        userRepository.findById(p.getUserId()).ifPresent(user -> {
            dto.setEmail(user.getEmail());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setPhoneVerified(user.isPhoneVerified());
        });
        // Enrich with role
        userRoleRepository.findByUserId(p.getUserId())
                .ifPresent(ur -> dto.setRole(ur.getRole().name()));
        return dto;
    }
}
