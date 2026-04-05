package com.alumnilink.controller;

import com.alumnilink.dto.MentorshipDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.MentorshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mentorship")
@RequiredArgsConstructor
public class MentorshipController {

    private final MentorshipService mentorshipService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<MentorshipDto>> getMyRequests() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(mentorshipService.getRequestsForUser(userId));
    }

    @PostMapping
    public ResponseEntity<MentorshipDto> createRequest(@Valid @RequestBody MentorshipDto.CreateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(mentorshipService.createRequest(userId, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MentorshipDto> updateStatus(@PathVariable UUID id,
                                                       @Valid @RequestBody MentorshipDto.UpdateStatusRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(mentorshipService.updateStatus(id, userId, req));
    }
}
