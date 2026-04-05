package com.alumnilink.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ChatDto {

    @Data
    public static class ThreadDto {
        private UUID id;
        private String kind; // mentorship | referral
        private UUID mentorshipRequestId;
        private UUID referralRequestId;
        private UUID studentId;
        private UUID alumniId;
        private String studentName;
        private String alumniName;
        private String contextTitle;
        private OffsetDateTime createdAt;
        private OffsetDateTime lastMessageAt;
        private String lastMessage;
    }

    @Data
    public static class MessageDto {
        private UUID id;
        private UUID threadId;
        private UUID senderId;
        private String content;
        private OffsetDateTime createdAt;
    }

    @Data
    public static class SendMessageRequest {
        @NotBlank
        private String content;
    }
}
