package com.alumnilink.controller;

import com.alumnilink.dto.JobDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<JobDto>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDto> getJob(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ALUMNI', 'ADMIN')")
    public ResponseEntity<JobDto> createJob(@Valid @RequestBody JobDto.CreateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(jobService.createJob(userId, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobDto> updateStatus(@PathVariable UUID id,
                                               @RequestBody Map<String, String> body) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(jobService.updateJobStatus(id, userId, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
        UUID userId = securityUtils.getCurrentUserId();
        jobService.deleteJob(id, userId);
        return ResponseEntity.noContent().build();
    }
}
