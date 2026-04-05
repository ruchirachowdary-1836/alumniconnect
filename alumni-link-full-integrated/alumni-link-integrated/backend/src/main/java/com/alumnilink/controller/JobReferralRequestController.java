package com.alumnilink.controller;

import com.alumnilink.dto.JobReferralRequestDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.JobReferralRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class JobReferralRequestController {

    private final JobReferralRequestService referralRequestService;
    private final SecurityUtils securityUtils;

    @PostMapping(value = "/api/jobs/{jobId}/referral-requests", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<JobReferralRequestDto> create(@PathVariable UUID jobId,
                                                       @RequestPart("resume") MultipartFile resume,
                                                       @RequestPart(value = "message", required = false) String message) {
        UUID studentId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(referralRequestService.create(jobId, studentId, resume, message));
    }

    @GetMapping("/api/referral-requests/alumni")
    @PreAuthorize("hasRole('ALUMNI')")
    public ResponseEntity<List<JobReferralRequestDto>> forAlumni() {
        UUID alumniId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(referralRequestService.listForAlumni(alumniId));
    }

    @GetMapping("/api/referral-requests/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<JobReferralRequestDto>> forStudent() {
        UUID studentId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(referralRequestService.listForStudent(studentId));
    }

    @PatchMapping("/api/referral-requests/{id}/status")
    @PreAuthorize("hasRole('ALUMNI')")
    public ResponseEntity<JobReferralRequestDto> updateStatus(@PathVariable UUID id,
                                                             @Valid @RequestBody JobReferralRequestDto.UpdateStatusRequest req) {
        UUID alumniId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(referralRequestService.updateStatus(id, alumniId, req.getStatus()));
    }

    @GetMapping("/api/referral-requests/{id}/resume")
    public ResponseEntity<byte[]> downloadResume(@PathVariable UUID id) {
        UUID requesterId = securityUtils.getCurrentUserId();
        var r = referralRequestService.getForResume(id, requesterId);

        String fileName = (r.getResumeFileName() == null || r.getResumeFileName().isBlank())
                ? "resume"
                : r.getResumeFileName().trim();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName.replace("\"", "") + "\"")
                .contentType(MediaType.parseMediaType(r.getResumeContentType()))
                .body(r.getResumeData());
    }
}

