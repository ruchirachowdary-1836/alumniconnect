package com.alumnilink.controller;

import com.alumnilink.dto.DiscussionDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.DiscussionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<DiscussionDto.PostResponse>> getAllPosts() {
        return ResponseEntity.ok(discussionService.getAllPosts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscussionDto.PostResponse> getPost(@PathVariable UUID id) {
        return ResponseEntity.ok(discussionService.getPost(id));
    }

    @PostMapping
    public ResponseEntity<DiscussionDto.PostResponse> createPost(
            @Valid @RequestBody DiscussionDto.CreatePostRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(discussionService.createPost(userId, req));
    }

    @PostMapping("/{postId}/replies")
    public ResponseEntity<DiscussionDto.ReplyResponse> createReply(
            @PathVariable UUID postId,
            @Valid @RequestBody DiscussionDto.CreateReplyRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(discussionService.createReply(postId, userId, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        UUID userId = securityUtils.getCurrentUserId();
        discussionService.deletePost(id, userId);
        return ResponseEntity.noContent().build();
    }
}
