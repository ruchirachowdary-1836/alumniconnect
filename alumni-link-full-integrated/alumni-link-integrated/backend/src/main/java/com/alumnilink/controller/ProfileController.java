package com.alumnilink.controller;

import com.alumnilink.dto.ProfileDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<ProfileDto>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @GetMapping("/alumni")
    public ResponseEntity<List<ProfileDto>> getAlumniProfiles() {
        return ResponseEntity.ok(profileService.getAlumniProfiles());
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getMyProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(profileService.getProfileByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfileDto> getProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(profileService.getProfileById(id));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfileDto> updateMyProfile(@RequestBody ProfileDto.UpdateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(profileService.updateProfile(userId, req));
    }
}
