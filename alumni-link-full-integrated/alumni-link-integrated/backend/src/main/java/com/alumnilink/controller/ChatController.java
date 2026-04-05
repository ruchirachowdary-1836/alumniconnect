package com.alumnilink.controller;

import com.alumnilink.dto.ChatDto;
import com.alumnilink.security.SecurityUtils;
import com.alumnilink.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<ChatDto.ThreadDto>> myThreads() {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.listMyThreads(userId));
    }

    @PostMapping("/from-mentorship/{mentorshipId}")
    public ResponseEntity<ChatDto.ThreadDto> fromMentorship(@PathVariable UUID mentorshipId) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.getOrCreateThreadFromMentorship(mentorshipId, userId));
    }

    @PostMapping("/from-referral/{referralRequestId}")
    public ResponseEntity<ChatDto.ThreadDto> fromReferral(@PathVariable UUID referralRequestId) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.getOrCreateThreadFromReferral(referralRequestId, userId));
    }

    @GetMapping("/{threadId}/messages")
    public ResponseEntity<List<ChatDto.MessageDto>> messages(@PathVariable UUID threadId) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.getMessages(threadId, userId));
    }

    @PostMapping("/{threadId}/messages")
    public ResponseEntity<ChatDto.MessageDto> send(@PathVariable UUID threadId,
                                                   @Valid @RequestBody ChatDto.SendMessageRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(chatService.sendMessage(threadId, userId, req.getContent()));
    }
}
