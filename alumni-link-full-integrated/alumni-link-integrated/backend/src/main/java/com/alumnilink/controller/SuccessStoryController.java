package com.alumnilink.controller;

import com.alumnilink.dto.SuccessStoryDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.SuccessStoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class SuccessStoryController {

    private final SuccessStoryService storyService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<SuccessStoryDto>> getAllStories() {
        return ResponseEntity.ok(storyService.getAllStories());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<SuccessStoryDto>> getFeaturedStories() {
        return ResponseEntity.ok(storyService.getFeaturedStories());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ALUMNI', 'ADMIN')")
    public ResponseEntity<SuccessStoryDto> createStory(@Valid @RequestBody SuccessStoryDto.CreateRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(storyService.createStory(userId, req));
    }

    @PatchMapping("/{id}/featured")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SuccessStoryDto> setFeatured(@PathVariable UUID id,
                                                        @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(storyService.setFeatured(id, body.get("featured")));
    }
}
